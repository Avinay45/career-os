export type ResumeStatus = 'draft' | 'uploaded' | 'parsing' | 'parsed' | 'analyzing' | 'analyzed' | 'analysis_failed';

export interface ResumeMetadata {
  title: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  status: ResumeStatus;
}

export interface ParserResult {
  raw_text: string;
  word_count: number;
  character_count: number;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  skills: string[] | null;
  file_url: string | null;
  status: ResumeStatus;
  mime_type: string | null;
  file_size: number | null;
  word_count: number | null;
  character_count: number | null;
  ats_score: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysisRecord {
  id: string;
  resume_id: string;
  ats_score: number;
  formatting_score: number;
  keyword_score: number;
  impact_score: number;
  readability_score: number;
  coaching_feedback: string;
  created_at: string;
}

export interface AnalysisSuggestionRecord {
  id: string;
  analysis_id: string;
  category: 'formatting' | 'keyword' | 'impact' | 'improvement';
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}
