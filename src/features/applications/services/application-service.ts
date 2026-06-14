import { createSupabaseServerClient } from '@/lib/supabase-server';
import { 
  JobApplication, 
  JobApplicationHistory, 
  ApplicationStage, 
  ApplicationAnalytics 
} from '../types';

export class ApplicationService {
  /**
   * Creates a new job application and logs its initial stage transition.
   */
  static async createApplication(
    userId: string,
    data: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'interview_dates'> & {
      interview_dates?: string[];
    }
  ): Promise<JobApplication> {
    const supabase = await createSupabaseServerClient();
    
    // Automatically determine timeline dates based on status
    const nowStr = new Date().toISOString();
    const appliedAt = data.status !== 'wishlist' ? nowStr : null;
    const offerDate = data.status === 'offered' || data.status === 'accepted' ? nowStr : null;
    const outcomeDate = ['accepted', 'rejected', 'withdrawn'].includes(data.status) ? nowStr : null;

    const { data: app, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: userId,
        job_id: data.job_id || null,
        company_name: data.company_name,
        job_title: data.job_title,
        salary: data.salary || null,
        location: data.location || null,
        status: data.status,
        notes: data.notes || null,
        applied_at: data.applied_at || appliedAt,
        interview_dates: data.interview_dates || [],
        offer_date: data.offer_date || offerDate,
        outcome_date: data.outcome_date || outcomeDate,
      })
      .select('*')
      .single();

    if (error || !app) {
      console.error('Failed to create application:', error);
      throw error || new Error('Failed to create application.');
    }

    // Log the initial stage transition
    try {
      await supabase
        .from('job_application_history')
        .insert({
          application_id: app.id,
          from_stage: null,
          to_stage: app.status,
          notes: 'Application initialized.'
        });
    } catch (historyError) {
      console.error('Failed to log initial application history:', historyError);
    }

    return app as JobApplication;
  }

  /**
   * Updates an application's details.
   */
  static async updateApplication(
    id: string,
    updates: Partial<Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<JobApplication> {
    const supabase = await createSupabaseServerClient();
    const { data: app, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !app) {
      console.error(`Failed to update application ${id}:`, error);
      throw error || new Error('Failed to update application details.');
    }

    return app as JobApplication;
  }

  /**
   * Updates an application's stage, logging history and timestamp changes.
   */
  static async updateApplicationStage(
    id: string,
    newStage: ApplicationStage,
    notes?: string
  ): Promise<JobApplication> {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch current status
    const { data: currentApp, error: fetchError } = await supabase
      .from('job_applications')
      .select('status, applied_at, offer_date, outcome_date')
      .eq('id', id)
      .single();

    if (fetchError || !currentApp) {
      throw fetchError || new Error('Application not found.');
    }

    const currentStage = currentApp.status as ApplicationStage;
    if (currentStage === newStage) {
      return this.updateApplication(id, {}); // No-op, just updates updated_at
    }

    // 2. Determine timeline date updates
    const nowStr = new Date().toISOString();
    const timelineUpdates: Partial<JobApplication> = {
      status: newStage,
    };

    // Auto-fill Applied Date
    if (newStage !== 'wishlist' && !currentApp.applied_at) {
      timelineUpdates.applied_at = nowStr;
    }
    // Auto-fill Offer Date
    if ((newStage === 'offered' || newStage === 'accepted') && !currentApp.offer_date) {
      timelineUpdates.offer_date = nowStr;
    }
    // Auto-fill Outcome Date
    if (['accepted', 'rejected', 'withdrawn'].includes(newStage)) {
      timelineUpdates.outcome_date = nowStr;
    }

    // 3. Perform update
    const updatedApp = await this.updateApplication(id, timelineUpdates);

    // 4. Log the transition in history
    try {
      await supabase
        .from('job_application_history')
        .insert({
          application_id: id,
          from_stage: currentStage,
          to_stage: newStage,
          notes: notes || `Stage changed from ${currentStage} to ${newStage}.`
        });
    } catch (historyError) {
      console.error(`Failed to log history for application ${id}:`, historyError);
    }

    return updatedApp;
  }

  /**
   * Deletes an application.
   */
  static async deleteApplication(id: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete application ${id}:`, error);
      throw error;
    }

    return true;
  }

  /**
   * Fetches an application by ID.
   */
  static async getApplication(id: string): Promise<JobApplication | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Failed to fetch application ${id}:`, error);
      throw error;
    }

    return data as JobApplication | null;
  }

  /**
   * Lists all applications for a user.
   */
  static async listApplications(userId: string): Promise<JobApplication[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error(`Failed to list applications for user ${userId}:`, error);
      throw error;
    }

    return (data || []) as JobApplication[];
  }

  /**
   * Fetches the transition history for a specific application.
   */
  static async getApplicationHistory(applicationId: string): Promise<JobApplicationHistory[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('job_application_history')
      .select('*')
      .eq('application_id', applicationId)
      .order('changed_at', { ascending: true });

    if (error) {
      console.error(`Failed to fetch history for application ${applicationId}:`, error);
      throw error;
    }

    return (data || []) as JobApplicationHistory[];
  }

  /**
   * Dynamically calculates pipeline analytics for a user.
   */
  static async getPipelineAnalytics(userId: string): Promise<ApplicationAnalytics> {
    const apps = await this.listApplications(userId);
    
    // Total Submitted: anything that isn't 'wishlist'
    const submittedApps = apps.filter(app => app.status !== 'wishlist');
    const submittedCount = submittedApps.length;

    if (submittedCount === 0) {
      return {
        submittedCount: 0,
        interviewsCount: 0,
        offersCount: 0,
        rejectionRate: 0,
        interviewRate: 0,
        offerRate: 0,
      };
    }

    // Interviews Count: has scheduled interviews, or is in an interview stage, or was offered/accepted
    const interviewStages: ApplicationStage[] = ['screening', 'interviewing', 'technical', 'final_round'];
    const interviewsCount = submittedApps.filter(app => {
      const inInterviewStage = interviewStages.includes(app.status);
      const hasInterviewDates = app.interview_dates && app.interview_dates.length > 0;
      const reachedOffer = ['offered', 'accepted'].includes(app.status);
      return inInterviewStage || hasInterviewDates || reachedOffer;
    }).length;

    // Offers Count: status is offered or accepted
    const offersCount = submittedApps.filter(app => 
      ['offered', 'accepted'].includes(app.status)
    ).length;

    // Rejections Count: status is rejected
    const rejectionsCount = submittedApps.filter(app => app.status === 'rejected').length;

    // Calculations (rounded to nearest integer)
    const rejectionRate = Math.round((rejectionsCount / submittedCount) * 100);
    const interviewRate = Math.round((interviewsCount / submittedCount) * 100);
    const offerRate = Math.round((offersCount / submittedCount) * 100);

    return {
      submittedCount,
      interviewsCount,
      offersCount,
      rejectionRate,
      interviewRate,
      offerRate,
    };
  }
}
