'use server';

import { authenticateUser } from '@/features/auth/services/server-auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ApplicationService } from '../services/application-service';
import { FollowUpEngine } from '../services/follow-up-engine';
import { ApplicationStage, JobApplication } from '../types';

/**
 * Verifies application ownership.
 */
async function validateApplicationOwner(applicationId: string, userId: string) {
  const app = await ApplicationService.getApplication(applicationId);
  if (!app) {
    throw new Error('Application not found.');
  }
  if (app.user_id !== userId) {
    throw new Error('Unauthorized access to this application.');
  }
  return app;
}

/**
 * Action: Create new job application.
 */
export async function createApplicationAction(
  data: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'interview_dates'> & {
    interview_dates?: string[];
  }
) {
  try {
    const { user } = await authenticateUser();
    const app = await ApplicationService.createApplication(user.id, data);
    return { success: true, application: app };
  } catch (error: any) {
    console.error('createApplicationAction error:', error);
    return { success: false, error: error.message || 'Failed to create application.' };
  }
}

/**
 * Action: Update application fields.
 */
export async function updateApplicationAction(
  applicationId: string,
  updates: Partial<Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  try {
    const { user } = await authenticateUser();
    await validateApplicationOwner(applicationId, user.id);
    const app = await ApplicationService.updateApplication(applicationId, updates);
    return { success: true, application: app };
  } catch (error: any) {
    console.error('updateApplicationAction error:', error);
    return { success: false, error: error.message || 'Failed to update application.' };
  }
}

/**
 * Action: Update stage of application.
 */
export async function updateApplicationStageAction(
  applicationId: string,
  newStage: ApplicationStage,
  notes?: string
) {
  try {
    const { user } = await authenticateUser();
    await validateApplicationOwner(applicationId, user.id);
    const app = await ApplicationService.updateApplicationStage(applicationId, newStage, notes);
    return { success: true, application: app };
  } catch (error: any) {
    console.error('updateApplicationStageAction error:', error);
    return { success: false, error: error.message || 'Failed to update stage.' };
  }
}

/**
 * Action: Hard deletes application.
 */
export async function deleteApplicationAction(applicationId: string) {
  try {
    const { user } = await authenticateUser();
    await validateApplicationOwner(applicationId, user.id);
    await ApplicationService.deleteApplication(applicationId);
    return { success: true };
  } catch (error: any) {
    console.error('deleteApplicationAction error:', error);
    return { success: false, error: error.message || 'Failed to delete application.' };
  }
}

/**
 * Action: Lists user's applications.
 */
export async function listApplicationsAction() {
  try {
    const { user } = await authenticateUser();
    const applications = await ApplicationService.listApplications(user.id);
    return { success: true, applications };
  } catch (error: any) {
    console.error('listApplicationsAction error:', error);
    return { success: false, error: error.message || 'Failed to retrieve applications.' };
  }
}

/**
 * Action: Get detailed application analytics, history, health status, and matching score.
 */
export async function getApplicationDetailsAction(applicationId: string) {
  try {
    const { user } = await authenticateUser();
    const app = await validateApplicationOwner(applicationId, user.id);
    const supabase = await createSupabaseServerClient();

    // 1. Get History logs
    const history = await ApplicationService.getApplicationHistory(applicationId);

    // 2. Get health evaluation suggestions
    const followUp = FollowUpEngine.evaluateApplication(app);

    // 3. Try to lookup latest match score if job_id is linked
    let matchScore: number | null = null;
    if (app.job_id) {
      // Find latest user resume
      const { data: latestResume } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestResume) {
        const { data: match } = await supabase
          .from('job_matches')
          .select('match_score')
          .eq('resume_id', latestResume.id)
          .eq('job_id', app.job_id)
          .maybeSingle();

        if (match) {
          matchScore = match.match_score;
        }
      }
    }

    return {
      success: true,
      application: app,
      history,
      followUp,
      matchScore
    };
  } catch (error: any) {
    console.error('getApplicationDetailsAction error:', error);
    return { success: false, error: error.message || 'Failed to retrieve details.' };
  }
}

/**
 * Action: Get pipeline metrics.
 */
export async function getPipelineAnalyticsAction() {
  try {
    const { user } = await authenticateUser();
    const analytics = await ApplicationService.getPipelineAnalytics(user.id);
    return { success: true, analytics };
  } catch (error: any) {
    console.error('getPipelineAnalyticsAction error:', error);
    return { success: false, error: error.message || 'Failed to compile metrics.' };
  }
}
