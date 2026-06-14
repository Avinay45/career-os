'use server';

import { authenticateUser } from '@/features/auth/services/server-auth';
import { uploadResumeFile, downloadResumeFile } from '../services/storage';
import { ResumeStatus } from '../types';
import { runResumeAnalysisOrchestrator } from '../services/analysis-orchestrator';
import * as pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { checkRateLimit } from '@/lib/rate-limiter';

// Defensive import parsing for ESM / CommonJS compat
const parsePdf = typeof pdf === 'function' ? pdf : ((pdf as any).default || pdf);

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function computeCounts(text: string) {
  const cleanText = text.trim();
  const word_count = cleanText ? cleanText.split(/\s+/).length : 0;
  const character_count = text.length;
  return { word_count, character_count };
}

/**
 * Server-side parser dispatcher.
 */
async function extractText(buffer: Buffer, ext: string): Promise<string> {
  if (ext === 'pdf') {
    const data = await parsePdf(buffer);
    return data.text || '';
  } else if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } else if (ext === 'txt') {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported parser type for: .${ext}`);
}

/**
 * Server Action: Ingests, stores, and parses a resume document.
 */
export async function uploadAndParseResumeAction(formData: FormData) {
  const file = formData.get('file') as File | null;
  const titleInput = formData.get('title') as string | null;

  if (!file) {
    return { success: false, error: 'No file uploaded.' };
  }

  const title = titleInput || file.name;
  const mimeType = file.type;
  const fileSize = file.size;
  const ext = getExtension(file.name);

  // 1. Validations
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { success: false, error: `Invalid file extension .${ext}. Only PDF, DOCX, and TXT are supported.` };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return { success: false, error: `File size exceeds 5MB limit (${(fileSize / (1024 * 1024)).toFixed(2)}MB).` };
  }

  // 2. Auth Session Check
  const { user, supabase } = await authenticateUser();

  // Enforce rate limiting: 5 uploads per 10 minutes per user
  const { limited, retryAfterSeconds } = checkRateLimit(`resume-upload:${user.id}`, {
    limit: 5,
    intervalSeconds: 600, // 10 minutes
  });
  if (limited) {
    return {
      success: false,
      error: `Rate limit exceeded. Please try again after ${retryAfterSeconds} seconds.`,
    };
  }

  let resumeId = '';
  try {
    // 3. Database Insert (draft)
    const { data: dbData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title,
        status: 'draft' as ResumeStatus,
        mime_type: mimeType,
        file_size: fileSize,
      })
      .select('id')
      .single();

    if (dbError || !dbData) throw dbError || new Error('Failed to insert initial database entry.');
    resumeId = dbData.id;

    // 4. Supabase Storage Upload
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    const storagePath = await uploadResumeFile(user.id, resumeId, ext, fileBuffer, mimeType);

    // Update database to 'uploaded' and set URL
    await supabase
      .from('resumes')
      .update({
        status: 'uploaded' as ResumeStatus,
        file_url: storagePath,
      })
      .eq('id', resumeId);

    // 5. Trigger Parsing
    await supabase
      .from('resumes')
      .update({ status: 'parsing' as ResumeStatus })
      .eq('id', resumeId);

    const extractedRawText = await extractText(fileBuffer, ext);
    const { word_count, character_count } = computeCounts(extractedRawText);

    // Save final parsed data
    const { error: finalError } = await supabase
      .from('resumes')
      .update({
        status: 'parsed' as ResumeStatus,
        content: extractedRawText,
        word_count,
        character_count,
      })
      .eq('id', resumeId);

    if (finalError) throw finalError;

    // Trigger AI Analysis orchestrator automatically (no second button click required)
    const analysisSuccess = await runResumeAnalysisOrchestrator(resumeId);

    return { success: true, resumeId, analyzed: analysisSuccess };

  } catch (error: any) {
    console.error('Resume ingestion process failure:', error);
    
    // Update state to analysis_failed for retrying
    if (resumeId) {
      await supabase
        .from('resumes')
        .update({ status: 'analysis_failed' as ResumeStatus })
        .eq('id', resumeId);
    }

    return { 
      success: false, 
      error: error.message || 'An error occurred during resume processing.',
      resumeId: resumeId || null 
    };
  }
}

/**
 * Server Action: Retry-safe parser recovery.
 * Re-downloads file from storage and attempts parsing again if first attempt failed.
 */
export async function retryParseResumeAction(resumeId: string) {
  // 1. Verify Authentication & Ownership
  const { user, supabase } = await authenticateUser();

  // Get active record
  const { data: resume, error: readError } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (readError || !resume) {
    return { success: false, error: 'Resume record not found.' };
  }

  if (resume.user_id !== user.id) {
    return { success: false, error: 'Unauthorized access to this document.' };
  }

  if (!resume.file_url) {
    return { success: false, error: 'No raw document path found in storage to retry parsing.' };
  }

  const ext = getExtension(resume.title);

  try {
    // Set status to parsing
    await supabase
      .from('resumes')
      .update({ status: 'parsing' as ResumeStatus })
      .eq('id', resumeId);

    // Download buffer from storage
    const fileBuffer = await downloadResumeFile(resume.file_url);

    // Run extraction
    const extractedRawText = await extractText(fileBuffer, ext);
    const { word_count, character_count } = computeCounts(extractedRawText);

    // Update DB
    const { error: finalError } = await supabase
      .from('resumes')
      .update({
        status: 'parsed' as ResumeStatus,
        content: extractedRawText,
        word_count,
        character_count,
      })
      .eq('id', resumeId);

    if (finalError) throw finalError;

    // Trigger AI Analysis orchestrator automatically
    const analysisSuccess = await runResumeAnalysisOrchestrator(resumeId);

    return { success: true, analyzed: analysisSuccess };

  } catch (error: any) {
    console.error('Retry parsing process failure:', error);
    
    await supabase
      .from('resumes')
      .update({ status: 'analysis_failed' as ResumeStatus })
      .eq('id', resumeId);

    return { success: false, error: error.message || 'Retry parsing failed.' };
  }
}

/**
 * Server Action: Manually triggers AI analysis retry if previous analysis failed.
 */
export async function retryAnalysisAction(resumeId: string) {
  // 1. Verify Authentication & Ownership
  const { user, supabase } = await authenticateUser();

  // Get active record
  const { data: resume, error: readError } = await supabase
    .from('resumes')
    .select('user_id')
    .eq('id', resumeId)
    .single();

  if (readError || !resume) {
    return { success: false, error: 'Resume record not found.' };
  }

  if (resume.user_id !== user.id) {
    return { success: false, error: 'Unauthorized access.' };
  }

  // Trigger analysis orchestrator
  const success = await runResumeAnalysisOrchestrator(resumeId);
  if (!success) {
    return { success: false, error: 'AI Analysis failed. Please check logs and try again.' };
  }

  return { success: true };
}
