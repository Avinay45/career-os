import { createSupabaseServerClient } from '@/lib/supabase-server';
import { queryOpenRouter, ChatMessage } from '@/lib/openrouter';

interface AIMatchOutput {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  gapAnalysis: string;
  gaps: Array<{
    skill: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
}

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
    console.error('Failed to parse AI Match Output JSON:', e, jsonStr);
    return fallback;
  }
}

export class MatchEngine {
  /**
   * Evaluates fit between a candidate's resume and a job description.
   */
  static async evaluateFit(resumeId: string, jobId: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch Resume Content
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (resumeError || !resume) {
      console.error('Match Engine failed to load resume:', resumeError);
      return false;
    }

    // 2. Fetch Job Description details
    const { data: job, error: jobError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Match Engine failed to load job description:', jobError);
      return false;
    }

    try {
      // 3. Request LLM Assessment fit
      const systemPrompt = `You are a professional ATS scanner and technical recruiter.
Compare the candidate's resume against the job description. Analyze skill alignments, missing requirements, and generate a fit score.
You MUST respond with a JSON object matching this schema. Do not include extra text.

JSON Schema:
{
  "matchScore": 80, -- integer 0-100
  "matchingSkills": ["React", "TypeScript"],
  "missingSkills": ["Next.js", "Docker"],
  "gapAnalysis": "Summary analysis of candidate fit...",
  "gaps": [
    {
      "skill": "Next.js",
      "severity": "medium", -- 'low', 'medium', or 'high'
      "recommendation": "Build a portfolio project with Next.js App Router."
    }
  ]
}`;

      const userPrompt = `JOB DESCRIPTION:
Company: "${job.company_name}"
Title: "${job.job_title}"
Description:
${job.description}

RESUME:
Title: "${resume.title}"
Content:
${resume.content || ''}`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const responseText = await queryOpenRouter(messages, {
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const fitData = parseJSONSafe<AIMatchOutput>(responseText, {
        matchScore: 50,
        matchingSkills: [],
        missingSkills: [],
        gapAnalysis: 'Fit assessment failed or returned empty.',
        gaps: [],
      });

      // 4. Persist Match metrics
      // Clear previous comparisons to support clean retries
      const { data: oldMatches } = await supabase
        .from('job_matches')
        .select('id')
        .eq('resume_id', resumeId)
        .eq('job_id', jobId);

      if (oldMatches && oldMatches.length > 0) {
        const matchIds = oldMatches.map((m: any) => m.id);
        await supabase.from('skill_gaps').delete().in('match_id', matchIds);
        await supabase.from('job_matches').delete().in('id', matchIds);
      }

      // Insert new match
      const { data: matchRecord, error: insertError } = await supabase
        .from('job_matches')
        .insert({
          resume_id: resumeId,
          job_id: jobId,
          match_score: fitData.matchScore,
          matching_skills: fitData.matchingSkills,
          missing_skills: fitData.missingSkills,
          gap_analysis: fitData.gapAnalysis,
        })
        .select('id')
        .single();

      if (insertError || !matchRecord) {
        throw insertError || new Error('Failed to create match record.');
      }

      // 5. Persist Gap details in bulk
      if (fitData.gaps && fitData.gaps.length > 0) {
        const skillPayloads = fitData.gaps.map((gap) => ({
          name: gap.skill,
          category: 'other',
        }));

        const { data: skillRows, error: skillError } = await supabase
          .from('skills')
          .upsert(skillPayloads, { onConflict: 'name' })
          .select('id, name');

        if (skillError || !skillRows) {
          console.error('Gap skills batch upsert failed:', skillError);
          throw skillError || new Error('Gap skills batch upsert failed.');
        }

        // Map skill name to id
        const nameToIdMap = new Map<string, string>();
        skillRows.forEach((row: any) => {
          nameToIdMap.set(row.name.toLowerCase(), row.id);
        });

        const skillGapRows = fitData.gaps.map((gap) => {
          const id = nameToIdMap.get(gap.skill.toLowerCase());
          if (!id) return null;
          return {
            match_id: matchRecord.id,
            skill_id: id,
            gap_severity: gap.severity,
            recommendation: gap.recommendation,
          };
        }).filter((row): row is { match_id: string; skill_id: string; gap_severity: 'low' | 'medium' | 'high'; recommendation: string } => row !== null);

        if (skillGapRows.length > 0) {
          const { error: gapLinkError } = await supabase
            .from('skill_gaps')
            .upsert(skillGapRows, { onConflict: 'match_id,skill_id' });

          if (gapLinkError) {
            console.error('Skill gaps batch link failed:', gapLinkError);
            throw gapLinkError;
          }
        }
      }

      // 6. Transition Job status lifecycle to 'matched'
      await supabase
        .from('job_descriptions')
        .update({ status: 'matched' })
        .eq('id', jobId);

      return true;

    } catch (e) {
      console.error(`Match Engine orchestration crash for job ${jobId} and resume ${resumeId}:`, e);
      return false;
    }
  }
}
