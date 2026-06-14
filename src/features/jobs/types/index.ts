export type JobStatus = 'draft' | 'saved' | 'parsed' | 'matched' | 'archived';

export interface JobRecord {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  description: string;
  location: string | null;
  employment_type: string | null;
  salary: string | null;
  status: JobStatus;
  experience_requirements: string | null;
  responsibilities: string[] | null;
  education_requirements: string | null;
  keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface JobSkillRecord {
  job_id: string;
  skill_id: string;
  is_preferred: boolean;
}

export interface JobMatchRecord {
  id: string;
  resume_id: string;
  job_id: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  gap_analysis: string | null;
  created_at: string;
}

export interface SkillGapRecord {
  id: string;
  match_id: string;
  skill_id: string;
  gap_severity: 'low' | 'medium' | 'high';
  recommendation: string | null;
}
