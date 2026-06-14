'use server';

import { authenticateUser } from '@/features/auth/services/server-auth';
import { SessionService } from '../services/session-service';
import { EvaluationService } from '../services/evaluation-service';
import { InterviewType } from '../types';
import { checkRateLimit } from '@/lib/rate-limiter';

/**
 * Verifies interview session ownership.
 */
async function validateSessionOwner(sessionId: string, userId: string) {
  const session = await SessionService.getSession(sessionId);
  if (!session) {
    throw new Error('Interview session not found.');
  }
  if (session.user_id !== userId) {
    throw new Error('Unauthorized access to this interview session.');
  }
  return session;
}

/**
 * Action: Create interview session and immediately generate tailored questions.
 */
export async function createInterviewSessionAction(data: {
  application_id?: string | null;
  job_id?: string | null;
  company_name: string;
  job_title: string;
  interview_type: InterviewType;
  scheduled_date: string;
}) {
  try {
    const { user } = await authenticateUser();

    // Rate limit: 10 operations per 60 seconds per user for interview questions creation
    const { limited, retryAfterSeconds } = checkRateLimit(`interview-create:${user.id}`, {
      limit: 10,
      intervalSeconds: 60,
    });
    if (limited) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again after ${retryAfterSeconds} seconds.`,
      };
    }

    // 1. Create base session
    const session = await SessionService.createSession(user.id, data);

    // 2. Trigger question generation
    await EvaluationService.generateQuestions(user.id, session.id);

    return { success: true, sessionId: session.id };
  } catch (error: any) {
    console.error('createInterviewSessionAction error:', error);
    return { success: false, error: error.message || 'Failed to create interview session.' };
  }
}

/**
 * Action: Fetch all sessions for user.
 */
export async function listInterviewSessionsAction() {
  try {
    const { user } = await authenticateUser();
    const sessions = await SessionService.listSessions(user.id);
    return { success: true, sessions };
  } catch (error: any) {
    console.error('listInterviewSessionsAction error:', error);
    return { success: false, error: error.message || 'Failed to retrieve sessions.' };
  }
}

/**
 * Action: Fetch detailed session along with questions.
 */
export async function getInterviewSessionDetailsAction(sessionId: string) {
  try {
    const { user } = await authenticateUser();
    await validateSessionOwner(sessionId, user.id);

    const session = await SessionService.getSession(sessionId);
    const questions = await SessionService.getSessionQuestions(sessionId);

    return { success: true, session, questions };
  } catch (error: any) {
    console.error('getInterviewSessionDetailsAction error:', error);
    return { success: false, error: error.message || 'Failed to load details.' };
  }
}

/**
 * Action: Submits a candidate response, evaluates it, checks if final question,
 * and if so, runs overall evaluations and roadmaps.
 */
export async function submitAnswerAction(
  sessionId: string,
  questionId: string,
  response: string
) {
  try {
    const { user } = await authenticateUser();

    // Rate limit: 10 evaluations per 60 seconds per user
    const { limited, retryAfterSeconds } = checkRateLimit(`interview-submit:${user.id}`, {
      limit: 10,
      intervalSeconds: 60,
    });
    if (limited) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again after ${retryAfterSeconds} seconds.`,
      };
    }

    await validateSessionOwner(sessionId, user.id);

    // 1. Retrieve session questions to verify progress
    const questions = await SessionService.getSessionQuestions(sessionId);
    const targetQ = questions.find(q => q.id === questionId);
    if (!targetQ) throw new Error('Question not found in this session.');

    // 2. Grade answer via LLM
    const evaluation = await EvaluationService.evaluateAnswer(
      targetQ.question_text,
      targetQ.category,
      response
    );

    // 3. Save grade
    const questionGraded = await SessionService.updateQuestionResponse(
      questionId,
      response,
      evaluation.score,
      evaluation.feedback
    );

    // Check if there are other unanswered questions
    const unanswered = questions.filter(
      q => q.id !== questionId && q.candidate_response === null
    );

    const isCompleted = unanswered.length === 0;

    if (isCompleted) {
      // Transition session status to in_progress first to satisfy trigger rules (defensive state checks)
      await SessionService.updateSession(sessionId, { status: 'in_progress' });
      // Finalize session overall grades & roadmaps
      const finalizedSession = await EvaluationService.completeSession(sessionId);
      return { 
        success: true, 
        completed: true, 
        evaluation: questionGraded, 
        session: finalizedSession 
      };
    } else {
      // Update session status to in_progress if it was scheduled
      const session = await SessionService.getSession(sessionId);
      if (session && session.status === 'scheduled') {
        await SessionService.updateSession(sessionId, { status: 'in_progress' });
      }
      return { 
        success: true, 
        completed: false, 
        evaluation: questionGraded 
      };
    }

  } catch (error: any) {
    console.error('submitAnswerAction error:', error);
    return { success: false, error: error.message || 'Failed to grade response.' };
  }
}

/**
 * Action: Hard deletes a session.
 */
export async function deleteInterviewSessionAction(sessionId: string) {
  try {
    const { user } = await authenticateUser();
    await validateSessionOwner(sessionId, user.id);
    await SessionService.deleteSession(sessionId);
    return { success: true };
  } catch (error: any) {
    console.error('deleteInterviewSessionAction error:', error);
    return { success: false, error: error.message || 'Failed to delete prep session.' };
  }
}

/**
 * Action: Get interview performance analytics.
 */
export async function getInterviewMetricsAction() {
  try {
    const { user } = await authenticateUser();
    const metrics = await SessionService.getInterviewMetrics(user.id);
    return { success: true, metrics };
  } catch (error: any) {
    console.error('getInterviewMetricsAction error:', error);
    return { success: false, error: error.message || 'Failed to retrieve interview metrics.' };
  }
}
