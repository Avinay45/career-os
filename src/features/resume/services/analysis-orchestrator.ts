import { createSupabaseServerClient } from '@/lib/supabase-server';
import { queryOpenRouter, ChatMessage } from '@/lib/openrouter';
import { ResumeStatus } from '../types';

interface AIAnalysisOutput {
  atsScore: number;
  formattingScore: number;
  keywordScore: number;
  impactScore: number;
  readabilityScore: number;
  coachingFeedback: string;
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    clouds: string[];
    tools: string[];
    certs: string[];
    softSkills: string[];
  };
  suggestions: {
    formatting: string[];
    keyword: string[];
    impact: string[];
    improvement: string[];
  };
}

/**
 * Maps unstructured LLM skill categories to schema database checks:
 * ('frontend', 'backend', 'devops', 'design', 'management', 'other')
 */
function mapCategoryToDB(category: string): 'frontend' | 'backend' | 'devops' | 'design' | 'management' | 'other' {
  const c = category.toLowerCase();
  if (['languages', 'databases'].includes(c)) return 'backend';
  if (['frameworks'].includes(c)) return 'frontend'; // default framework guess
  if (['clouds', 'devops'].includes(c)) return 'devops';
  if (['design'].includes(c)) return 'design';
  if (['management'].includes(c)) return 'management';
  return 'other';
}

/**
 * Parses JSON response from OpenRouter Hermes 3, stripping markdown wrappers.
 */
function parseJSONSafe<T>(jsonStr: string, fallback: T): T {
  try {
    let cleanStr = jsonStr.trim();
    if (cleanStr.startsWith('```json')) {
      cleanStr = cleanStr.substring(7);
    } else if (cleanStr.startsWith('```')) {
      cleanStr = cleanStr.substring(3);
    }
    if (cleanStr.endsWith('```')) {
      cleanStr = cleanStr.substring(0, cleanStr.length - 3);
    }
    return JSON.parse(cleanStr.trim()) as T;
  } catch (e) {
    console.error('Failed to parse AI Analysis JSON:', e, jsonStr);
    throw new Error('AI returned an invalid JSON response structure.');
  }
}

/**
 * Triggers the Hermes 3 analysis and persists scores, suggestions, and skills to Postgres.
 */
