import { FollowUpEngine } from '../services/follow-up-engine';
import { JobApplication } from '../types';

// Helper to construct a base mock application
function createMockApp(overrides: Partial<JobApplication> = {}): JobApplication {
  const baseDate = new Date();
  return {
    id: 'test-app-id',
    user_id: 'test-user-id',
    job_id: null,
    company_name: 'Test Corp',
    job_title: 'Software Engineer',
    salary: '$120k',
    location: 'Remote',
    status: 'wishlist',
    notes: 'Some notes',
    created_at: baseDate.toISOString(),
    applied_at: null,
    interview_dates: [],
    offer_date: null,
    outcome_date: null,
    updated_at: baseDate.toISOString(),
    ...overrides
  };
}

function runTests() {
  console.log('--- RUNNING PIPELINE INTELLIGENCE UNIT TESTS ---');

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

  // Test Case 1: Wishlist Application is Healthy
  try {
    const app = createMockApp({ status: 'wishlist' });
    const result = FollowUpEngine.evaluateApplication(app);
    assert(
      'Wishlist Application Health',
      result.health === 'healthy',
      `Expected healthy, got ${result.health}`
    );
    assert(
      'Wishlist Suggestions',
      result.suggestions.some(s => s.includes('Optimize your resume')),
      'Should suggest resume optimization'
    );
  } catch (e: any) {
    failed++;
    console.error('Wishlist test crashed:', e);
  }

  // Test Case 2: Stale Applied Application
  try {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15); // 15 days ago
    const app = createMockApp({
      status: 'applied',
      applied_at: pastDate.toISOString(),
      created_at: pastDate.toISOString()
    });
    const result = FollowUpEngine.evaluateApplication(app);
    assert(
      'Stale Application Health (> 14 days)',
      result.health === 'stale',
      `Expected stale, got ${result.health}`
    );
    assert(
      'Stale Suggestions',
      result.suggestions.some(s => s.includes('pending for 15 days')),
      'Should indicate pending days count'
    );
  } catch (e: any) {
    failed++;
    console.error('Stale test crashed:', e);
  }

  // Test Case 3: Upcoming Interview within 48 Hours
  try {
    const upcomingDate = new Date();
    upcomingDate.setHours(upcomingDate.getHours() + 24); // 24 hours from now
    const app = createMockApp({
      status: 'interviewing',
      interview_dates: [upcomingDate.toISOString()]
    });
    const result = FollowUpEngine.evaluateApplication(app);
    assert(
      'Upcoming Interview Health (< 48 hrs)',
      result.health === 'needs_action',
      `Expected needs_action, got ${result.health}`
    );
    assert(
      'Upcoming Interview Next Action',
      result.nextActions.some(a => a.includes('less than 48 hours')),
      'Should highlight less than 48 hours urgency'
    );
  } catch (e: any) {
    failed++;
    console.error('Upcoming interview test crashed:', e);
  }

  // Test Case 4: Past Interview with Status Unchanged
  try {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3); // 3 days ago
    const app = createMockApp({
      status: 'interviewing',
      interview_dates: [pastDate.toISOString()]
    });
    const result = FollowUpEngine.evaluateApplication(app);
    assert(
      'Past Interview Status Unchanged Health',
      result.health === 'needs_action',
      `Expected needs_action, got ${result.health}`
    );
    assert(
      'Past Interview Next Action',
      result.nextActions.some(a => a.includes('Follow up regarding your interview')),
      'Should suggest following up on past interview'
    );
  } catch (e: any) {
    failed++;
    console.error('Past interview test crashed:', e);
  }

  // Test Case 5: Stale General Application (Activity > 10 days)
  try {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 11); // 11 days ago
    const app = createMockApp({
      status: 'applied',
      updated_at: pastDate.toISOString()
    });
    const result = FollowUpEngine.evaluateApplication(app);
    // Note: status is applied, so the applied check takes precedence if it checks applied_at. 
    // Let's test with screening status and old updated_at
    const appScreening = createMockApp({
      status: 'screening',
      updated_at: pastDate.toISOString()
    });
    const resultScreening = FollowUpEngine.evaluateApplication(appScreening);
    assert(
      'Stale General Application Activity Health',
      resultScreening.health === 'stale',
      `Expected stale, got ${resultScreening.health}`
    );
    assert(
      'Stale General Next Action',
      resultScreening.nextActions.some(a => a.includes('Re-engage')),
      'Should suggest re-engaging'
    );
  } catch (e: any) {
    failed++;
    console.error('General stale test crashed:', e);
  }

  console.log(`\n--- TEST RUN SUMMARY: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  runTests();
}
export { runTests };
