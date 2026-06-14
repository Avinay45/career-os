'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  FileSignature, 
  MessageSquareCode, 
  KanbanSquare, 
  Send, 
  Sparkles, 
  Plus, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  RefreshCw,
  Award,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Copy,
  ChevronRight,
  Archive,
  Trash2,
  History,
  MessageSquare
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function WorkspaceSkeleton() {
  return (
    <div className="h-[450px] w-full flex items-center justify-center text-zinc-500 text-xs">
      <RefreshCw className="h-4 w-4 animate-spin text-blue-500 mr-2" />
      <span>Loading Workspace Panel...</span>
    </div>
  );
}

const DashboardWorkspace = dynamic(() => import('@/components/DashboardWorkspace'), {
  loading: () => <WorkspaceSkeleton />,
  ssr: false
});
const ResumeWorkspace = dynamic(() => import('@/features/resume/components/ResumeWorkspace'), {
  loading: () => <WorkspaceSkeleton />,
  ssr: false
});
const MatcherWorkspace = dynamic(() => import('@/features/jobs/components/MatcherWorkspace'), {
  loading: () => <WorkspaceSkeleton />,
  ssr: false
});
const CoverLetterWorkspace = dynamic(() => import('@/features/resume/components/CoverLetterWorkspace'), {
  loading: () => <WorkspaceSkeleton />,
  ssr: false
});
const InterviewWorkspace = dynamic(() => import('@/features/interviews/components/InterviewWorkspace'), {
  loading: () => <WorkspaceSkeleton />,
  ssr: false
});
const TrackerWorkspace = dynamic(() => import('@/features/applications/components/TrackerWorkspace'), {
  loading: () => <WorkspaceSkeleton />,
  ssr: false
});

// Import server actions
import {
  analyzeResumeAction,
  compareResumeWithJobAction,
  generateCoverLetterAction,
  generateInterviewQuestionsAction,
  evaluateInterviewResponseAction
} from '@/app/actions/ai';

import {
  createConversationAction,
  listConversationsAction,
  getConversationMessagesAction,
  sendChatMessageAction,
  deleteConversationAction,
  archiveConversationAction
} from '@/features/chat/actions/chat';

import {
  createJobAction,
  listJobsAction,
  getJobDetailsAction,
  deleteJobAction,
  archiveJobAction,
  runJobMatchAction
} from '@/features/jobs/actions/jobs';

import {
  createApplicationAction,
  updateApplicationAction,
  updateApplicationStageAction,
  deleteApplicationAction,
  listApplicationsAction,
  getApplicationDetailsAction,
  getPipelineAnalyticsAction
} from '@/features/applications/actions/applications';

import {
  createInterviewSessionAction,
  listInterviewSessionsAction,
  getInterviewSessionDetailsAction,
  submitAnswerAction,
  deleteInterviewSessionAction,
  getInterviewMetricsAction
} from '@/features/interviews/actions/interviews';

import { supabase } from '@/lib/supabase';

// Types
type TabType = 'dashboard' | 'resume' | 'matcher' | 'cover-letter' | 'interview' | 'tracker';

interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  salary?: string;
  location?: string;
  status: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  notes?: string;
  appliedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function WorkspacePage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mounted, setMounted] = useState(false);

  // Resume State
  const [resumeText, setResumeText] = useState('');
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);

  // Matcher State
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [matcherResult, setMatcherResult] = useState<any>(null);
  const [isComparingJob, setIsComparingJob] = useState(false);

  // Cover Letter State
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);

  // Interview Prep States (Database-backed - Sprint 7)
  const [prepSessions, setPrepSessions] = useState<any[]>([]);
  const [activePrepSessionId, setActivePrepSessionId] = useState<string | null>(null);
  const [activeSessionDetails, setActiveSessionDetails] = useState<any>(null);
  const [prepMetrics, setPrepMetrics] = useState<any>(null);
  const [isPrepLoading, setIsPrepLoading] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isGradingAnswer, setIsGradingAnswer] = useState(false);
  const [newPrepForm, setNewPrepForm] = useState({
    applicationId: '',
    companyName: '',
    jobTitle: '',
    interviewType: 'mixed' as any,
    scheduledDate: ''
  });
  const [currentPrepQIndex, setCurrentPrepQIndex] = useState(0);
  const [prepAnswerInput, setPrepAnswerInput] = useState('');

  // Tracker State (Database-backed)
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppDetails, setSelectedAppDetails] = useState<any>(null);
  const [pipelineAnalytics, setPipelineAnalytics] = useState<any>(null);
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    companyName: '',
    jobTitle: '',
    salary: '',
    location: '',
    status: 'wishlist' as any,
    notes: '',
    jobId: null as string | null
  });
  const [newInterviewDate, setNewInterviewDate] = useState('');
  const [stageNotes, setStageNotes] = useState('');

  // Chat/Coach State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatView, setChatView] = useState<'chat' | 'history'>('chat');
  const [showArchived, setShowArchived] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Job Intelligence State
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [isMatchingJob, setIsMatchingJob] = useState(false);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    companyName: '',
    jobTitle: '',
    description: '',
    location: '',
    employmentType: '',
    salary: ''
  });

  // Initialize and load resume and analysis from local storage
  useEffect(() => {
    setMounted(true);
    const storedResume = localStorage.getItem('career_os_resume');
    const storedAnalysis = localStorage.getItem('career_os_analysis');

    if (storedResume) setResumeText(storedResume);
    if (storedAnalysis) setAtsAnalysis(JSON.parse(storedAnalysis));
  }, []);

  // Load applications and metrics dynamically from Supabase
  const loadApplicationsList = async () => {
    setIsAppsLoading(true);
    try {
      const res = await listApplicationsAction();
      if (res.success && res.applications) {
        setApplications(res.applications);
        
        // Auto-select first application if none selected
        if (res.applications.length > 0 && !selectedAppId) {
          setSelectedAppId(res.applications[0].id);
        }
      }
      
      const analyticRes = await getPipelineAnalyticsAction();
      if (analyticRes.success && analyticRes.analytics) {
        setPipelineAnalytics(analyticRes.analytics);
      }
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setIsAppsLoading(false);
    }
  };

  // Load detailed application metrics (history, health, match score)
  useEffect(() => {
    if (!selectedAppId) {
      setSelectedAppDetails(null);
      return;
    }
    const loadAppDetails = async () => {
      try {
        const res = await getApplicationDetailsAction(selectedAppId);
        if (res.success) {
          setSelectedAppDetails(res);
        }
      } catch (e) {
        console.error('Error fetching application details:', e);
      }
    };
    loadAppDetails();
  }, [selectedAppId]);

  // Load conversations once user is authenticated
  useEffect(() => {
    if (!mounted || !user) return;
    
    const loadConversations = async () => {
      try {
        const res = await listConversationsAction(showArchived ? 'archived' : 'active');
        if (res.success && res.conversations) {
          setConversations(res.conversations);
          // Auto-select latest active conversation if none active
          if (res.conversations.length > 0 && !activeConversationId && !showArchived) {
            const latest = res.conversations[0];
            setActiveConversationId(latest.id);
          }
        }
      } catch (e) {
        console.error('Error loading conversations:', e);
      }
    };
    
    loadConversations();
  }, [user, mounted, showArchived]);

  // Load messages once active conversation ID changes
  useEffect(() => {
    if (!activeConversationId) {
      // Setup a welcome message if no active chat session exists
      setChatMessages([
        {
          id: 'init',
          role: 'assistant',
          content: `Hi! I'm your CareerOS AI coach. I can help you analyze your resume, optimize it for job descriptions, write cover letters, and run mock interviews. 

To get started, head over to the **Resume Workspace** and paste your resume text!`,
          created_at: new Date().toISOString()
        }
      ]);
      return;
    }
    const loadMessages = async () => {
      try {
        const msgRes = await getConversationMessagesAction(activeConversationId);
        if (msgRes.success && msgRes.messages) {
          setChatMessages(msgRes.messages);
        }
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
    };
    loadMessages();
  }, [activeConversationId]);

  // Load saved jobs list
  const loadJobsList = async () => {
    try {
      const res = await listJobsAction();
      if (res.success && res.jobs) {
        setJobs(res.jobs);
        // Auto-select first job if none selected
        if (res.jobs.length > 0 && !selectedJobId) {
          setSelectedJobId(res.jobs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load jobs list:', e);
    }
  };

  // Load Interview Prep sessions and metrics
  const loadPrepDashboard = async () => {
    setIsPrepLoading(true);
    try {
      const sessionRes = await listInterviewSessionsAction();
      if (sessionRes.success && sessionRes.sessions) {
        setPrepSessions(sessionRes.sessions);
        
        // Auto-select first session if none selected
        if (sessionRes.sessions.length > 0 && !activePrepSessionId) {
          setActivePrepSessionId(sessionRes.sessions[0].id);
        }
      }
      
      const metricsRes = await getInterviewMetricsAction();
      if (metricsRes.success && metricsRes.metrics) {
        setPrepMetrics(metricsRes.metrics);
      }
    } catch (e) {
      console.error('Failed to load prep dashboard:', e);
    } finally {
      setIsPrepLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && user) {
      loadJobsList();
      loadApplicationsList();
      loadPrepDashboard();
    }
  }, [user, mounted]);

  // Load detailed active session questions and status
  useEffect(() => {
    if (!activePrepSessionId) {
      setActiveSessionDetails(null);
      return;
    }
    const loadSessionDetails = async () => {
      setIsPrepLoading(true);
      try {
        const res = await getInterviewSessionDetailsAction(activePrepSessionId);
        if (res.success) {
          setActiveSessionDetails(res);
          // Auto-set first unanswered question or default to 0
          if (res.questions && res.questions.length > 0) {
            const unansweredIdx = res.questions.findIndex((q: any) => q.candidate_response === null);
            setCurrentPrepQIndex(unansweredIdx !== -1 ? unansweredIdx : 0);
          } else {
            setCurrentPrepQIndex(0);
          }
          setPrepAnswerInput('');
        }
      } catch (e) {
        console.error('Error fetching session details:', e);
      } finally {
        setIsPrepLoading(false);
      }
    };
    loadSessionDetails();
  }, [activePrepSessionId]);

  // Load detailed job metrics
  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJobDetails(null);
      return;
    }
    const loadJobDetails = async () => {
      setIsJobsLoading(true);
      try {
        const res = await getJobDetailsAction(selectedJobId);
        if (res.success) {
          setSelectedJobDetails(res);
        }
      } catch (e) {
        console.error('Error fetching job details:', e);
      } finally {
        setIsJobsLoading(false);
      }
    };
    loadJobDetails();
  }, [selectedJobId]);

  // Save state helpers
  const saveResume = (text: string) => {
    setResumeText(text);
    localStorage.setItem('career_os_resume', text);
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle Coach Tab Context changes
  useEffect(() => {
    if (!mounted) return;
    let contextPrompt = '';
    switch (activeTab) {
      case 'dashboard':
        contextPrompt = "I'm viewing the Dashboard. Give me a quick summary of what I should focus on next based on my workspace progress.";
        break;
      case 'resume':
        contextPrompt = "I'm in the Resume Workspace. Ready to help you evaluate and improve your skills, experience, and format.";
        break;
      case 'matcher':
        contextPrompt = "I'm in the Job Description Matcher. Provide a Job Title and Description, and I will scan your resume to find exact alignment gaps.";
        break;
      case 'cover-letter':
        contextPrompt = "I'm in the Cover Letter Generator. Once you match a job, I can craft an elegant cover letter tailored to your background.";
        break;
      case 'interview':
        contextPrompt = "I'm in the Mock Interview simulator. Let's practice. I'll ask you interview questions, evaluate your responses, and give tips.";
        break;
      case 'tracker':
        contextPrompt = "I'm reviewing the Kanban Application Tracker. Organize your search and update statuses of your active leads.";
        break;
    }

    setChatMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        role: 'assistant',
        content: `**Context Switched to ${activeTab.toUpperCase()}**\n\n${contextPrompt}`,
        timestamp: new Date()
      }
    ]);
  }, [activeTab]);

  // Operations
  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) return;
    setIsAnalyzingResume(true);
    try {
      const result = await analyzeResumeAction(resumeText);
      setAtsAnalysis(result);
      localStorage.setItem('career_os_analysis', JSON.stringify(result));
      
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content: `I've analyzed your resume! It scored **${result.atsScore}/100** on the ATS scan. Check out the suggestions under formatting and impact in the analyzer panel. What would you like to work on first?`,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleCompareJob = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setIsComparingJob(true);
    try {
      const result = await compareResumeWithJobAction(resumeText, jobTitle, jobDescription);
      setMatcherResult(result);
      
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content: `Comparison complete! Your matching score for the **${jobTitle || 'Role'}** position is **${result.atsScore}/100**. You are missing key skills like: *${result.missingSkills.slice(0, 3).join(', ')}*. Let's refine your bullet points!`,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsComparingJob(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setIsGeneratingCoverLetter(true);
    try {
      const result = await generateCoverLetterAction(resumeText, companyName, jobTitle, jobDescription);
      setCoverLetterResult(result.coverLetter);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleCreatePrepSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrepForm.companyName || !newPrepForm.jobTitle) return;
    setIsStartingSession(true);
    try {
      const res = await createInterviewSessionAction({
        company_name: newPrepForm.companyName,
        job_title: newPrepForm.jobTitle,
        interview_type: newPrepForm.interviewType,
        scheduled_date: newPrepForm.scheduledDate || new Date().toISOString(),
        application_id: newPrepForm.applicationId || null,
        job_id: null
      });

      if (res.success && res.sessionId) {
        setNewPrepForm({
          applicationId: '',
          companyName: '',
          jobTitle: '',
          interviewType: 'mixed',
          scheduledDate: ''
        });
        await loadPrepDashboard();
        setActivePrepSessionId(res.sessionId);
      } else {
        alert(res.error || 'Failed to start interview preparation session.');
      }
    } catch (err) {
      console.error('Failed to create prep session:', err);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleSubmitPrepAnswer = async () => {
    if (!activePrepSessionId || !activeSessionDetails?.questions || !prepAnswerInput.trim()) return;
    setIsGradingAnswer(true);
    const currentQ = activeSessionDetails.questions[currentPrepQIndex];
    try {
      const res = await submitAnswerAction(activePrepSessionId, currentQ.id, prepAnswerInput);
      if (res.success) {
        setPrepAnswerInput('');
        // Reload details to update UI state
        const details = await getInterviewSessionDetailsAction(activePrepSessionId);
        if (details.success) {
          setActiveSessionDetails(details);
          // Progress index if not completed and there are remaining questions
          if (!res.completed) {
            const nextUnanswered = details.questions ? details.questions.findIndex((q: any) => q.candidate_response === null) : -1;
            if (nextUnanswered !== undefined && nextUnanswered !== -1) {
              setCurrentPrepQIndex(nextUnanswered);
            }
          }
        }
        // If final answer completed, refresh dashboard stats
        if (res.completed) {
          await loadPrepDashboard();
        }
      } else {
        alert(res.error || 'Failed to submit answer.');
      }
    } catch (err) {
      console.error('Submit answer error:', err);
    } finally {
      setIsGradingAnswer(false);
    }
  };

  const handleDeletePrepSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prep session? This cannot be undone.')) return;
    try {
      const res = await deleteInterviewSessionAction(sessionId);
      if (res.success) {
        if (activePrepSessionId === sessionId) {
          setActivePrepSessionId(null);
          setActiveSessionDetails(null);
        }
        await loadPrepDashboard();
      } else {
        alert(res.error || 'Failed to delete prep session.');
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  // Tracker Database Operations (Sprint 6)
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.companyName || !newApp.jobTitle) return;
    setIsSavingApp(true);
    try {
      const res = await createApplicationAction({
        company_name: newApp.companyName,
        job_title: newApp.jobTitle,
        salary: newApp.salary || null,
        location: newApp.location || null,
        status: newApp.status,
        notes: newApp.notes || null,
        job_id: newApp.jobId || null,
        applied_at: null,
        offer_date: null,
        outcome_date: null
      });

      if (res.success && res.application) {
        setNewApp({
          companyName: '',
          jobTitle: '',
          salary: '',
          location: '',
          status: 'wishlist',
          notes: '',
          jobId: null
        });
        setIsAddAppOpen(false);
        await loadApplicationsList();
        setSelectedAppId(res.application.id);
      } else {
        alert(res.error || 'Failed to save application lead.');
      }
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleUpdateAppStage = async (newStage: any) => {
    if (!selectedAppId) return;
    try {
      const res = await updateApplicationStageAction(selectedAppId, newStage, stageNotes || undefined);
      if (res.success) {
        setStageNotes('');
        await loadApplicationsList();
        const details = await getApplicationDetailsAction(selectedAppId);
        if (details.success) {
          setSelectedAppDetails(details);
        }
      } else {
        alert(res.error || 'Failed to transition stage.');
      }
    } catch (err) {
      console.error('Stage transition error:', err);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application lead? This cannot be undone.')) return;
    try {
      const res = await deleteApplicationAction(id);
      if (res.success) {
        if (selectedAppId === id) {
          setSelectedAppId(null);
          setSelectedAppDetails(null);
        }
        await loadApplicationsList();
      } else {
        alert(res.error || 'Failed to delete application.');
      }
    } catch (err) {
      console.error('Delete application error:', err);
    }
  };

  const handleAddInterviewDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !selectedAppDetails?.application || !newInterviewDate) return;
    const currentDates = selectedAppDetails.application.interview_dates || [];
    const updatedDates = [...currentDates, newInterviewDate];

    try {
      const res = await updateApplicationAction(selectedAppId, {
        interview_dates: updatedDates
      });
      if (res.success) {
        setNewInterviewDate('');
        const details = await getApplicationDetailsAction(selectedAppId);
        if (details.success) {
          setSelectedAppDetails(details);
        }
        await loadApplicationsList();
      } else {
        alert(res.error || 'Failed to add interview milestone.');
      }
    } catch (err) {
      console.error('Add interview error:', err);
    }
  };

  const handleRemoveInterviewDate = async (index: number) => {
    if (!selectedAppId || !selectedAppDetails?.application) return;
    const currentDates = selectedAppDetails.application.interview_dates || [];
    const updatedDates = currentDates.filter((_: any, i: number) => i !== index);

    try {
      const res = await updateApplicationAction(selectedAppId, {
        interview_dates: updatedDates
      });
      if (res.success) {
        const details = await getApplicationDetailsAction(selectedAppId);
        if (details.success) {
          setSelectedAppDetails(details);
        }
        await loadApplicationsList();
      } else {
        alert(res.error || 'Failed to remove interview milestone.');
      }
    } catch (err) {
      console.error('Remove interview error:', err);
    }
  };

  const handleConvertJobToApplication = async () => {
    if (!selectedJobDetails?.job) return;
    const job = selectedJobDetails.job;
    try {
      const res = await createApplicationAction({
        company_name: job.company_name,
        job_title: job.job_title,
        salary: job.salary || null,
        location: job.location || null,
        status: 'applied',
        notes: 'Converted from Saved Job description.',
        job_id: job.id,
        applied_at: null,
        offer_date: null,
        outcome_date: null
      });

      if (res.success && res.application) {
        await loadApplicationsList();
        setSelectedAppId(res.application.id);
        setActiveTab('tracker');
        alert(`Successfully converted ${job.company_name} - ${job.job_title} to an active Application!`);
      } else {
        alert(res.error || 'Failed to convert job to application lead.');
      }
    } catch (err) {
      console.error('Convert job error:', err);
    }
  };

  // Chat Coach Operations
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    let convId = activeConversationId;
    setIsChatLoading(true);

    try {
      // 1. Create a conversation if none is active
      if (!convId) {
        const res = await createConversationAction('New Conversation');
        if (res.success && res.conversation) {
          convId = res.conversation.id;
          setActiveConversationId(convId);
          setConversations(prev => [res.conversation, ...prev]);
        } else {
          throw new Error(res.error || 'Failed to initialize conversation');
        }
      }

      // Optimistically append user message to UI
      const userMsg = {
        id: Math.random().toString(),
        role: 'user' as const,
        content: chatInput,
        created_at: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');

      // Add placeholder assistant message
      const assistantMsgId = Math.random().toString();
      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant' as const,
        content: '',
        created_at: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      // Send to server
      const workspaceCtx = {
        activeTab,
        companyName: selectedJobDetails?.job?.company_name || companyName,
        jobTitle: selectedJobDetails?.job?.job_title || jobTitle,
        atsScore: atsAnalysis?.atsScore,
        jobId: selectedJobId || undefined
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: convId,
          content: userMsg.content,
          workspaceCtx
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body stream not available.');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const cleaned = line.trim();
          if (!cleaned) continue;
          if (cleaned === 'data: [DONE]') break;
          if (cleaned.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleaned.slice(6));
              const text = data.text || '';
              fullContent += text;
              setChatMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
                )
              );
            } catch (e) {
              // Ignore partial chunk JSON parse errors
            }
          }
        }
      }

      // Refresh conversations list to update title and updated_at
      const listRes = await listConversationsAction(showArchived ? 'archived' : 'active');
      if (listRes.success && listRes.conversations) {
        setConversations(listRes.conversations);
      }
    } catch (err: any) {
      console.error(err);
      // Fail gracefully
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant' as const,
          content: `Sorry, I encountered an error: ${err.message || 'Please check your connection and try again.'}`,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const res = await createConversationAction('New Conversation');
      if (res.success && res.conversation) {
        setActiveConversationId(res.conversation.id);
        setChatMessages([
          {
            id: 'init',
            role: 'assistant',
            content: `Hi! I'm your CareerOS AI coach. I can help you analyze your resume, optimize it for job descriptions, write cover letters, and run mock interviews. 

To get started, head over to the **Resume Workspace** and paste your resume text!`,
            created_at: new Date().toISOString()
          }
        ]);
        setConversations(prev => [res.conversation, ...prev]);
        setChatView('chat');
      }
    } catch (e) {
      console.error('Failed to create new conversation:', e);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation? This action is permanent.')) return;
    try {
      const res = await deleteConversationAction(convId);
      if (res.success) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (activeConversationId === convId) {
          setActiveConversationId(null);
          setChatMessages([]);
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const handleArchiveConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await archiveConversationAction(convId);
      if (res.success) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (activeConversationId === convId) {
          setActiveConversationId(null);
          setChatMessages([]);
        }
      }
    } catch (e) {
      console.error('Failed to archive conversation:', e);
    }
  };

  // Job Intelligence Operations (Sprint 5)
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobForm.companyName || !newJobForm.jobTitle || !newJobForm.description) return;
    setIsSavingJob(true);
    try {
      const res = await createJobAction(
        newJobForm.companyName,
        newJobForm.jobTitle,
        newJobForm.description,
        newJobForm.location,
        newJobForm.employmentType,
        newJobForm.salary
      );
      if (res.success && res.jobId) {
        setIsAddJobModalOpen(false);
        setNewJobForm({
          companyName: '',
          jobTitle: '',
          description: '',
          location: '',
          employmentType: '',
          salary: ''
        });
        await loadJobsList();
        setSelectedJobId(res.jobId);
      } else {
        alert(res.error || 'Failed to create job description.');
      }
    } catch (error) {
      console.error('Failed to save and parse job:', error);
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleRunJobMatch = async () => {
    if (!selectedJobId) return;
    setIsMatchingJob(true);
    try {
      // Get user's latest resume
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeError || !resume) {
        alert('Please upload a resume in the Resume Workspace tab first before running a match scan!');
        return;
      }

      const res = await runJobMatchAction(selectedJobId, resume.id);
      if (res.success) {
        // Reload details
        const details = await getJobDetailsAction(selectedJobId);
        if (details.success) {
          setSelectedJobDetails(details);
        }
        await loadJobsList();
      } else {
        alert(res.error || 'Failed to match job.');
      }
    } catch (e) {
      console.error('Failed to match job:', e);
    } finally {
      setIsMatchingJob(false);
    }
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this job description?')) return;
    try {
      const res = await deleteJobAction(jobId);
      if (res.success) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJobId === jobId) {
          setSelectedJobId(null);
          setSelectedJobDetails(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await archiveJobAction(jobId);
      if (res.success) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJobId === jobId) {
          setSelectedJobId(null);
          setSelectedJobDetails(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white select-none">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="font-medium">Loading CareerOS Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans">
      
      {/* LEFT NAVIGATION PANEL (Linear-inspired Simplicity) */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0">
        {/* Brand Logo */}
        <div className="h-14 flex items-center px-6 border-b border-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight text-lg">CareerOS</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-zinc-900 text-white border-l-2 border-blue-500 pl-2' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Workspace Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('resume')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === 'resume' 
                ? 'bg-zinc-900 text-white border-l-2 border-blue-500 pl-2' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            Resume Workspace
          </button>

          <button
            onClick={() => setActiveTab('matcher')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === 'matcher' 
                ? 'bg-zinc-900 text-white border-l-2 border-blue-500 pl-2' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <Briefcase className="h-4 w-4 shrink-0" />
            Job Matcher & ATS
          </button>

          <button
            onClick={() => setActiveTab('cover-letter')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === 'cover-letter' 
                ? 'bg-zinc-900 text-white border-l-2 border-blue-500 pl-2' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <FileSignature className="h-4 w-4 shrink-0" />
            Cover Letter Generator
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === 'interview' 
                ? 'bg-zinc-900 text-white border-l-2 border-blue-500 pl-2' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <MessageSquareCode className="h-4 w-4 shrink-0" />
            Interview Practice
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === 'tracker' 
                ? 'bg-zinc-900 text-white border-l-2 border-blue-500 pl-2' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <KanbanSquare className="h-4 w-4 shrink-0" />
            Job Application Tracker
          </button>
        </nav>

        {/* Footer Account Profile info */}
        <div className="p-4 border-t border-zinc-900 flex flex-col gap-3 shrink-0 bg-zinc-950/80 select-none">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-900/40 border border-blue-800 flex items-center justify-center text-xs font-bold text-blue-300">
              {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Active User'}</p>
              <p className="text-[9px] text-zinc-400 truncate">{profile?.target_role || 'Career Candidate'}</p>
              <p className="text-[9px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={async () => {
              await signOut();
              router.push('/login');
              router.refresh();
            }}
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 hover:bg-zinc-900 text-red-400 hover:text-red-300 justify-center flex items-center border border-zinc-900 hover:border-red-950/30"
          >
            Log Out
          </Button>
        </div>
      </aside>

      {/* CENTER CANVAS (Cursor-inspired Workspace) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto border-r border-zinc-900 bg-zinc-950">
        
        {/* Workspace Toolbar Header */}
        <header className="h-14 border-b border-zinc-900/60 flex items-center justify-between px-8 shrink-0 bg-zinc-950/50 sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Canvas Workspace</span>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="text-zinc-100 text-sm font-semibold capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-3">
            {resumeText && (
              <Badge variant="outline" className="border-emerald-800 bg-emerald-950/20 text-emerald-400 flex items-center gap-1.5 py-1">
                <CheckCircle className="h-3 w-3" /> Resume Loaded
              </Badge>
            )}
            {atsAnalysis && (
              <Badge variant="outline" className="border-blue-800 bg-blue-950/20 text-blue-400 py-1">
                ATS Score: {atsAnalysis.atsScore}
              </Badge>
            )}
          </div>
        </header>

        {/* Canvas Body Contents */}
        <div className="flex-1 p-8 max-w-5xl w-full mx-auto">
          
          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <DashboardWorkspace
              atsAnalysis={atsAnalysis}
              applications={applications}
              prepMetrics={prepMetrics}
              resumeText={resumeText}
              setActiveTab={setActiveTab}
              handleAnalyzeResume={handleAnalyzeResume}
              matcherResult={matcherResult}
            />
          )}

          {/* 2. RESUME WORKSPACE */}
          {activeTab === 'resume' && (
            <ResumeWorkspace
              resumeText={resumeText}
              saveResume={saveResume}
              handleAnalyzeResume={handleAnalyzeResume}
              isAnalyzingResume={isAnalyzingResume}
              atsAnalysis={atsAnalysis}
            />
          )}

          {/* 3. JOB MATCHER & ATS OPTIMIZER */}
          {activeTab === 'matcher' && (
            <MatcherWorkspace
              jobs={jobs}
              selectedJobId={selectedJobId}
              setSelectedJobId={setSelectedJobId}
              isJobsLoading={isJobsLoading}
              selectedJobDetails={selectedJobDetails}
              isMatchingJob={isMatchingJob}
              handleRunJobMatch={handleRunJobMatch}
              handleConvertJobToApplication={handleConvertJobToApplication}
              handleArchiveJob={handleArchiveJob}
              handleDeleteJob={handleDeleteJob}
              setIsAddJobModalOpen={setIsAddJobModalOpen}
            />
          )}

          {/* 4. COVER LETTER GENERATOR */}
          {activeTab === 'cover-letter' && (
            <CoverLetterWorkspace
              companyName={companyName}
              setCompanyName={setCompanyName}
              jobTitle={jobTitle}
              setJobTitle={setJobTitle}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              resumeText={resumeText}
              coverLetterResult={coverLetterResult}
              isGeneratingCoverLetter={isGeneratingCoverLetter}
              handleGenerateCoverLetter={handleGenerateCoverLetter}
            />
          )}

          {/* 5. INTERVIEW PRACTICE SIMULATOR */}
          {activeTab === 'interview' && (
            <InterviewWorkspace
              prepMetrics={prepMetrics}
              newPrepForm={newPrepForm}
              setNewPrepForm={setNewPrepForm}
              applications={applications}
              handleCreatePrepSession={handleCreatePrepSession}
              isStartingSession={isStartingSession}
              isPrepLoading={isPrepLoading}
              prepSessions={prepSessions}
              activePrepSessionId={activePrepSessionId}
              setActivePrepSessionId={setActivePrepSessionId}
              handleDeletePrepSession={handleDeletePrepSession}
              activeSessionDetails={activeSessionDetails}
              currentPrepQIndex={currentPrepQIndex}
              setCurrentPrepQIndex={setCurrentPrepQIndex}
              prepAnswerInput={prepAnswerInput}
              setPrepAnswerInput={setPrepAnswerInput}
              handleSubmitPrepAnswer={handleSubmitPrepAnswer}
              isGradingAnswer={isGradingAnswer}
            />
          )}

          {/* 6. JOB APPLICATION TRACKER */}
          {activeTab === 'tracker' && (
            <TrackerWorkspace
              pipelineAnalytics={pipelineAnalytics}
              appSearchQuery={appSearchQuery}
              setAppSearchQuery={setAppSearchQuery}
              isAppsLoading={isAppsLoading}
              applications={applications}
              selectedAppId={selectedAppId}
              setSelectedAppId={setSelectedAppId}
              selectedAppDetails={selectedAppDetails}
              handleDeleteApp={handleDeleteApp}
              handleUpdateAppStage={handleUpdateAppStage}
              stageNotes={stageNotes}
              setStageNotes={setStageNotes}
              newInterviewDate={newInterviewDate}
              setNewInterviewDate={setNewInterviewDate}
              handleAddInterviewDate={handleAddInterviewDate}
              handleRemoveInterviewDate={handleRemoveInterviewDate}
              setSelectedJobId={setSelectedJobId}
              setActiveTab={setActiveTab}
              setIsAddAppOpen={setIsAddAppOpen}
            />
          )}
        </div>
      </main>
      {/* RIGHT PANEL (Claude-inspired AI Chat Coach) */}
      <aside className="w-80 border-l border-zinc-900 bg-zinc-950 flex flex-col shrink-0">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-900/60 justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChatView('chat')}
              className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                chatView === 'chat' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setChatView('history')}
              className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                chatView === 'history' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              History
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewChat}
              className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Start New Conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {chatView === 'chat' ? (
          <>
            {/* Messages list */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[calc(100vh-120px)]">
              {chatMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col space-y-1 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest px-1">
                    {msg.role === 'user' ? 'You' : 'Coach'}
                  </span>
                  <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap select-text ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-850 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs px-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input box */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-zinc-900 bg-zinc-950 shrink-0 flex items-center gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask the coach for adjustments..."
                className="flex-1 h-8 text-xs bg-zinc-900/50 border-zinc-800"
              />
              <Button type="submit" size="sm" variant="glow" className="h-8 w-8 px-0 flex items-center justify-center shrink-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
            {/* Show Archived filter checkbox */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950/20 shrink-0 select-none">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Conversations</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => {
                    setShowArchived(e.target.checked);
                    setActiveConversationId(null);
                  }}
                  className="rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-0 w-3 h-3 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-400 hover:text-zinc-200">Show Archived</span>
              </label>
            </div>

            {/* Conversations list */}
            <div className="flex-1 p-2 overflow-y-auto space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setChatView('chat');
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                    activeConversationId === conv.id
                      ? 'bg-zinc-900/80 border border-zinc-800/80 text-white font-medium'
                      : 'hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3 shrink-0 text-blue-500/80" />
                      {conv.title}
                    </p>
                    <span className="text-[9px] text-zinc-500 block mt-1 pl-4">
                      Updated: {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {conv.status === 'active' && (
                      <button
                        onClick={(e) => handleArchiveConversation(conv.id, e)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer"
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="p-1 rounded hover:bg-zinc-800 text-red-500 hover:text-red-405 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-12 text-zinc-650 text-xs italic">
                  No {showArchived ? 'archived' : 'active'} conversations.
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* DIALOG: Add Job Application Modal */}
      <Dialog 
        isOpen={isAddAppOpen} 
        onClose={() => setIsAddAppOpen(false)} 
        title="Add Job Application Lead"
      >
        <form onSubmit={handleAddApplication} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Company *</label>
              <Input
                required
                placeholder="e.g. Linear"
                value={newApp.companyName}
                onChange={(e) => setNewApp(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Job Title *</label>
              <Input
                required
                placeholder="e.g. Backend Engineer"
                value={newApp.jobTitle}
                onChange={(prev => (e: any) => setNewApp(prev => ({ ...prev, jobTitle: e.target.value })))(newApp)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Salary Estimate</label>
              <Input
                placeholder="e.g. $140k"
                value={newApp.salary}
                onChange={(e) => setNewApp(prev => ({ ...prev, salary: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Location</label>
              <Input
                placeholder="e.g. San Francisco, CA"
                value={newApp.location}
                onChange={(e) => setNewApp(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-zinc-400">Status Stage</label>
            <select
              value={newApp.status}
              onChange={(e) => setNewApp(prev => ({ ...prev, status: e.target.value as any }))}
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="wishlist">Wishlist</option>
              <option value="applied">Applied</option>
              <option value="screening">Recruiter Screening</option>
              <option value="interviewing">General Interviewing</option>
              <option value="technical">Technical Round</option>
              <option value="final_round">Final Round</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-zinc-400 font-medium">Notes</label>
            <Textarea
              placeholder="Contacts, interview stages, or general notes..."
              value={newApp.notes}
              onChange={(e) => setNewApp(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddAppOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Application
            </Button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG: Add Saved Job Description Modal (Sprint 5) */}
      <Dialog 
        isOpen={isAddJobModalOpen} 
        onClose={() => setIsAddJobModalOpen(false)} 
        title="Save New Job Description"
      >
        <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 font-sans">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Company Name *</label>
              <Input
                required
                placeholder="e.g. Vercel"
                value={newJobForm.companyName}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Job Title *</label>
              <Input
                required
                placeholder="e.g. Frontend Engineer"
                value={newJobForm.jobTitle}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, jobTitle: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-sans">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Location</label>
              <Input
                placeholder="e.g. Remote, US"
                value={newJobForm.location}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Employment Type</label>
              <Input
                placeholder="e.g. Full-time"
                value={newJobForm.employmentType}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, employmentType: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400">Salary</label>
              <Input
                placeholder="e.g. $140k - $160k"
                value={newJobForm.salary}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, salary: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1 font-sans">
            <label className="text-[10px] uppercase font-semibold text-zinc-400">Job Description *</label>
            <Textarea
              required
              placeholder="Paste the detailed requirements, responsibilities, and qualifications..."
              value={newJobForm.description}
              onChange={(e) => setNewJobForm(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[160px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddJobModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSavingJob}>
              Save & Analyze Job
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}
