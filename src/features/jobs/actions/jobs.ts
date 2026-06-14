'use server';

import { authenticateUser } from '@/features/auth/services/server-auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { JobParser } from '../services/job-parser';
import { SkillMapper } from '../services/skill-mapper';
import { MatchEngine } from '../services/match-engine';
import { JobStatus } from '../types';
import { checkRateLimit } from '@/lib/rate-limiter';

/**
 * Validates ownership of job description.
 */
async function validateJobOwner(jobId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: job } = await supabase
    .from('job_descriptions')
    .select('user_id')
    .eq('id', jobId)
    .single();

  if (!job || job.user_id !== userId) {
    throw new Error('Unauthorized access to this job description.');
  }
}

/**
 * Action: Create and automatically parse a saved job description.
 */
export async function createJobAction(
  companyName: string,
  jobTitle: string,
  description: string,
  location?: string,
  employmentType?: string,
  salary?: string
) {
  try {
    const { user, supabase } = await authenticateUser();

    // Enforce rate limiting: 10 job parsing operations per 60 seconds per user
    const { limited, retryAfterSeconds } = checkRateLimit(`job-parse:${user.id}`, {
      limit: 10,
      intervalSeconds: 60,
    });
    if (limited) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again after ${retryAfterSeconds} seconds.`,
      };
    }

    // 1. Insert base job record
    const { data: job, error: insertError } = await supabase
      .from('job_descriptions')
      .insert({
        user_id: user.id,
        company_name: companyName,
        job_title: jobTitle,
        description,
        location: location || null,
        employment_type: employmentType || null,
        salary: salary || null,
        status: 'saved' as JobStatus,
      })
      .select('*')
      .single();

    if (insertError || !job) {
      throw insertError || new Error('Failed to save job description.');
    }

    // 2. Trigger parsing (Hermes 3)
    let parsed: any = null;
    try {
      parsed = await JobParser.parseJobDescription(jobTitle, companyName, description);
      
      // Update job description structured data
      await supabase
        .from('job_descriptions')
        .update({
          status: 'parsed' as JobStatus,
          experience_requirements: parsed.experienceRequirements,
          responsibilities: parsed.responsibilities,
          education_requirements: parsed.educationRequirements,
          keywords: parsed.keywords,
        })
        .eq('id', job.id);

      // 3. Map Skills
      await SkillMapper.mapJobSkills(job.id, parsed.requiredSkills, parsed.preferredSkills);
    } catch (parseError) {
      console.error(`Failed to parse job description ${job.id}:`, parseError);
      // Fail gracefully: Job remains saved as draft/saved status
      return { success: true, jobId: job.id, parsed: false };
    }

    // 4. Automatically trigger match run if user has an active resume
    try {
      const { data: latestResume } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestResume) {
        await MatchEngine.evaluateFit(latestResume.id, job.id);
      }
    } catch (matchError) {
      console.error(`Auto resume matching failed for job ${job.id}:`, matchError);
    }

    return { success: true, jobId: job.id, parsed: true };

  } catch (error: any) {
    console.error('createJobAction error:', error);
    return { success: false, error: error.message || 'Failed to create job.' };
  }
}

/**
 * Action: Fetch saved job descriptions.
 */
export async function listJobsAction(status?: JobStatus) {
  try {
    const { user, supabase } = await authenticateUser();

    let query = supabase
      .from('job_descriptions')
      .select('*')
      .eq('user_id', user.id);

    if (status) {
      query = query.eq('status', status);
    } else {
      // Exclude archived by default
      query = query.neq('status', 'archived');
    }

    query = query.order('created_at', { ascending: false });

    const { data: jobs, error } = await query;
    if (error) throw error;

    return { success: true, jobs };
  } catch (error: any) {
    console.error('listJobsAction error:', error);
    return { success: false, error: error.message || 'Failed to list jobs.' };
  }
}

/**
 * Action: Get detailed job, match, and skill gaps diagnostics.
 */
export async function getJobDetailsAction(jobId: string) {
  try {
    const { user, supabase } = await authenticateUser();
    await validateJobOwner(jobId, user.id);

    const { data: job, error: jobError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    // Fetch match record
    const { data: match } = await supabase
      .from('job_matches')
      .select('*')
      .eq('job_id', jobId)
      .maybeSingle();

    let gaps: any[] = [];
    if (match) {
      const { data: gapsData } = await supabase
        .from('skill_gaps')
        .select('*, skills(name)')
        .eq('match_id', match.id);
      gaps = gapsData || [];
    }

    // Fetch required and preferred skills
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('is_preferred, skills(name, category)')
      .eq('job_id', jobId);

    return {
      success: true,
      job,
      match,
      gaps,
      skills: jobSkills || []
    };

  } catch (error: any) {
    console.error('getJobDetailsAction error:', error);
    return { success: false, error: error.message || 'Failed to fetch job details.' };
  }
}

/**
 * Action: Hard deletes a job.
 */
export async function deleteJobAction(jobId: string) {
  try {
    const { user, supabase } = await authenticateUser();
    await validateJobOwner(jobId, user.id);

    const { error } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('deleteJobAction error:', error);
    return { success: false, error: error.message || 'Failed to delete job.' };
  }
}

/**
 * Action: Archives a job.
 */
export async function archiveJobAction(jobId: string) {
  try {
    const { user, supabase } = await authenticateUser();
    await validateJobOwner(jobId, user.id);

    const { error } = await supabase
      .from('job_descriptions')
      .update({ status: 'archived' as JobStatus })
      .eq('id', jobId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('archiveJobAction error:', error);
    return { success: false, error: error.message || 'Failed to archive job.' };
  }
}

/**
 * Action: Run comparison fit manually between active resume and saved job.
 */
export async function runJobMatchAction(jobId: string, resumeId: string) {
  try {
    const { user, supabase } = await authenticateUser();
    await validateJobOwner(jobId, user.id);

    // Verify resume ownership
    const { data: resume } = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();

    if (!resume || resume.user_id !== user.id) {
      throw new Error('Unauthorized access to this resume.');
    }

    const matched = await MatchEngine.evaluateFit(resumeId, jobId);
    if (!matched) {
      throw new Error('Match run completed with processing errors.');
    }

    return { success: true };
  } catch (error: any) {
    console.error('runJobMatchAction error:', error);
    return { success: false, error: error.message || 'Failed to run matching diagnostics.' };
  }
}
