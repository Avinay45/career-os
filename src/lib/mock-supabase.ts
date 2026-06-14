// Stateful In-Memory Mock Database Tables
let mockProfilesTable: any[] = [
  {
    id: 'mock-user-123',
    full_name: 'Vinay Chary',
    target_role: 'Senior Staff Engineer',
    bio: 'Experienced platform developer specializing in distributed systems and cloud architecture.',
    skills: ['Go', 'TypeScript', 'Kubernetes', 'PostgreSQL'],
  }
];

let mockResumesTable: any[] = [
  {
    id: 'resume-123',
    user_id: 'mock-user-123',
    title: 'Vinay Resume v3',
    word_count: 1200,
    character_count: 8500,
    skills: ['Go', 'TypeScript', 'Kubernetes', 'PostgreSQL', 'Docker', 'React'],
    content: 'EXPERIENCE: Senior Backend Engineer at TechCorp. Built microservices in Go.',
  }
];

let mockJobDescriptionsTable: any[] = [
  {
    id: 'job-123',
    user_id: 'mock-user-123',
    company_name: 'Stripe',
    job_title: 'Staff Platform Engineer',
    location: 'Remote, US',
    employment_type: 'Full-time',
    salary: '$180k - $220k',
    description: 'We are looking for a Staff Platform Engineer with extensive Go and Kubernetes experience.',
  }
];

let mockJobMatchesTable: any[] = [
  {
    id: 'match-123',
    resume_id: 'resume-123',
    job_id: 'job-123',
    match_score: 85,
    matching_skills: ['Go', 'Kubernetes', 'PostgreSQL'],
    missing_skills: ['Docker', 'AWS'],
    gap_analysis: 'Overall good match, but candidate lacks cloud certification.',
  }
];

