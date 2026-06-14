import { createSupabaseServerClient } from '@/lib/supabase-server';
import { WorkspaceContext } from '../types';

export class ContextBuilder {
  /**
   * Automatically gathers profile, resume, analysis, and active tab states to build a cohesive career coach system context.
   */
  static async buildSystemContext(userId: string, workspaceCtx: WorkspaceContext): Promise<string> {
    const supabase = await createSupabaseServerClient();
    const currentTab = workspaceCtx.activeTab;

    const isTracker = currentTab === 'tracker';
    const isMatcherOrCover = currentTab === 'matcher' || currentTab === 'cover-letter';

    // 1. Fetch Profile, Resume, Job (if jobId exists), Applications, and Sessions concurrently
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const resumePromise = supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const jobPromise = workspaceCtx.jobId
      ? supabase.from('job_descriptions').select('*').eq('id', workspaceCtx.jobId).maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const appsPromise = supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Performance optimization: Omit interview sessions from fetching if user is on matcher/cover-letter/tracker
    const sessionsPromise = !isMatcherOrCover && !isTracker
      ? supabase.from('interview_sessions').select('*').eq('user_id', userId).order('scheduled_date', { ascending: false })
      : Promise.resolve({ data: null, error: null });

    const [profileRes, resumeRes, jobRes, appsRes, sessionsRes] = await Promise.all([
      profilePromise,
      resumePromise,
      jobPromise,
      appsPromise,
      sessionsPromise
    ]);

    const profile = profileRes.data;
    const resume = resumeRes.data;
    const job = jobRes.data;
    const apps = appsRes.data || [];
    const sessions = sessionsRes.data || [];

    let atsAnalysis: any = null;
    let extractedSkills: string[] = [];
    let match: any = null;
    let gaps: any[] = [];
    let rejectedMatches: any[] = [];

    const rejections = apps.filter((a: any) => a.status === 'rejected');
    const rejectedJobIds = rejections.filter((r: any) => r.job_id).map((r: any) => r.job_id);

    // 2. Secondary parallel fetches if resume exists
    const secondaryPromises: Promise<any>[] = [];

    // Promise index 0: analysis
    const fetchAnalysis = resume && !isTracker;
    secondaryPromises.push(
      fetchAnalysis
        ? supabase.from('resume_analyses').select('*').eq('resume_id', resume.id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    );

    // Promise index 1: resume skills
    const fetchSkills = !!resume;
    secondaryPromises.push(
      fetchSkills
        ? supabase.from('resume_skills').select('skills(name)').eq('resume_id', resume.id)
        : Promise.resolve({ data: null, error: null })
    );

    // Promise index 2: job matches
    const fetchMatch = !!(resume && job);
    secondaryPromises.push(
      fetchMatch
        ? supabase
            .from('job_matches')
            .select('*, skill_gaps(gap_severity, recommendation, skills(name))')
            .eq('resume_id', resume.id)
            .eq('job_id', job.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null })
    );

    // Promise index 3: rejected matches
    const fetchRejected = !isMatcherOrCover && rejectedJobIds.length > 0;
    secondaryPromises.push(
      fetchRejected
        ? supabase.from('job_matches').select('missing_skills').in('job_id', rejectedJobIds)
        : Promise.resolve({ data: null, error: null })
    );

    const [analysisRes, junctionSkillsRes, matchRes, rejectedMatchesRes] = await Promise.all(secondaryPromises);

    if (resume) {
      if (resume.skills && Array.isArray(resume.skills)) {
        extractedSkills = [...resume.skills];
      }

      atsAnalysis = analysisRes.data;

      if (junctionSkillsRes && junctionSkillsRes.data) {
        junctionSkillsRes.data.forEach((item: any) => {
          if (item.skills?.name) {
            const name = item.skills.name;
            if (!extractedSkills.includes(name)) {
              extractedSkills.push(name);
            }
          }
        });
      }

      if (matchRes && matchRes.data) {
        match = matchRes.data;
        gaps = matchRes.data.skill_gaps || [];
      }
    }

    if (rejectedMatchesRes && rejectedMatchesRes.data) {
      rejectedMatches = rejectedMatchesRes.data;
    }

    // 3. Synthesize Context Package Prompt
    let prompt = `Candidate Profile:\n`;
    if (profile) {
      prompt += `- Full Name: ${profile.full_name || 'Not Provided'}\n`;
      prompt += `- Target Role: ${profile.target_role || 'Not Provided'}\n`;
      prompt += `- Bio: ${profile.bio || 'Not Provided'}\n`;
      if (profile.skills && profile.skills.length > 0) {
        prompt += `- Profile Skills: ${profile.skills.join(', ')}\n`;
      }
    } else {
      prompt += `- Profile details not configured yet.\n`;
    }

    prompt += `\nActive Resume:\n`;
    if (resume) {
      prompt += `- Resume Title: "${resume.title}"\n`;
      prompt += `- Word Count: ${resume.word_count || 0}\n`;
      prompt += `- Character Count: ${resume.character_count || 0}\n`;
      if (extractedSkills.length > 0) {
        prompt += `- Extracted Resume Skills: ${extractedSkills.join(', ')}\n`;
      }
      
      // Inject ATS Score telemetry
      if (atsAnalysis) {
        prompt += `- ATS General Score: ${atsAnalysis.ats_score || 0}/100\n`;
        prompt += `- Formatting Score: ${atsAnalysis.formatting_score || 0}/100\n`;
        prompt += `- Keyword Match Score: ${atsAnalysis.keyword_score || 0}/100\n`;
        prompt += `- Impact/Metric Score: ${atsAnalysis.impact_score || 0}/100\n`;
        prompt += `- Readability Score: ${atsAnalysis.readability_score || 0}/100\n`;
        if (atsAnalysis.coaching_feedback) {
          prompt += `- Coach Assessment: ${atsAnalysis.coaching_feedback}\n`;
        }
      }

      // Performance optimization: If on tracker tab, prune full resume content
      if (isTracker) {
        prompt += `- [Full Resume text content omitted for Tracker view context pruning]\n`;
      } else {
        // Safe slice resume text to avoid token blowups (limit to first 6,000 characters down from 12,000)
        const resumeContent = resume.content || '';
        const contentSnippet = resumeContent.length > 6000 
          ? resumeContent.substring(0, 6000) + '\n...[Resume text truncated for token limits]...' 
          : resumeContent;
        prompt += `- Resume Text:\n"""\n${contentSnippet}\n"""\n`;
      }
    } else {
      prompt += `- No resume uploaded yet.\n`;
    }

    // 4. Workspace Context
    prompt += `\nWorkspace Session Context:\n`;
    prompt += `- Candidate is currently viewing tab: "${workspaceCtx.activeTab}"\n`;
    if (workspaceCtx.jobTitle) {
      prompt += `- Current target Job Title: "${workspaceCtx.jobTitle}"\n`;
    }
    if (workspaceCtx.companyName) {
      prompt += `- Target Company: "${workspaceCtx.companyName}"\n`;
    }

    // 5. Saved Job Match Context
    if (job) {
      prompt += `\nTarget Saved Job Details:\n`;
      prompt += `- Saved Job Company: "${job.company_name}"\n`;
      prompt += `- Saved Job Title: "${job.job_title}"\n`;
      if (job.location) prompt += `- Location: ${job.location}\n`;
      if (job.employment_type) prompt += `- Employment Type: ${job.employment_type}\n`;
      if (job.salary) prompt += `- Salary: ${job.salary}\n`;
      prompt += `- Detailed DescriptionSnippet:\n"""\n${job.description.substring(0, 1000)}\n"""\n`;

      if (match) {
        prompt += `\nCandidate Alignment with this Job:\n`;
        prompt += `- Match Fit Score: ${match.match_score}/100\n`;
        if (match.matching_skills && match.matching_skills.length > 0) {
          prompt += `- Matching Skills: ${match.matching_skills.join(', ')}\n`;
        }
        if (match.missing_skills && match.missing_skills.length > 0) {
          prompt += `- Missing Skills: ${match.missing_skills.join(', ')}\n`;
        }
        if (match.gap_analysis) {
          prompt += `- Gap Assessment: ${match.gap_analysis}\n`;
        }

        if (gaps.length > 0) {
          prompt += `- Skill Gaps Actionable Tips:\n`;
          gaps.forEach((g: any) => {
            if (g.skills?.name) {
              prompt += `  * Skill "${g.skills.name}" (${g.gap_severity} priority): ${g.recommendation || 'No recommendation provided.'}\n`;
            }
          });
        }
      }
    }
    
    // 6. Career Pipeline Context
    if (apps && apps.length > 0) {
      prompt += `\nCareer Pipeline Applications:\n`;
      
      const activeApps = apps.filter((a: any) => !['accepted', 'rejected', 'withdrawn'].includes(a.status));
      const offers = apps.filter((a: any) => ['offered', 'accepted'].includes(a.status));

      const pipelineCounts = apps.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      prompt += `- Pipeline Summary: `;
      prompt += Object.entries(pipelineCounts)
        .map(([stage, count]) => `${stage}: ${count}`)
        .join(', ') + `\n`;

      if (activeApps.length > 0) {
        prompt += `- Active Applications Tracker:\n`;
        activeApps.forEach((a: any) => {
          prompt += `  * ${a.company_name} - ${a.job_title} (Current Stage: ${a.status})`;
          if (a.location) prompt += ` [Location: ${a.location}]`;
          if (a.salary) prompt += ` [Salary: ${a.salary}]`;
          prompt += `\n`;
        });
      }

      // Upcoming interviews
      const now = new Date();
      const upcomingInts: { company: string; role: string; date: Date }[] = [];
      apps.forEach((a: any) => {
        if (a.interview_dates && Array.isArray(a.interview_dates)) {
          a.interview_dates.forEach((dStr: string) => {
            const d = new Date(dStr);
            if (!isNaN(d.getTime()) && d.getTime() > now.getTime()) {
              upcomingInts.push({ company: a.company_name, role: a.job_title, date: d });
            }
          });
        }
      });

      if (upcomingInts.length > 0) {
        prompt += `- Upcoming Interviews:\n`;
        upcomingInts
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .forEach(i => {
            prompt += `  * ${i.company} (${i.role}) scheduled on ${i.date.toLocaleString()}\n`;
          });
      }

      // Offer history
      if (offers.length > 0) {
        prompt += `- Offer History:\n`;
        offers.forEach((a: any) => {
          prompt += `  * ${a.company_name} - ${a.job_title} (Status: ${a.status})`;
          if (a.salary) prompt += ` - Offer Terms: ${a.salary}`;
          if (a.offer_date) prompt += ` [Offer Date: ${new Date(a.offer_date).toLocaleDateString()}]`;
          prompt += `\n`;
        });
      }

      // Rejection Patterns and associated skill gaps (pruned based on active tab)
      if (!isMatcherOrCover && rejections.length > 0) {
        prompt += `- Rejection History & Patterns:\n`;
        
        if (rejectedMatches && rejectedMatches.length > 0) {
          prompt += `  * Missing skills linked to past rejections:\n`;
          const missingSkillCounts: Record<string, number> = {};
          rejectedMatches.forEach((m: any) => {
            if (m.missing_skills && Array.isArray(m.missing_skills)) {
              m.missing_skills.forEach((skill: string) => {
                missingSkillCounts[skill] = (missingSkillCounts[skill] || 0) + 1;
              });
            }
          });

          Object.entries(missingSkillCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([skill, count]) => {
              prompt += `    - "${skill}" (Missing in ${count} rejected job application${count > 1 ? 's' : ''})\n`;
            });
        }

        rejections.forEach((a: any) => {
          prompt += `  * Rejected Lead: ${a.company_name} (${a.job_title})`;
          if (a.notes) prompt += ` - Candidate Notes: "${a.notes}"`;
          prompt += `\n`;
        });
      }
    }

    // 7. Interview Prep Intelligence Context (pruned based on active tab)
    if (!isMatcherOrCover && !isTracker && sessions && sessions.length > 0) {
      prompt += `\nInterview Prep & Performance Context:\n`;

      const completed = sessions.filter((s: any) => s.status === 'completed');
      const upcoming = sessions.filter((s: any) => s.status === 'scheduled');

      prompt += `- Upcoming Interviews Scheduled: ${upcoming.length}\n`;
      if (upcoming.length > 0) {
        upcoming.forEach((s: any) => {
          prompt += `  * ${s.company_name} - ${s.job_title} (${s.interview_type} prep scheduled on ${new Date(s.scheduled_date).toLocaleString()})\n`;
        });
      }

      prompt += `- Completed Mock Sessions: ${completed.length}\n`;
      if (completed.length > 0) {
        const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
        const avg = (arr: number[]) => arr.length > 0 ? Math.round(sum(arr) / arr.length) : 0;
        
        const overall = completed.map((s: any) => s.overall_score || 0);
        const comm = completed.map((s: any) => s.communication_score || 0).filter((v: number) => v > 0);
        const tech = completed.map((s: any) => s.technical_score || 0).filter((v: number) => v > 0);
        const conf = completed.map((s: any) => s.confidence_score || 0).filter((v: number) => v > 0);
        const prob = completed.map((s: any) => s.problem_solving_score || 0).filter((v: number) => v > 0);
        const beh = completed.map((s: any) => s.behavioral_score || 0).filter((v: number) => v > 0);

        prompt += `- Average Mock Scores (out of 100):\n`;
        prompt += `  * Overall Score: ${avg(overall)}/100\n`;
        prompt += `  * Communication: ${avg(comm)}/100 | Technical Accuracy: ${avg(tech)}/100\n`;
        prompt += `  * Confidence: ${avg(conf)}/100 | Problem Solving: ${avg(prob)}/100 | Behavioral: ${avg(beh)}/100\n`;

        const weaknesses = new Set<string>();
        const studyAreas = new Set<string>();
        const nextSteps = new Set<string>();

        completed.forEach((s: any) => {
          s.weaknesses?.forEach((w: string) => weaknesses.add(w));
          s.study_areas?.forEach((sa: string) => studyAreas.add(sa));
          s.next_steps?.forEach((ns: string) => nextSteps.add(ns));
        });

        if (weaknesses.size > 0) {
          prompt += `- Identified Candidate Weaknesses:\n`;
          Array.from(weaknesses).slice(0, 5).forEach(w => {
            prompt += `  * ${w}\n`;
          });
        }

        if (studyAreas.size > 0) {
          prompt += `- Improvement Planner Study Areas:\n`;
          Array.from(studyAreas).slice(0, 5).forEach(sa => {
            prompt += `  * ${sa}\n`;
          });
        }

        if (nextSteps.size > 0) {
          prompt += `- Recommended Next Action Items:\n`;
          Array.from(nextSteps).slice(0, 5).forEach(ns => {
            prompt += `  * ${ns}\n`;
          });
        }

        const lastSession = completed[0];
        prompt += `- Last Completed Prep Review (${lastSession.company_name} - ${lastSession.job_title}):\n`;
        prompt += `  * Final Score: ${lastSession.overall_score}/100\n`;
        if (lastSession.feedback_summary) {
          prompt += `  * Assessor Assessment: "${lastSession.feedback_summary}"\n`;
        }
      }
    }
    
    return prompt;
  }
}