export async function runResumeAnalysisOrchestrator(resumeId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  // 1. Fetch Resume & Verify State
  const { data: resume, error: readError } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (readError || !resume) {
    console.error('Orchestrator failed to find resume record:', readError);
    return false;
  }

  // 2. Active Concurrency Lock: Prevent duplicate analysis jobs
  if (resume.status === 'analyzing') {
    console.warn(`Resume ${resumeId} is already undergoing analysis. Aborting duplicate request.`);
    return false;
  }

  // Set status to analyzing
  const { error: lockError } = await supabase
    .from('resumes')
    .update({ status: 'analyzing' as ResumeStatus })
    .eq('id', resumeId);

  if (lockError) {
    console.error('Failed to set analyzing status lock:', lockError);
    return false;
  }

  try {
    // 3. Query OpenRouter Hermes 3
    const systemPrompt = `You are an expert ATS scanner and recruiter.
Analyze the provided resume text and generate structured scores, extracted skill arrays, and categorized suggestions.
You MUST respond with a JSON object matching this schema strictly. Do not include extra text.

JSON Schema:
{
  "atsScore": 85, -- integer 0-100
  "formattingScore": 80, -- integer 0-100
  "keywordScore": 75, -- integer 0-100
  "impactScore": 70, -- integer 0-100
  "readabilityScore": 90, -- integer 0-100
  "coachingFeedback": "Summary critique text...",
  "skills": {
    "languages": ["Python", "Go"],
    "frameworks": ["React", "Django"],
    "databases": ["PostgreSQL", "Redis"],
    "clouds": ["AWS", "GCP"],
    "tools": ["Git", "Docker"],
    "certs": ["PMP", "AWS Architect"],
    "softSkills": ["Communication"]
  },
  "suggestions": {
    "formatting": ["Tip 1", "Tip 2"],
    "keyword": ["Tip 1"],
    "impact": ["Tip 1"],
    "improvement": ["Tip 1"]
  }
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze the following parsed resume text:\n\n${resume.content}` },
    ];

    const responseText = await queryOpenRouter(messages, {
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const data = parseJSONSafe<AIAnalysisOutput>(responseText, {} as any);

    // 4. Save results inside transactional queries
    // Clear any existing analysis logs to allow clean retries
    await supabase.from('resume_analyses').delete().eq('resume_id', resumeId);
    await supabase.from('resume_skills').delete().eq('resume_id', resumeId);

    // A. Save General Scores
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('resume_analyses')
      .insert({
        resume_id: resumeId,
        ats_score: data.atsScore,
        formatting_score: data.formattingScore,
        keyword_score: data.keywordScore,
        impact_score: data.impactScore,
        readability_score: data.readabilityScore,
        coaching_feedback: data.coachingFeedback,
      })
      .select('id')
      .single();

    if (analysisError || !analysisRecord) throw analysisError || new Error('Failed to save general analysis scores.');

    // B. Save Suggestions
    const suggestionRows: any[] = [];
    const categories = ['formatting', 'keyword', 'impact', 'improvement'] as const;
    
    categories.forEach((cat) => {
      const tips = data.suggestions[cat];
      if (tips && Array.isArray(tips)) {
        tips.forEach((tip) => {
          suggestionRows.push({
            analysis_id: analysisRecord.id,
            category: cat,
            suggestion: tip,
            priority: 'medium', // Default priority mapping
          });
        });
      }
    });

    if (suggestionRows.length > 0) {
      const { error: suggestionsError } = await supabase
        .from('analysis_suggestions')
        .insert(suggestionRows);
      if (suggestionsError) throw suggestionsError;
    }

    // C. Save Skills & Mappings
    const skillList: string[] = [];
    const skillPayloads: Array<{ name: string; category: string }> = [];

    // Collate all extracted categories
    Object.entries(data.skills).forEach(([catKey, list]) => {
      if (list && Array.isArray(list)) {
        const dbCategory = mapCategoryToDB(catKey);
        list.forEach((skillName) => {
          const cleanName = skillName.trim();
          if (cleanName && !skillList.includes(cleanName.toLowerCase())) {
            skillList.push(cleanName.toLowerCase());
            skillPayloads.push({
              name: cleanName,
              category: dbCategory,
            });
          }
        });
      }
    });

    // Upsert skills and map resume links in bulk
    if (skillPayloads.length > 0) {
      const { data: skillRows, error: upsertError } = await supabase
        .from('skills')
        .upsert(skillPayloads, { onConflict: 'name' })
        .select('id, name');

      if (upsertError || !skillRows) {
        console.error('Skills batch upsert failed:', upsertError);
        throw upsertError || new Error('Skills batch upsert failed.');
      }

      const resumeSkillRows = skillRows.map((row: any) => ({
        resume_id: resumeId,
        skill_id: row.id,
      }));

      const { error: linkError } = await supabase
        .from('resume_skills')
        .upsert(resumeSkillRows, { onConflict: 'resume_id,skill_id' });

      if (linkError) {
        console.error('Resume skills batch link failed:', linkError);
        throw linkError;
      }
    }

    // D. Update final status on resumes table
    await supabase
      .from('resumes')
      .update({
        status: 'parsed' as ResumeStatus, // Reset back to processed status
        ats_score: data.atsScore, // Update top-level cached ATS score
      })
      .eq('id', resumeId);

    // Set final lifecycle status to 'analyzed'
    await supabase
      .from('resumes')
      .update({ status: 'analyzed' as ResumeStatus })
      .eq('id', resumeId);

    return true;

  } catch (error) {
    console.error(`Orchestration AI analysis crashed for resume ${resumeId}:`, error);
    
    // Recovery: Set status to analysis_failed so the candidate can retry manually
    await supabase
      .from('resumes')
      .update({ status: 'analysis_failed' as ResumeStatus })
      .eq('id', resumeId);

    return false;
  }
}
