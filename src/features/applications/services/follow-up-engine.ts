import { JobApplication, FollowUpIntelligence, ApplicationHealth } from '../types';

export class FollowUpEngine {
  /**
   * Evaluates application timeline dates, status, and activity history to compile 
   * a health status report and draft targeted follow-up suggestions.
   */
  static evaluateApplication(app: JobApplication): FollowUpIntelligence {
    const now = new Date();
    const lastUpdated = new Date(app.updated_at);
    const msSinceUpdate = now.getTime() - lastUpdated.getTime();
    const daysSinceActivity = Math.floor(msSinceUpdate / (1000 * 60 * 60 * 24));

    let health: ApplicationHealth = 'healthy';
    const suggestions: string[] = [];
    const nextActions: string[] = [];

    // 1. Analyze interview milestones
    let upcomingInterview: Date | null = null;
    let pastInterviewWithoutUpdate = false;
    let latestInterviewDate: Date | null = null;

    if (app.interview_dates && app.interview_dates.length > 0) {
      const dates = app.interview_dates
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      upcomingInterview = dates.find(d => d.getTime() > now.getTime()) || null;

      const pastDates = dates.filter(d => d.getTime() <= now.getTime());
      if (pastDates.length > 0) {
        latestInterviewDate = pastDates[pastDates.length - 1];
        if (['screening', 'interviewing', 'technical', 'final_round'].includes(app.status)) {
          pastInterviewWithoutUpdate = true;
        }
      }
    }

    // 2. Health and Recommendation Logic
    if (upcomingInterview) {
      const diffMs = upcomingInterview.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours <= 48) {
        health = 'needs_action';
        nextActions.push(`Prepare for your upcoming interview with ${app.company_name} scheduled in less than 48 hours.`);
        suggestions.push("Go to the Mock Interview tab to run simulated questions based on this role.");
      } else {
        health = 'healthy';
        nextActions.push(`Prepare for your upcoming interview with ${app.company_name} on ${upcomingInterview.toLocaleDateString()}.`);
        suggestions.push("Review key skills requested in the job description to ensure alignment.");
      }
    } else if (pastInterviewWithoutUpdate && latestInterviewDate) {
      health = 'needs_action';
      const daysSinceInterview = Math.floor((now.getTime() - latestInterviewDate.getTime()) / (1000 * 60 * 60 * 24));
      nextActions.push(`Follow up regarding your interview with ${app.company_name} on ${latestInterviewDate.toLocaleDateString()}.`);
      suggestions.push(`It has been ${daysSinceInterview} days since your interview. Send a thank-you note and request an update.`);
    } else if (app.status === 'applied') {
      const appliedDate = app.applied_at ? new Date(app.applied_at) : new Date(app.created_at);
      const daysSinceApplied = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceApplied > 14) {
        health = 'stale';
        nextActions.push(`Draft follow-up email to recruiter at ${app.company_name}.`);
        suggestions.push(`Your application has been pending for ${daysSinceApplied} days. Reach out to the hiring manager or check in.`);
      } else {
        health = 'healthy';
        nextActions.push(`Monitor your application status for ${app.company_name}.`);
        suggestions.push("Consider networking with engineers at this company on LinkedIn.");
      }
    } else if (app.status === 'wishlist') {
      health = 'healthy';
      nextActions.push("Prepare application assets for submission.");
      suggestions.push(`Optimize your resume ATS score against ${app.company_name}'s job description before applying.`);
    } else if (app.status === 'offered') {
      health = 'needs_action';
      nextActions.push("Review the offer letter and details.");
      suggestions.push("Plan negotiation points or formulate acceptance/rejection response.");
    } else if (daysSinceActivity > 10 && !['accepted', 'rejected', 'withdrawn'].includes(app.status)) {
      health = 'stale';
      nextActions.push(`Re-engage with ${app.company_name} lead.`);
      suggestions.push(`This application has seen no activity for ${daysSinceActivity} days. Update its status or reach out.`);
    } else {
      health = 'healthy';
      if (!['accepted', 'rejected', 'withdrawn'].includes(app.status)) {
        nextActions.push("Continue preparing for potential next rounds.");
        suggestions.push("Keep track of notes and relevant job documents.");
      } else {
        nextActions.push("Archived - Lifecycle complete.");
        if (app.status === 'accepted') {
          suggestions.push("Congratulations on securing the offer! Mark your onboarding date.");
        } else if (app.status === 'rejected') {
          suggestions.push("Keep searching and practice mock interviewing to refine performance.");
        }
      }
    }

    return {
      health,
      daysSinceActivity,
      suggestions,
      nextActions
    };
  }
}
