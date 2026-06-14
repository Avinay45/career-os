export type ApplicationStage =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'technical'
  | 'final_round'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string | null;
  company_name: string;
  job_title: string;
  salary: string | null;
  location: string | null;
  status: ApplicationStage;
  notes: string | null;
  created_at: string;
  applied_at: string | null;
  interview_dates: string[];
  offer_date: string | null;
  outcome_date: string | null;
  updated_at: string;
}

export interface JobApplicationHistory {
  id: string;
  application_id: string;
  from_stage: ApplicationStage | null;
  to_stage: ApplicationStage;
  changed_at: string;
  notes: string | null;
}

export interface ApplicationAnalytics {
  submittedCount: number;
  interviewsCount: number;
  offersCount: number;
  rejectionRate: number;
  interviewRate: number;
  offerRate: number;
}

export type ApplicationHealth = 'needs_action' | 'stale' | 'healthy';

export interface FollowUpIntelligence {
  health: ApplicationHealth;
  daysSinceActivity: number;
  suggestions: string[];
  nextActions: string[];
}
