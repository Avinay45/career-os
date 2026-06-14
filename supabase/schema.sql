-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES table (no references)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  target_role text,
  skills text[], -- list of key skills
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RESUMES table (references auth.users)
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text default 'Untitled Resume' not null,
  content text, -- parsed text or markdown
  skills text[],
  file_url text, -- Supabase Storage URL
  status text default 'draft' not null check (status in ('draft', 'uploaded', 'parsing', 'parsed', 'analyzing', 'analyzed', 'analysis_failed')),
  mime_type text,
  file_size integer,
  word_count integer,
  character_count integer,
  ats_score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. GLOBAL SKILLS table (no references)
create table if not exists public.skills (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  category text default 'other' not null check (category in ('frontend', 'backend', 'devops', 'design', 'management', 'other')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. JOB DESCRIPTIONS table (references auth.users)
create table if not exists public.job_descriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company_name text not null,
  job_title text not null,
  description text not null,
  location text,
  employment_type text,
  salary text,
  status text default 'draft' not null check (status in ('draft', 'saved', 'parsed', 'matched', 'archived')),
  experience_requirements text,
  responsibilities text[],
  education_requirements text,
  keywords text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. JOBS table (legacy table, references auth.users)
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company_name text not null,
  job_title text not null,
  description text not null,
  url text,
  skills_required text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. RESUME JOB ANALYSES table (references resumes, jobs)
create table if not exists public.resume_job_analyses (
  id uuid default gen_random_uuid() primary key,
  resume_id uuid references public.resumes on delete cascade not null,
  job_id uuid references public.jobs on delete cascade not null,
  ats_score integer default 0,
  matching_skills text[],
  missing_skills text[],
  feedback jsonb, -- detailed structure: { "formatting": [], "impact": [], "general": "" }
  improved_resume_content text, -- AI-suggested content adjustments
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. COVER LETTERS table (references resumes, jobs)
create table if not exists public.cover_letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  resume_id uuid references public.resumes on delete cascade,
  job_id uuid references public.jobs on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. MOCK INTERVIEWS table (references jobs)
create table if not exists public.mock_interviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  job_id uuid references public.jobs on delete cascade,
  title text default 'General Interview Preparation' not null,
  questions jsonb not null, -- JSON list of questions
  overall_score integer,
  overall_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. JOB APPLICATIONS (references auth.users, job_descriptions)
create table if not exists public.job_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  job_id uuid references public.job_descriptions on delete set null,
  company_name text not null,
  job_title text not null,
  salary text,
  location text,
  status text default 'wishlist' not null check (
    status in (
      'wishlist', 'applied', 'screening', 'interviewing', 
      'technical', 'final_round', 'offered', 'accepted', 
      'rejected', 'withdrawn'
    )
  ),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  applied_at timestamp with time zone,
  interview_dates timestamp with time zone[] default '{}'::timestamp with time zone[] not null,
  offer_date timestamp with time zone,
  outcome_date timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. JOB APPLICATION HISTORY table (references job_applications)
create table if not exists public.job_application_history (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.job_applications on delete cascade not null,
  from_stage text check (
    from_stage in (
      'wishlist', 'applied', 'screening', 'interviewing', 
      'technical', 'final_round', 'offered', 'accepted', 
      'rejected', 'withdrawn'
    )
  ),
  to_stage text not null check (
    to_stage in (
      'wishlist', 'applied', 'screening', 'interviewing', 
      'technical', 'final_round', 'offered', 'accepted', 
      'rejected', 'withdrawn'
    )
  ),
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text
);

-- 11. RESUME ANALYSES table (references resumes)
create table if not exists public.resume_analyses (
  id uuid default gen_random_uuid() primary key,
  resume_id uuid references public.resumes on delete cascade unique not null,
  ats_score integer check (ats_score >= 0 and ats_score <= 100),
  formatting_score integer check (formatting_score >= 0 and formatting_score <= 100),
  keyword_score integer check (keyword_score >= 0 and keyword_score <= 100),
  impact_score integer check (impact_score >= 0 and impact_score <= 100),
  readability_score integer check (readability_score >= 0 and readability_score <= 100),
  coaching_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. ANALYSIS SUGGESTIONS table (references resume_analyses)
create table if not exists public.analysis_suggestions (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid references public.resume_analyses on delete cascade not null,
  category text not null check (category in ('formatting', 'keyword', 'impact', 'improvement')),
  suggestion text not null,
  priority text default 'medium' not null check (priority in ('low', 'medium', 'high'))
);

-- 13. AI CONVERSATIONS table (references auth.users)
create table if not exists public.ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text default 'New Conversation' not null,
  status text default 'active' not null check (status in ('active', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. AI MESSAGES table (references ai_conversations)
create table if not exists public.ai_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.ai_conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. JOB SKILLS table (references job_descriptions, skills)
create table if not exists public.job_skills (
  job_id uuid references public.job_descriptions on delete cascade not null,
  skill_id uuid references public.skills on delete cascade not null,
  is_preferred boolean default false not null,
  primary key (job_id, skill_id)
);

-- 16. RESUME SKILLS table (references resumes, skills)
create table if not exists public.resume_skills (
  resume_id uuid references public.resumes on delete cascade not null,
  skill_id uuid references public.skills on delete cascade not null,
  primary key (resume_id, skill_id)
);

-- 17. JOB MATCHES table (references resumes, job_descriptions)
create table if not exists public.job_matches (
  id uuid default gen_random_uuid() primary key,
  resume_id uuid references public.resumes on delete cascade not null,
  job_id uuid references public.job_descriptions on delete cascade not null,
  match_score integer default 0 not null check (match_score >= 0 and match_score <= 100),
  matching_skills text[] default '{}'::text[] not null,
  missing_skills text[] default '{}'::text[] not null,
  gap_analysis text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (resume_id, job_id)
);

-- 18. SKILL GAPS table (references job_matches, skills)
create table if not exists public.skill_gaps (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.job_matches on delete cascade not null,
  skill_id uuid references public.skills on delete cascade not null,
  gap_severity text default 'medium' not null check (gap_severity in ('low', 'medium', 'high')),
  recommendation text,
  unique (match_id, skill_id)
);

-- 19. INTERVIEW SESSIONS table (references auth.users, job_applications, job_descriptions)
create table if not exists public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  application_id uuid references public.job_applications on delete cascade,
  job_id uuid references public.job_descriptions on delete set null,
  company_name text not null,
  job_title text not null,
  interview_type text default 'mixed' not null check (
    interview_type in ('behavioral', 'technical', 'screening', 'system_design', 'mixed')
  ),
  scheduled_date timestamp with time zone not null,
  status text default 'scheduled' not null check (
    status in ('scheduled', 'in_progress', 'completed')
  ),
  communication_score integer check (communication_score >= 0 and communication_score <= 100),
  technical_score integer check (technical_score >= 0 and technical_score <= 100),
  confidence_score integer check (confidence_score >= 0 and confidence_score <= 100),
  problem_solving_score integer check (problem_solving_score >= 0 and problem_solving_score <= 100),
  behavioral_score integer check (behavioral_score >= 0 and behavioral_score <= 100),
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  feedback_summary text,
  weaknesses text[] default '{}'::text[] not null,
  study_areas text[] default '{}'::text[] not null,
  practice_exercises text[] default '{}'::text[] not null,
  next_steps text[] default '{}'::text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 20. INTERVIEW QUESTIONS table (references interview_sessions)
create table if not exists public.interview_questions (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.interview_sessions on delete cascade not null,
  question_text text not null,
  category text not null check (
    category in ('behavioral', 'technical', 'role_specific', 'skill_gap', 'company_specific')
  ),
  candidate_response text,
  score integer check (score >= 0 and score <= 10),
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Resumes
alter table public.resumes enable row level security;
create policy "Users can manage own resumes" on public.resumes for all using (auth.uid() = user_id);

-- Skills
alter table public.skills enable row level security;
create policy "Anyone can read skills" on public.skills for select using (true);
create policy "Anyone can insert skills" on public.skills for insert with check (auth.role() = 'authenticated');

-- Job Descriptions
alter table public.job_descriptions enable row level security;
create policy "Users can manage own job descriptions" on public.job_descriptions for all using (auth.uid() = user_id);

-- Legacy Jobs
alter table public.jobs enable row level security;
create policy "Users can manage own jobs" on public.jobs for all using (auth.uid() = user_id);

-- Resume Job Analyses
alter table public.resume_job_analyses enable row level security;
create policy "Users can manage own analyses" on public.resume_job_analyses for all using (
  exists (select 1 from public.resumes where resumes.id = resume_job_analyses.resume_id and resumes.user_id = auth.uid())
);

-- Cover Letters
alter table public.cover_letters enable row level security;
create policy "Users can manage own cover letters" on public.cover_letters for all using (auth.uid() = user_id);

-- Mock Interviews
alter table public.mock_interviews enable row level security;
create policy "Users can manage own mock interviews" on public.mock_interviews for all using (auth.uid() = user_id);

-- Job Applications
alter table public.job_applications enable row level security;
create policy "Users can manage own job applications" on public.job_applications for all using (auth.uid() = user_id);

-- Job Application History
alter table public.job_application_history enable row level security;
create policy "Users can manage own application history" on public.job_application_history for all using (
  exists (
    select 1 from public.job_applications
    where job_applications.id = job_application_history.application_id
    and job_applications.user_id = auth.uid()
  )
);

-- Resume Analyses
alter table public.resume_analyses enable row level security;
create policy "Users can manage own resume analyses" on public.resume_analyses for all using (
  exists (select 1 from public.resumes where resumes.id = resume_analyses.resume_id and resumes.user_id = auth.uid())
);

-- Analysis Suggestions
alter table public.analysis_suggestions enable row level security;
create policy "Users can manage own analysis suggestions" on public.analysis_suggestions for all using (
  exists (
    select 1 from public.resume_analyses ra
    join public.resumes r on r.id = ra.resume_id
    where ra.id = analysis_suggestions.analysis_id and r.user_id = auth.uid()
  )
);

-- AI Conversations
alter table public.ai_conversations enable row level security;
create policy "Users can manage own conversations" on public.ai_conversations for all using (auth.uid() = user_id);

-- AI Messages
alter table public.ai_messages enable row level security;
create policy "Users can manage own messages" on public.ai_messages for all using (
  exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
    and ai_conversations.user_id = auth.uid()
  )
);

-- Job Skills
alter table public.job_skills enable row level security;
create policy "Users can manage own job skills" on public.job_skills for all using (
  exists (
    select 1 from public.job_descriptions
    where job_descriptions.id = job_skills.job_id
    and job_descriptions.user_id = auth.uid()
  )
);

-- Resume Skills
alter table public.resume_skills enable row level security;
create policy "Users can manage own resume skills" on public.resume_skills for all using (
  exists (
    select 1 from public.resumes
    where resumes.id = resume_skills.resume_id
    and resumes.user_id = auth.uid()
  )
);

-- Job Matches
alter table public.job_matches enable row level security;
create policy "Users can manage own job matches" on public.job_matches for all using (
  exists (
    select 1 from public.resumes
    where resumes.id = job_matches.resume_id
    and resumes.user_id = auth.uid()
  )
);

-- Skill Gaps
alter table public.skill_gaps enable row level security;
create policy "Users can manage own skill gaps" on public.skill_gaps for all using (
  exists (
    select 1 from public.job_matches
    join public.resumes on resumes.id = job_matches.resume_id
    where job_matches.id = skill_gaps.match_id
    and resumes.user_id = auth.uid()
  )
);

-- Interview Sessions
alter table public.interview_sessions enable row level security;
create policy "Users can manage own interview sessions" on public.interview_sessions for all using (auth.uid() = user_id);

-- Interview Questions
alter table public.interview_questions enable row level security;
create policy "Users can manage own interview questions" on public.interview_questions for all using (
  exists (
    select 1 from public.interview_sessions
    where interview_sessions.id = interview_questions.session_id
    and interview_sessions.user_id = auth.uid()
  )
);


-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
create index if not exists ai_conversations_user_id_idx on public.ai_conversations(user_id);
create index if not exists ai_messages_conversation_id_created_at_idx on public.ai_messages(conversation_id, created_at);
create index if not exists job_descriptions_user_id_idx on public.job_descriptions(user_id);
create index if not exists job_matches_job_id_idx on public.job_matches(job_id);
create index if not exists skill_gaps_match_id_idx on public.skill_gaps(match_id);
create index if not exists job_applications_user_id_status_idx on public.job_applications(user_id, status);
create index if not exists job_applications_job_id_idx on public.job_applications(job_id);
create index if not exists job_application_history_application_idx on public.job_application_history(application_id);
create index if not exists interview_sessions_user_id_status_idx on public.interview_sessions(user_id, status);
create index if not exists interview_sessions_application_id_idx on public.interview_sessions(application_id);
create index if not exists interview_questions_session_id_idx on public.interview_questions(session_id);
create index if not exists resumes_user_id_updated_at_idx on public.resumes(user_id, updated_at desc);


-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Profile trigger on Auth User creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to auto-update conversation timestamp when new messages arrive
create or replace function public.handle_update_conversation_timestamp()
returns trigger as $$
begin
  update public.ai_conversations
  set updated_at = timezone('utc'::text, now())
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_ai_message_created
  after insert on public.ai_messages
  for each row execute procedure public.handle_update_conversation_timestamp();

-- Update application timestamp trigger
create or replace function public.handle_update_application_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_job_application_updated
  before update on public.job_applications
  for each row execute procedure public.handle_update_application_timestamp();

-- Update interview timestamp trigger
create or replace function public.handle_update_interview_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_interview_session_updated
  before update on public.interview_sessions
  for each row execute procedure public.handle_update_interview_timestamp();
