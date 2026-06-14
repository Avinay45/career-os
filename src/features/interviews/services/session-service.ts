import { createSupabaseServerClient } from '@/lib/supabase-server';
import { 
  InterviewSession, 
  InterviewQuestion, 
  InterviewType, 
  InterviewStatus 
} from '../types';

export class SessionService {
  /**
   * Creates a new interview session.
   */
  static async createSession(
    userId: string,
    data: {
      application_id?: string | null;
      job_id?: string | null;
      company_name: string;
      job_title: string;
      interview_type: InterviewType;
      scheduled_date: string;
    }
  ): Promise<InterviewSession> {
    const supabase = await createSupabaseServerClient();
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: userId,
        application_id: data.application_id || null,
        job_id: data.job_id || null,
        company_name: data.company_name,
        job_title: data.job_title,
        interview_type: data.interview_type,
        scheduled_date: data.scheduled_date,
        status: 'scheduled' as InterviewStatus,
      })
      .select('*')
      .single();

    if (error || !session) {
      console.error('Failed to create interview session:', error);
      throw error || new Error('Failed to create interview session.');
    }

    return session as InterviewSession;
  }

  /**
   * Fetches a session by ID.
   */
  static async getSession(id: string): Promise<InterviewSession | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Failed to fetch interview session ${id}:`, error);
      throw error;
    }

    return data as InterviewSession | null;
  }

  /**
   * Lists all sessions for a user.
   */
  static async listSessions(userId: string): Promise<InterviewSession[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error(`Failed to list interview sessions for user ${userId}:`, error);
      throw error;
    }

    return (data || []) as InterviewSession[];
  }

  /**
   * Updates fields in an interview session.
   */
  static async updateSession(
    id: string,
    updates: Partial<Omit<InterviewSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<InterviewSession> {
    const supabase = await createSupabaseServerClient();
    const { data: dataSession, error } = await supabase
      .from('interview_sessions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !dataSession) {
      console.error(`Failed to update interview session ${id}:`, error);
      throw error || new Error('Failed to update interview session.');
    }

    return dataSession as InterviewSession;
  }

  /**
   * Deletes an interview session.
   */
  static async deleteSession(id: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('interview_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete interview session ${id}:`, error);
      throw error;
    }

    return true;
  }

  /**
   * Fetches questions for a session.
   */
  static async getSessionQuestions(sessionId: string): Promise<InterviewQuestion[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Failed to fetch questions for session ${sessionId}:`, error);
      throw error;
    }

    return (data || []) as InterviewQuestion[];
  }

  /**
   * Creates a question linked to a session.
   */
  static async createQuestion(data: Omit<InterviewQuestion, 'id' | 'created_at'>): Promise<InterviewQuestion> {
    const supabase = await createSupabaseServerClient();
    const { data: question, error } = await supabase
      .from('interview_questions')
      .insert({
        session_id: data.session_id,
        question_text: data.question_text,
        category: data.category,
        candidate_response: data.candidate_response || null,
        score: data.score || null,
        feedback: data.feedback || null,
      })
      .select('*')
      .single();

    if (error || !question) {
      console.error('Failed to create question:', error);
      throw error || new Error('Failed to create question.');
    }

    return question as InterviewQuestion;
  }

  /**
   * Creates multiple questions linked to a session in a single batch.
   */
  static async createQuestions(dataList: Omit<InterviewQuestion, 'id' | 'created_at'>[]): Promise<InterviewQuestion[]> {
    const supabase = await createSupabaseServerClient();
    const rows = dataList.map(data => ({
      session_id: data.session_id,
      question_text: data.question_text,
      category: data.category,
      candidate_response: data.candidate_response || null,
      score: data.score || null,
      feedback: data.feedback || null,
    }));

    const { data: questions, error } = await supabase
      .from('interview_questions')
      .insert(rows)
      .select('*');

    if (error || !questions) {
      console.error('Failed to create questions batch:', error);
      throw error || new Error('Failed to create questions batch.');
    }

    return questions as InterviewQuestion[];
  }

  /**
   * Saves candidate response, score, and feedback for an individual question.
   */
  static async updateQuestionResponse(
    questionId: string,
    candidateResponse: string,
    score: number,
    feedback: string
  ): Promise<InterviewQuestion> {
    const supabase = await createSupabaseServerClient();
    const { data: question, error } = await supabase
      .from('interview_questions')
      .update({
        candidate_response: candidateResponse,
        score,
        feedback,
      })
      .eq('id', questionId)
      .select('*')
      .single();

    if (error || !question) {
      console.error(`Failed to update question response ${questionId}:`, error);
      throw error || new Error('Failed to save response evaluation.');
    }

    return question as InterviewQuestion;
  }

  /**
   * Calculates dynamic performance indicators and summaries for a user's interview preparation.
   */
  static async getInterviewMetrics(userId: string) {
    const sessions = await this.listSessions(userId);
    const completed = sessions.filter(s => s.status === 'completed');
    const upcoming = sessions.filter(s => s.status === 'scheduled');

    if (completed.length === 0) {
      return {
        completedCount: 0,
        upcomingCount: upcoming.length,
        averageOverallScore: 0,
        averageCommunicationScore: 0,
        averageTechnicalScore: 0,
        averageConfidenceScore: 0,
        averageProblemSolvingScore: 0,
        averageBehavioralScore: 0,
        weaknessesSummary: [] as string[],
        studyRoadmap: [] as string[],
        trendData: [] as Array<{ date: string; score: number }>
      };
    }

    // Averages (overall and sub-dimensions)
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(sum(arr) / arr.length) : 0;

    const overallScores = completed.map(s => s.overall_score || 0);
    const commScores = completed.map(s => s.communication_score || 0).filter(v => v > 0);
    const techScores = completed.map(s => s.technical_score || 0).filter(v => v > 0);
    const confScores = completed.map(s => s.confidence_score || 0).filter(v => v > 0);
    const probScores = completed.map(s => s.problem_solving_score || 0).filter(v => v > 0);
    const behScores = completed.map(s => s.behavioral_score || 0).filter(v => v > 0);

    // Aggregate Weaknesses
    const weaknessesSet = new Set<string>();
    const studyAreasSet = new Set<string>();
    completed.forEach(s => {
      s.weaknesses?.forEach(w => weaknessesSet.add(w));
      s.study_areas?.forEach(sa => studyAreasSet.add(sa));
    });

    // Trend timeline sorted chronologically
    const trendData = completed
      .map(s => ({
        date: new Date(s.scheduled_date).toLocaleDateString(),
        score: s.overall_score || 0,
        timestamp: new Date(s.scheduled_date).getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(t => ({ date: t.date, score: t.score }));

    return {
      completedCount: completed.length,
      upcomingCount: upcoming.length,
      averageOverallScore: avg(overallScores),
      averageCommunicationScore: avg(commScores),
      averageTechnicalScore: avg(techScores),
      averageConfidenceScore: avg(confScores),
      averageProblemSolvingScore: avg(probScores),
      averageBehavioralScore: avg(behScores),
      weaknessesSummary: Array.from(weaknessesSet).slice(0, 5),
      studyRoadmap: Array.from(studyAreasSet).slice(0, 5),
      trendData
    };
  }
}
