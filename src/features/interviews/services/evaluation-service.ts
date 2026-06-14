import { queryOpenRouter, ChatMessage } from '@/lib/openrouter';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SessionService } from './session-service';
import { InterviewSession, QuestionCategory } from '../types';

function parseJSONSafe<T>(jsonStr: string, fallback: T): T {
  try {
    let cleanStr = jsonStr.trim();
    if (cleanStr.startsWith('```json')) {
      cleanStr = cleanStr.substring(7);
    } else if (cleanStr.startsWith('```')) {
      cleanStr = cleanStr.substring(3);
    }
    if (cleanStr.endsWith('```')) {
      cleanStr = cleanStr.substring(0, cleanStr.length - 3);
    }
    return JSON.parse(cleanStr.trim()) as T;
  } catch (e) {
    console.error('Failed to parse AI JSON response:', e, jsonStr);
    return fallback;
  }
}

export class EvaluationService {
  /**
   * Tailor-generates 5 specialized questions (Behavioral, Technical, Role-Specific,
   * Skill Gap, and Company-Specific) based on resume and job specs.
   */
  static async generateQuestions(userId: string, sessionId: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();
    const session = await SessionService.getSession(sessionId);
    if (!session) throw new Error('Interview session not found.');

    // 1. Fetch Latest Resume
    const { data: resume } = await supabase
      .from('resumes')
      .select('id, content')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const resumeText = resume?.content || 'No resume uploaded. Candidate is preparing generally.';

    // 2. Fetch Job Details (if linked)
    let jobDescription = '';
    let missingSkills: string[] = [];

    if (session.job_id) {
      const { data: job } = await supabase
        .from('job_descriptions')
        .select('description')
        .eq('id', session.job_id)
        .maybeSingle();

      if (job) {
        jobDescription = job.description;
      }

      if (resume) {
        const { data: match } = await supabase
          .from('job_matches')
          .select('missing_skills')
          .eq('resume_id', resume.id)
          .eq('job_id', session.job_id)
          .maybeSingle();

        if (match && match.missing_skills) {
          missingSkills = match.missing_skills;
        }
      }
    }

    // 3. Compile prompts
    const systemPrompt = `You are a Principal Technical Recruiter and Career Coach. 
Generate exactly 5 mock interview questions tailored to the candidate's resume, target job description, and skills profile.
The questions MUST represent the following categories:
1. "behavioral": STAR method behavioral scenarios.
2. "technical": Core technical stack and conceptual accuracy.
3. "role_specific": Domain challenge relevant specifically to the job title.
4. "skill_gap": Tests candidate competence in key areas they may be missing or weak in.
5. "company_specific": Tailored to the company's business model, product stack, or constraints.

Resume Content:
${resumeText}

Target Job Title: ${session.job_title}
Target Company: ${session.company_name}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}
${missingSkills.length > 0 ? `Identified Candidate Skill Gaps: ${missingSkills.join(', ')}` : ''}

Respond ONLY with a JSON object of the following format:
{
  "questions": [
    {
      "questionText": "Question string here?",
      "category": "behavioral" // must be one of: 'behavioral', 'technical', 'role_specific', 'skill_gap', 'company_specific'
    },
    ...
  ]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate my 5 tailored interview prep questions.' }
    ];

    try {
      const responseText = await queryOpenRouter(messages, {
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const parsed = parseJSONSafe(responseText, { questions: [] as any[] });
      
      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error('LLM generated empty questions array.');
      }

      // 4. Save questions in database
      const questionsData = parsed.questions.map((q: any) => ({
        session_id: sessionId,
        question_text: q.questionText,
        category: q.category as QuestionCategory,
        candidate_response: null,
        score: null,
        feedback: null
      }));
      await SessionService.createQuestions(questionsData);

      return true;
    } catch (err) {
      console.error('generateQuestions LLM error:', err);
      // Fallback: create default questions
      const fallbacks = [
        { text: 'Tell me about yourself and why you want to work at ' + session.company_name, cat: 'behavioral' },
        { text: 'What is your experience working as a ' + session.job_title, cat: 'role_specific' },
        { text: 'Explain a complex technical architecture you designed recently.', cat: 'technical' },
        { text: 'How do you approach learning a new framework or technology where you have a skill gap?', cat: 'skill_gap' },
        { text: 'What do you think is the biggest engineering challenge ' + session.company_name + ' is facing today?', cat: 'company_specific' }
      ];

      const fallbackQuestions = fallbacks.map(q => ({
        session_id: sessionId,
        question_text: q.text,
        category: q.cat as QuestionCategory,
        candidate_response: null,
        score: null,
        feedback: null
      }));
      await SessionService.createQuestions(fallbackQuestions);

      return false;
    }
  }

  /**
   * Grades a single candidate question answer.
   */
  static async evaluateAnswer(
    questionText: string,
    category: string,
    candidateResponse: string
  ): Promise<{ score: number; feedback: string }> {
    const systemPrompt = `You are a strict, helpful technical interview coach. Grade the candidate's response to the given question.
Assess correctness, depth, STAR structure (for behavioral), and articulation. Give a score from 1 to 10.
Provide constructive feedback detailing strengths, weaknesses, and a suggested model answer.

Question: "${questionText}"
Category: "${category}"

Respond ONLY with a JSON object of the following format:
{
  "score": 8, // integer 1 to 10
  "feedback": "Actionable feedback detailing strengths, weaknesses, and a suggested model answer."
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Candidate Answer:\n${candidateResponse}` }
    ];

    try {
      const responseText = await queryOpenRouter(messages, {
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const parsed = parseJSONSafe(responseText, {
        score: 5,
        feedback: 'Evaluation completed with generic feedback. Keep practicing!'
      });

      return parsed;
    } catch (err) {
      console.error('evaluateAnswer LLM error:', err);
      return {
        score: 6,
        feedback: 'Could not complete deep grading due to connection issues. Your response was logged.'
      };
    }
  }

  /**
   * Final wrap-up compiler of sub-dimensions and roadmap tasks.
   */
  static async completeSession(sessionId: string): Promise<InterviewSession> {
    const session = await SessionService.getSession(sessionId);
    if (!session) throw new Error('Session not found.');

    const questions = await SessionService.getSessionQuestions(sessionId);

    // Compile chat log
    let chatLog = '';
    questions.forEach((q, i) => {
      chatLog += `[Question ${i + 1}] Category: ${q.category}\nQ: ${q.question_text}\nA: ${q.candidate_response || 'No Answer'}\nScore: ${q.score}/10\nFeedback: ${q.feedback || 'None'}\n\n`;
    });

    const systemPrompt = `You are a Staff Principal Interview Assessor. Evaluate the candidate's overall performance in the mock interview.
Assess the conversation log containing questions, responses, scores, and individual feedback.

Calculate scores (out of 100) for the following dimensions:
1. communicationScore: Clarity, structure, STAR method.
2. technicalScore: Core concepts correctness, stack depth.
3. confidenceScore: Tone of certainty, ownership.
4. problemSolvingScore: Edge-case considerations, system thinking.
5. behavioralScore: Ownership, cultural fit.

Generate an overall score (0-100) as an aggregate.
Compile a detailed Improvement Roadmap containing:
- feedbackSummary: General encouraging review.
- weaknesses: Top 3 weaknesses identified.
- studyAreas: Specific concepts/skills to study.
- practiceExercises: Actionable exercises/challenges.
- nextSteps: Immediate next actions.

Respond ONLY with a JSON object of the following format:
{
  "communicationScore": 85,
  "technicalScore": 80,
  "confidenceScore": 90,
  "problemSolvingScore": 75,
  "behavioralScore": 85,
  "overallScore": 83,
  "feedbackSummary": "Overall summary review...",
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "studyAreas": ["concept 1", "concept 2"],
  "practiceExercises": ["exercise 1", "exercise 2"],
  "nextSteps": ["action 1", "action 2"]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Review session log:\n\n${chatLog}` }
    ];

    try {
      const responseText = await queryOpenRouter(messages, {
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const parsed = parseJSONSafe(responseText, {
        communicationScore: 70,
        technicalScore: 70,
        confidenceScore: 70,
        problemSolvingScore: 70,
        behavioralScore: 70,
        overallScore: 70,
        feedbackSummary: 'Completed. Needs study in core focus areas.',
        weaknesses: ['Communication structured format', 'Technical articulation'],
        studyAreas: ['Coding concepts'],
        practiceExercises: ['Run mock simulator prep'],
        nextSteps: ['Schedule another practice round']
      });

      return await SessionService.updateSession(sessionId, {
        status: 'completed',
        communication_score: parsed.communicationScore,
        technical_score: parsed.technicalScore,
        confidence_score: parsed.confidenceScore,
        problem_solving_score: parsed.problemSolvingScore,
        behavioral_score: parsed.behavioralScore,
        overall_score: parsed.overallScore,
        feedback_summary: parsed.feedbackSummary,
        weaknesses: parsed.weaknesses,
        study_areas: parsed.studyAreas,
        practice_exercises: parsed.practiceExercises,
        next_steps: parsed.nextSteps
      });

    } catch (err) {
      console.error('completeSession LLM error:', err);
      // Fallback
      return await SessionService.updateSession(sessionId, {
        status: 'completed',
        communication_score: 70,
        technical_score: 70,
        confidence_score: 70,
        problem_solving_score: 70,
        behavioral_score: 70,
        overall_score: 70,
        feedback_summary: 'Interview simulation ended. Please check your network and run another evaluation.',
        weaknesses: ['Data connection fallback completed'],
        study_areas: ['Interview general concepts'],
        practice_exercises: ['Practice with additional sessions'],
        next_steps: ['Create a new prep session']
      });
    }
  }
}
