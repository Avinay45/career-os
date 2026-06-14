import { getSupabaseAdmin } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const BUCKET_NAME = 'career-resumes';

/**
 * Ensures that the private career-resumes bucket exists in Supabase.
 * Attempts to create it if it is missing.
 * NOTE: Uses supabaseAdmin (service_role) as this is a system maintenance task.
 */
export async function ensureBucketExists() {
  const supabase = getSupabaseAdmin();
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const exists = buckets.some((b) => b.id === BUCKET_NAME);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // Enforce private bucket
        allowedMimeTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        fileSizeLimit: 5242880, // 5MB limit
      });
      if (createError) throw createError;
      console.log(`Supabase Storage private bucket "${BUCKET_NAME}" created successfully.`);
    }
  } catch (error) {
    console.error('Failed to verify/create storage bucket:', error);
  }
}

/**
 * Uploads a file buffer to the private user-uuid path inside career-resumes.
 * Path: career-resumes/{user_uuid}/{resume_id}.{ext}
 */
export async function uploadResumeFile(
  userId: string,
  resumeId: string,
  ext: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  await ensureBucketExists();
  const supabase = await createSupabaseServerClient();
  const filePath = `${userId}/${resumeId}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
  return data.path; // returns: "user_uuid/resume_id.ext"
}

/**
 * Deletes a resume file from storage.
 */
export async function deleteResumeFile(storagePath: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
}

/**
 * Downloads a resume file buffer from storage.
 */
export async function downloadResumeFile(storagePath: string): Promise<Buffer> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(storagePath);
  if (error) {
    console.error('Error downloading file from storage:', error);
    throw error;
  }
  
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates a secure temporary signed URL for downloading/viewing.
 */
export async function generateSecureSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
  return data.signedUrl;
}
