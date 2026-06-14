export type InterviewType =
  | 'behavioral'
  | 'technical'
  | 'screening'
  | 'system_design'
  | 'mixed';

export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed';

export type QuestionCategory =
  | 'behavioral'
  | 'technical'
  | 'role_specific'
  | 'skill_gap'
  | 'company_specific';

export interface InterviewSession {
  id: string;
  user_id: string;
  application_id: string | null;
  job_id: string | null;
  company_name: string;
  job_title: string;
  interview_type: InterviewType;
  scheduled_date: string;
  status: InterviewStatus;
  communication_score: number | null;
  technical_score: number | null;
  confidence_score: number | null;
  problem_solving_score: number | null;
  behavioral_score: number | null;
  overall_score: number | null;
  feedback_summary: string | null;
  weaknesses: string[];
  study_areas: string[];
  practice_exercises: string[];
  next_steps: string[];
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: string;
  session_id: string;
  question_text: string;
  category: QuestionCategory;
  candidate_response: string | null;
  score: number | null;
  feedback: string | null;
  created_at: string;
}
