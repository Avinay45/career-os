import { SessionService } from '../services/session-service';
import { EvaluationService } from '../services/evaluation-service';
import { InterviewSession, InterviewQuestion } from '../types';

function createMockSession(overrides: Partial<InterviewSession> = {}): InterviewSession {
  return {
    id: 'session-id',
    user_id: 'user-id',
    application_id: null,
    job_id: null,
    company_name: 'Stripe',
    job_title: 'Software Engineer',
    interview_type: 'mixed',
    scheduled_date: new Date().toISOString(),
    status: 'scheduled',
    communication_score: null,
    technical_score: null,
    confidence_score: null,
    problem_solving_score: null,
    behavioral_score: null,
    overall_score: null,
    feedback_summary: null,
    weaknesses: [],
    study_areas: [],
    practice_exercises: [],
    next_steps: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

async function runTests() {
  console.log('--- RUNNING INTERVIEW INTELLIGENCE PLATFORM UNIT TESTS ---');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${message ? `: ${message}` : ''}`);
      failed++;
    }
  }

  // TEST 1: Session Metrics Calculation with No Completed Sessions
  try {
    const originalListSessions = SessionService.listSessions;
    SessionService.listSessions = async (userId: string) => [
      createMockSession({ id: 's1', status: 'scheduled' })
    ];

    const metrics = await SessionService.getInterviewMetrics('user-id');
    assert('Empty metrics count completed', metrics.completedCount === 0);
    assert('Empty metrics count upcoming', metrics.upcomingCount === 1);
    assert('Empty metrics overall score is 0', metrics.averageOverallScore === 0);

    // Restore original function
    SessionService.listSessions = originalListSessions;
  } catch (e: any) {
    failed++;
    console.error('Test 1 crashed:', e);
  }

  // TEST 2: Session Metrics Averages, Weaknesses, and Chronological Trends
  try {
    const originalListSessions = SessionService.listSessions;
    
    const d1 = new Date();
    d1.setDate(d1.getDate() - 5);
    const d2 = new Date();
    d2.setDate(d2.getDate() - 2);

    SessionService.listSessions = async (userId: string) => [
      // Completed session 2 (newer)
      createMockSession({
        id: 's2',
        status: 'completed',
        scheduled_date: d2.toISOString(),
        overall_score: 90,
        communication_score: 95,
        technical_score: 85,
        confidence_score: 90,
        problem_solving_score: 90,
        behavioral_score: 90,
        weaknesses: ['w1', 'w2'],
        study_areas: ['sa1', 'sa2']
      }),
      // Completed session 1 (older)
      createMockSession({
        id: 's1',
        status: 'completed',
        scheduled_date: d1.toISOString(),
        overall_score: 80,
        communication_score: 85,
        technical_score: 75,
        confidence_score: 80,
        problem_solving_score: 80,
        behavioral_score: 80,
        weaknesses: ['w2', 'w3'],
        study_areas: ['sa2', 'sa3']
      }),
      // Scheduled session (upcoming)
      createMockSession({ id: 's3', status: 'scheduled' })
    ];

    const metrics = await SessionService.getInterviewMetrics('user-id');
    assert('Metrics completed count is 2', metrics.completedCount === 2);
    assert('Metrics upcoming count is 1', metrics.upcomingCount === 1);
    assert('Overall score average matches', metrics.averageOverallScore === 85);
    assert('Communication score average matches', metrics.averageCommunicationScore === 90);
    assert('Technical score average matches', metrics.averageTechnicalScore === 80);

    // Weaknesses uniqueness and cap
    assert('Weaknesses unique aggregation contains w1', metrics.weaknessesSummary.includes('w1'));
    assert('Weaknesses unique aggregation contains w2', metrics.weaknessesSummary.includes('w2'));
    assert('Weaknesses unique aggregation contains w3', metrics.weaknessesSummary.includes('w3'));
    assert('Weaknesses count is 3', metrics.weaknessesSummary.length === 3);

    // Chronological trend data sorting
    assert('Trend data length is 2', metrics.trendData.length === 2);
    assert('Trend data chronologically first matches s1', metrics.trendData[0].score === 80);
    assert('Trend data chronologically second matches s2', metrics.trendData[1].score === 90);

    SessionService.listSessions = originalListSessions;
  } catch (e: any) {
    failed++;
    console.error('Test 2 crashed:', e);
  }

  // TEST 3: Evaluation Service Fallback on completeSession error
  try {
    const originalGetSession = SessionService.getSession;
    const originalGetQuestions = SessionService.getSessionQuestions;
    const originalUpdateSession = SessionService.updateSession;

    // Mock SessionService functions to avoid DB calls
    SessionService.getSession = async (id: string) => createMockSession({ id });
    SessionService.getSessionQuestions = async (id: string) => [];
    
    let updatedSession: any = null;
    SessionService.updateSession = async (id: string, updates: any) => {
      updatedSession = { id, ...updates };
      return updatedSession;
    };

    // completeSession will trigger completeSession evaluation which queryOpenRouter will fail because of mock environment
    // verify it catches the error and falls back gracefully
    const res = await EvaluationService.completeSession('session-id');

    assert('Graceful completed status set', res.status === 'completed');
    assert('Graceful fallback overall score set', res.overall_score === 70);
    assert('Graceful fallback feedback summary set', res.feedback_summary?.includes('simulation ended') === true);
    assert('Graceful fallback weakness logged', res.weaknesses[0] === 'Data connection fallback completed');

    SessionService.getSession = originalGetSession;
    SessionService.getSessionQuestions = originalGetQuestions;
    SessionService.updateSession = originalUpdateSession;
  } catch (e: any) {
    failed++;
    console.error('Test 3 crashed:', e);
  }

  console.log(`\n--- TEST RUN SUMMARY: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

export { runTests };