let mockApplicationsTable: any[] = [
  {
    id: 'app-1',
    user_id: 'mock-user-123',
    company_name: 'Stripe',
    job_title: 'Staff Platform Engineer',
    status: 'applied',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'app-2',
    user_id: 'mock-user-123',
    company_name: 'Linear',
    job_title: 'Senior Product Engineer',
    status: 'interviewing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockSessionsTable: any[] = [
  {
    id: 'session-1',
    user_id: 'mock-user-123',
    company_name: 'Stripe',
    job_title: 'Staff Platform Engineer',
    status: 'scheduled',
    interview_type: 'mixed',
    scheduled_date: new Date(Date.now() + 86400000).toISOString(),
    overall_score: null,
    communication_score: null,
    technical_score: null,
    confidence_score: null,
    problem_solving_score: null,
    behavioral_score: null,
    feedback_summary: null,
    weaknesses: null,
    study_areas: null,
    practice_exercises: null,
    next_steps: null,
  }
];

let mockQuestionsTable: any[] = [
  {
    id: 'q-1',
    session_id: 'session-1',
    question_text: 'Explain how you would handle race conditions in a distributed system with Go.',
    category: 'technical',
    candidate_response: null,
    score: null,
    feedback: null,
    created_at: new Date(Date.now() - 10000).toISOString(),
  },
  {
    id: 'q-2',
    session_id: 'session-1',
    question_text: 'Describe a situation where you had a conflict with a product manager and how you resolved it.',
    category: 'behavioral',
    candidate_response: null,
    score: null,
    feedback: null,
    created_at: new Date().toISOString(),
  }
];

let mockResumeAnalysesTable: any[] = [
  {
    id: 'analysis-123',
    resume_id: 'resume-123',
    ats_score: 82,
    formatting_score: 90,
    keyword_score: 75,
    impact_score: 80,
    readability_score: 85,
    coaching_feedback: 'Resume format is strong. Consider adding metrics for cloud cost optimizations.',
  }
];

let mockSkillsTable: any[] = [
  { id: '1', name: 'Go' },
  { id: '2', name: 'TypeScript' },
  { id: '3', name: 'Kubernetes' },
  { id: '4', name: 'PostgreSQL' },
  { id: '5', name: 'Docker' },
  { id: '6', name: 'React' },
  { id: '7', name: 'AWS' },
];

let mockConversationsTable: any[] = [
  {
    id: 'conversation-123',
    user_id: 'mock-user-123',
    title: 'General Chat Coach',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockMessagesTable: any[] = [
  {
    id: 'msg-1',
    conversation_id: 'conversation-123',
    role: 'system',
    content: 'You are Antigravity, a helpful career assistant.',
    created_at: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: 'msg-2',
    conversation_id: 'conversation-123',
    role: 'assistant',
    content: 'Hi! How can I help you prepare for Stripe platform engineer role today?',
    created_at: new Date().toISOString(),
  }
];

let mockJobSkillsTable: any[] = [
  { job_id: 'job-123', skill_id: '1', is_preferred: false, skills: { name: 'Go', category: 'languages' } },
  { job_id: 'job-123', skill_id: '2', is_preferred: false, skills: { name: 'TypeScript', category: 'languages' } },
  { job_id: 'job-123', skill_id: '3', is_preferred: true, skills: { name: 'Kubernetes', category: 'tools' } }
];

let mockResumeSkillsTable: any[] = [
  { resume_id: 'resume-123', skill_id: '1', skills: { name: 'Go' } },
  { resume_id: 'resume-123', skill_id: '2', skills: { name: 'TypeScript' } }
];

let mockSkillGapsTable: any[] = [
  {
    id: 'gap-1',
    match_id: 'match-123',
    skill_id: '7',
    gap_severity: 'medium',
    recommendation: 'Earn AWS Developer Associate certification.',
    skills: { name: 'AWS' }
  },
  {
    id: 'gap-2',
    match_id: 'match-123',
    skill_id: '5',
    gap_severity: 'low',
    recommendation: 'Configure a multi-stage Docker build for your Go services.',
    skills: { name: 'Docker' }
  }
];

function enrichRowRelations(table: string, row: any): any {
  if (!row) return row;
  const enriched = { ...row };

  if (table === 'job_skills') {
    if (enriched.skill_id && !enriched.skills) {
      const skill = mockSkillsTable.find(s => s.id === enriched.skill_id);
      if (skill) {
        enriched.skills = { name: skill.name, category: skill.category || 'other' };
      }
    }
  } else if (table === 'resume_skills') {
    if (enriched.skill_id && !enriched.skills) {
      const skill = mockSkillsTable.find(s => s.id === enriched.skill_id);
      if (skill) {
        enriched.skills = { name: skill.name };
      }
    }
  } else if (table === 'skill_gaps') {
    if (enriched.skill_id && !enriched.skills) {
      const skill = mockSkillsTable.find(s => s.id === enriched.skill_id);
      if (skill) {
        enriched.skills = { name: skill.name };
      }
    }
  } else if (table === 'job_matches') {
    const gaps = mockSkillGapsTable.filter(g => g.match_id === enriched.id);
    enriched.skill_gaps = gaps.map(g => enrichRowRelations('skill_gaps', g));
  }

  return enriched;
}

function getTableArray(table: string): any[] {
  if (table === 'profiles') return mockProfilesTable;
  if (table === 'resumes') return mockResumesTable;
  if (table === 'job_descriptions') return mockJobDescriptionsTable;
  if (table === 'job_matches') return mockJobMatchesTable;
  if (table === 'job_applications') return mockApplicationsTable;
  if (table === 'interview_sessions') return mockSessionsTable;
  if (table === 'interview_questions') return mockQuestionsTable;
  if (table === 'resume_analyses') return mockResumeAnalysesTable;
  if (table === 'skills') return mockSkillsTable;
  if (table === 'ai_conversations') return mockConversationsTable;
  if (table === 'ai_messages') return mockMessagesTable;
  if (table === 'job_skills') return mockJobSkillsTable;
  if (table === 'resume_skills') return mockResumeSkillsTable;
  if (table === 'skill_gaps') return mockSkillGapsTable;
  return [];
}

export function getMockSupabaseClient(cookieStore?: any) {
  let hasSession = false;
  if (cookieStore) {
    try {
      hasSession = !!cookieStore.get('career_os_mock_user');
    } catch (e) {
      // ignore context errors
    }
  } else if (typeof window !== 'undefined') {
    hasSession = document.cookie.includes('career_os_mock_user');
  }

  const mockUser = {
    id: 'mock-user-123',
    email: 'vinaychary45@gmail.com',
    user_metadata: {
      full_name: 'Vinay Chary',
      target_role: 'Senior Staff Engineer',
    },
  };

  return {
    auth: {
      getUser: async () => {
        if (hasSession) {
          return { data: { user: mockUser }, error: null };
        }
        return { data: { user: null }, error: null };
      },
      getSession: async () => {
        if (hasSession) {
          return { data: { session: { user: mockUser } }, error: null };
        }
        return { data: { session: null }, error: null };
      },
      onAuthStateChange: (callback: any) => {
        if (hasSession) {
          callback('SIGNED_IN', { user: mockUser });
        } else {
          callback('SIGNED_OUT', null);
        }
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: async ({ email }: { email: string }) => {
        if (typeof window !== 'undefined') {
          document.cookie = `career_os_mock_user=true; path=/; max-age=86400`;
        }
        return { data: { user: { ...mockUser, email } }, error: null };
      },
      signUp: async ({ email }: { email: string }) => {
        if (typeof window !== 'undefined') {
          document.cookie = `career_os_mock_user=true; path=/; max-age=86400`;
        }
        return { data: { user: { ...mockUser, email } }, error: null };
      },
      signOut: async () => {
        if (typeof window !== 'undefined') {
          document.cookie = `career_os_mock_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
        return { error: null };
      },
    },
    from: (table: string) => {
      let filters: { col: string; val: any; type: 'eq' | 'in' }[] = [];
      let mutationResult: any = null;

      const getFilteredData = () => {
        let list = getTableArray(table);
        filters.forEach(f => {
          if (f.type === 'eq') {
            list = list.filter((item: any) => item[f.col] === f.val);
          } else if (f.type === 'in') {
            const vals = Array.isArray(f.val) ? f.val : [f.val];
            list = list.filter((item: any) => vals.includes(item[f.col]));
          }
        });
        return list;
      };

      const builder: any = {
        select: (cols: string) => builder,
        eq: (col: string, val: any) => {
          filters.push({ col, val, type: 'eq' });
          return builder;
        },
        in: (col: string, val: any) => {
          filters.push({ col, val, type: 'in' });
          return builder;
        },
        order: (col: string, opt: any) => builder,
        limit: (n: number) => builder,
        range: (start: number, end: number) => builder,
        
        insert: (data: any) => {
          const list = getTableArray(table);
          const rowsToInsert = Array.isArray(data) ? data : [data];
          const inserted = rowsToInsert.map((item: any) => {
            const newRow = {
              id: item.id || `mock-id-${Math.random().toString(36).substring(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...item
            };
            list.push(newRow);
            return newRow;
          });
          mutationResult = Array.isArray(data) ? inserted : inserted[0];
          return builder;
        },

        update: (updates: any) => {
          const list = getFilteredData();
          list.forEach((item: any) => {
            Object.assign(item, updates, { updated_at: new Date().toISOString() });
          });
          mutationResult = list[0] || updates;
          return builder;
        },

        upsert: (data: any, options: any) => {
          const list = getTableArray(table);
          const rowsToUpsert = Array.isArray(data) ? data : [data];
          const upserted = rowsToUpsert.map((item: any) => {
            let existing = null;
            if (options && options.onConflict) {
              const conflictCol = options.onConflict;
              existing = list.find((row: any) => row[conflictCol] === item[conflictCol]);
            }
            if (existing) {
              Object.assign(existing, item, { updated_at: new Date().toISOString() });
              return existing;
            } else {
              const newRow = {
                id: item.id || `mock-id-${Math.random().toString(36).substring(2, 9)}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...item
              };
              list.push(newRow);
              return newRow;
            }
          });
          mutationResult = Array.isArray(data) ? upserted : upserted[0];
          return builder;
        },

        delete: () => {
          const list = getTableArray(table);
          const filtered = getFilteredData();
          filtered.forEach((item: any) => {
            const idx = list.indexOf(item);
            if (idx !== -1) list.splice(idx, 1);
          });
          mutationResult = filtered;
          return builder;
        },

        single: async () => {
          let data = mutationResult !== null ? mutationResult : getFilteredData()[0];
          if (Array.isArray(data)) {
            data = data[0];
          }
          return { data: enrichRowRelations(table, data) || null, error: null };
        },

        maybeSingle: async () => {
          let data = mutationResult !== null ? mutationResult : getFilteredData()[0];
          if (Array.isArray(data)) {
            data = data[0];
          }
          return { data: enrichRowRelations(table, data) || null, error: null };
        },

        then: (resolve: any) => {
          let data = mutationResult !== null ? mutationResult : getFilteredData();
          if (Array.isArray(data)) {
            data = data.map(item => enrichRowRelations(table, item));
          } else if (data) {
            data = enrichRowRelations(table, data);
          }
          return resolve({ data, error: null });
        }
      };

      return builder;
    }
  };
}
