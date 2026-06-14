'use client';

import React from 'react';
import { RefreshCw, Trash2, MessageSquareCode, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface InterviewWorkspaceProps {
  prepMetrics: any;
  newPrepForm: {
    applicationId: string;
    companyName: string;
    jobTitle: string;
    interviewType: 'mixed' | 'behavioral' | 'technical' | 'screening' | 'system_design';
    scheduledDate: string;
  };
  setNewPrepForm: React.Dispatch<React.SetStateAction<{
    applicationId: string;
    companyName: string;
    jobTitle: string;
    interviewType: 'mixed' | 'behavioral' | 'technical' | 'screening' | 'system_design';
    scheduledDate: string;
  }>>;
  applications: any[];
  handleCreatePrepSession: (e: React.FormEvent) => void;
  isStartingSession: boolean;
  isPrepLoading: boolean;
  prepSessions: any[];
  activePrepSessionId: string | null;
  setActivePrepSessionId: (id: string | null) => void;
  handleDeletePrepSession: (id: string, e: React.MouseEvent) => void;
  activeSessionDetails: any;
  currentPrepQIndex: number;
  setCurrentPrepQIndex: React.Dispatch<React.SetStateAction<number>>;
  prepAnswerInput: string;
  setPrepAnswerInput: (val: string) => void;
  handleSubmitPrepAnswer: () => void;
  isGradingAnswer: boolean;
}

export default function InterviewWorkspace({
  prepMetrics,
  newPrepForm,
  setNewPrepForm,
  applications,
  handleCreatePrepSession,
  isStartingSession,
  isPrepLoading,
  prepSessions,
  activePrepSessionId,
  setActivePrepSessionId,
  handleDeletePrepSession,
  activeSessionDetails,
  currentPrepQIndex,
  setCurrentPrepQIndex,
  prepAnswerInput,
  setPrepAnswerInput,
  handleSubmitPrepAnswer,
  isGradingAnswer,
}: InterviewWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white">Interview Practice Simulator</h2>
        <p className="text-xs text-zinc-400">Run persistent, database-backed mock interviews and review study plans.</p>
      </div>

      {/* Prep Metrics Grid */}
      {prepMetrics && prepMetrics.completedCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-sans">
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Overall Avg</span>
            <span className="text-sm font-bold text-blue-400 mt-1">{prepMetrics.averageOverallScore}/100</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Communication</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">{prepMetrics.averageCommunicationScore}/100</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Technical</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">{prepMetrics.averageTechnicalScore}/100</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Confidence</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">{prepMetrics.averageConfidenceScore}/100</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Problem Solving</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">{prepMetrics.averageProblemSolvingScore}/100</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Behavioral</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">{prepMetrics.averageBehavioralScore}/100</span>
          </Card>
        </div>
      )}

      {/* Split-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Pane: Sessions Queue & Creation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create Session Form */}
          <Card className="glass-panel p-4">
            <CardHeader className="p-0 pb-3 border-b border-zinc-900 mb-3">
              <CardTitle className="text-xs font-bold uppercase text-zinc-400">Schedule Practice Session</CardTitle>
            </CardHeader>
            <form onSubmit={handleCreatePrepSession} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-semibold text-zinc-500">Link Application (Optional)</label>
                <select
                  value={newPrepForm.applicationId}
                  onChange={(e) => {
                    const appId = e.target.value;
                    const app = applications.find(a => a.id === appId);
                    setNewPrepForm(prev => ({
                      ...prev,
                      applicationId: appId,
                      companyName: app ? app.company_name : prev.companyName,
                      jobTitle: app ? app.job_title : prev.jobTitle
                    }));
                  }}
                  className="flex h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                >
                  <option value="">-- Select Lead --</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.company_name} - {app.job_title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-semibold text-zinc-500">Company *</label>
                  <Input
                    required
                    placeholder="e.g. Stripe"
                    value={newPrepForm.companyName}
                    onChange={(e) => setNewPrepForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="h-8 text-xs bg-zinc-900/50 border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-semibold text-zinc-500">Role Title *</label>
                  <Input
                    required
                    placeholder="e.g. Backend Engineer"
                    value={newPrepForm.jobTitle}
                    onChange={(e) => setNewPrepForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                    className="h-8 text-xs bg-zinc-900/50 border-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-semibold text-zinc-500">Focus Type</label>
                  <select
                    value={newPrepForm.interviewType}
                    onChange={(e) => setNewPrepForm(prev => ({ ...prev, interviewType: e.target.value as any }))}
                    className="flex h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-100 focus:outline-none"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="technical">Technical</option>
                    <option value="screening">Screening</option>
                    <option value="system_design">System Design</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-semibold text-zinc-500">Date/Time</label>
                  <Input
                    type="datetime-local"
                    value={newPrepForm.scheduledDate}
                    onChange={(e) => setNewPrepForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="h-8 text-xs bg-zinc-900/50 border-zinc-800"
                  />
                </div>
              </div>

              <Button type="submit" size="sm" isLoading={isStartingSession} className="w-full h-8 mt-2 text-xs">
                Generate Tailored Interview Plan
              </Button>
            </form>
          </Card>

          {/* Sessions List Queue */}
          <Card className="glass-panel flex flex-col h-[380px]">
            <CardHeader className="p-3 border-b border-zinc-900 shrink-0">
              <CardTitle className="text-xs font-bold uppercase text-zinc-400">Preparation Log</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-y-auto space-y-1.5 pr-1.5">
              {isPrepLoading && prepSessions.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-zinc-500 gap-2 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Loading Prep Log...</span>
                </div>
              ) : (
                prepSessions.map((session) => {
                  const isSelected = activePrepSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setActivePrepSessionId(session.id)}
                      className={`p-3 border rounded-md cursor-pointer transition-all duration-200 text-left flex justify-between items-center ${
                        isSelected
                          ? 'bg-zinc-900/60 border-zinc-700 text-white font-medium shadow-md'
                          : 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:bg-zinc-900/20 hover:border-zinc-850 hover:text-zinc-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs font-bold truncate text-zinc-200">{session.company_name}</h4>
                        <p className="text-[10px] text-zinc-450 truncate mt-0.5">{session.job_title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[8px] uppercase py-0 px-1 select-none">
                            {session.interview_type}
                          </Badge>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(session.scheduled_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {session.status === 'completed' ? (
                          <Badge variant="blue" className="text-[9px] font-bold px-1.5 py-0.2">
                            {session.overall_score}%
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider py-0 px-1 border-amber-800 text-amber-500 bg-amber-950/10">
                            {session.status.replace('_', ' ')}
                          </Badge>
                        )}
                        <button
                          onClick={(e) => handleDeletePrepSession(session.id, e)}
                          className="p-1 rounded hover:bg-zinc-850 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete prep log"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              {!isPrepLoading && prepSessions.length === 0 && (
                <div className="text-center py-24 text-zinc-500 text-xs italic">
                  No interview sessions generated yet. Schedule your first practice round above!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane: Simulator Canvas or Evaluation Outcome */}
        <div className="lg:col-span-3 space-y-4">
          {activePrepSessionId ? (
            isPrepLoading && !activeSessionDetails ? (
              <Card className="glass-panel min-h-[500px] flex items-center justify-center">
                <div className="flex items-center gap-2 text-zinc-405 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Generating / Loading Prep Plan...</span>
                </div>
              </Card>
            ) : activeSessionDetails ? (
              activeSessionDetails.session.status !== 'completed' ? (
                /* SIMULATOR SCREEN */
                <Card className="glass-panel min-h-[500px] flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-zinc-900 flex items-center justify-between flex-row shrink-0">
                    <div>
                      <CardTitle className="text-sm font-semibold text-white">
                        {activeSessionDetails.session.company_name} Prep Simulator
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        {activeSessionDetails.session.job_title}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px] select-none">
                      {activeSessionDetails.questions[currentPrepQIndex]?.category.replace('_', ' ')}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="pt-5 flex-1 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs text-zinc-500">
                        <span className="font-semibold uppercase tracking-wider">
                          Question {currentPrepQIndex + 1} of {activeSessionDetails.questions.length}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white leading-relaxed bg-zinc-900/30 border border-zinc-900 p-4 rounded text-left">
                        "{activeSessionDetails.questions[currentPrepQIndex]?.question_text}"
                      </p>
                      
                      {activeSessionDetails.questions[currentPrepQIndex]?.candidate_response === null ? (
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-zinc-500 block text-left">Your Answer</label>
                          <Textarea
                            value={prepAnswerInput}
                            onChange={(e) => setPrepAnswerInput(e.target.value)}
                            placeholder="Type your response structure clearly (STAR method recommended)..."
                            className="min-h-[160px] text-xs font-sans bg-zinc-900/40 border-zinc-800"
                          />
                        </div>
                      ) : (
                        <div className="space-y-4 text-left">
                          <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Submitted Response</span>
                            <p className="text-xs text-zinc-350 mt-1 whitespace-pre-wrap">{activeSessionDetails.questions[currentPrepQIndex]?.candidate_response}</p>
                          </div>
                          <div className="space-y-2 border-l-2 border-blue-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase text-blue-400">Coach Grader Evaluation</span>
                              <Badge variant="blue" className="text-[10px] font-bold">
                                Score: {activeSessionDetails.questions[currentPrepQIndex]?.score} / 10
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {activeSessionDetails.questions[currentPrepQIndex]?.feedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-6 border-t border-zinc-900/60 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPrepQIndex === 0}
                        onClick={() => {
                          setCurrentPrepQIndex(prev => prev - 1);
                          setPrepAnswerInput('');
                        }}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {activeSessionDetails.questions[currentPrepQIndex]?.candidate_response === null && (
                          <Button
                            onClick={handleSubmitPrepAnswer}
                            disabled={!prepAnswerInput.trim()}
                            isLoading={isGradingAnswer}
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                          >
                            Submit Answer
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={currentPrepQIndex === activeSessionDetails.questions.length - 1}
                          onClick={() => {
                            setCurrentPrepQIndex(prev => prev + 1);
                            setPrepAnswerInput('');
                          }}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* COMPLETED PREP REPORT & ROADMAP SCREEN */
                <Card className="glass-panel min-h-[500px] flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-zinc-900 flex justify-between items-start flex-row shrink-0">
                    <div>
                      <CardTitle className="text-sm font-semibold text-white">
                        {activeSessionDetails.session.company_name} Prep Performance
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400 mt-0.5">
                        {activeSessionDetails.session.job_title} &middot; Completed
                      </CardDescription>
                    </div>
                    <Badge variant="blue" className="text-xs font-bold px-2 py-0.5">
                      Overall Score: {activeSessionDetails.session.overall_score}%
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[440px] space-y-6 text-left font-sans">
                    {/* Performance Radar Metrics Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/20 border border-zinc-900 p-4 rounded-md">
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-bold text-zinc-500">Evaluation Dimensions</h4>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Communication STAR Clarity</span>
                            <span>{activeSessionDetails.session.communication_score}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${activeSessionDetails.session.communication_score || 0}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Technical Stack depth</span>
                            <span>{activeSessionDetails.session.technical_score}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${activeSessionDetails.session.technical_score || 0}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Confidence & Certainty</span>
                            <span>{activeSessionDetails.session.confidence_score}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${activeSessionDetails.session.confidence_score || 0}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="h-4" /> {/* spacer */}
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Problem Solving system-thinking</span>
                            <span>{activeSessionDetails.session.problem_solving_score}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${activeSessionDetails.session.problem_solving_score || 0}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Behavioral Ownership</span>
                            <span>{activeSessionDetails.session.behavioral_score}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${activeSessionDetails.session.behavioral_score || 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coach Feedback Summary */}
                    {activeSessionDetails.session.feedback_summary && (
                      <div className="p-3.5 bg-zinc-900/20 border border-zinc-900 rounded-md">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Coach Assessor Review</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{activeSessionDetails.session.feedback_summary}</p>
                      </div>
                    )}

                    {/* Improvement Roadmap list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <span className="text-[10px] uppercase font-bold text-red-400 block">Identified Weaknesses</span>
                        <div className="space-y-1.5">
                          {activeSessionDetails.session.weaknesses?.map((w: string, idx: number) => (
                            <p key={idx} className="text-xs text-zinc-300 leading-normal pl-2 border-l border-red-900/60">
                              {w}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Roadmap Focus Areas</span>
                        <div className="space-y-1.5">
                          {activeSessionDetails.session.study_areas?.map((sa: string, idx: number) => (
                            <p key={idx} className="text-xs text-zinc-300 leading-normal pl-2 border-l border-zinc-800">
                              {sa}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Next Steps Exercises */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
                      <div className="space-y-2.5">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Practice Exercises</span>
                        <div className="space-y-1.5">
                          {activeSessionDetails.session.practice_exercises?.map((pe: string, idx: number) => (
                            <p key={idx} className="text-xs text-zinc-400 leading-normal flex items-start gap-1 font-sans">
                              <span className="text-blue-500">&#9658;</span> {pe}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Immediate Next Actions</span>
                        <div className="space-y-1.5">
                          {activeSessionDetails.session.next_steps?.map((ns: string, idx: number) => (
                            <p key={idx} className="text-xs text-zinc-200 leading-normal flex items-start gap-1 font-medium">
                              <span className="text-emerald-500">&#10003;</span> {ns}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Question review list */}
                    <div className="pt-4 border-t border-zinc-900">
                      <h4 className="text-xs font-bold text-zinc-300 mb-3 uppercase tracking-wider">Question Review Log</h4>
                      <div className="space-y-4">
                        {activeSessionDetails.questions?.map((q: any, idx: number) => (
                          <div key={q.id} className="p-3 bg-zinc-900/10 border border-zinc-900 rounded space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold text-zinc-400">
                                Q{idx + 1}. {q.category.replace('_', ' ')}
                              </span>
                              <Badge variant="outline" className="text-[9px] font-bold py-0.2 border-blue-900 text-blue-400 bg-blue-950/10">
                                Score: {q.score}/10
                              </Badge>
                            </div>
                            <p className="text-xs text-white italic font-medium">"{q.question_text}"</p>
                            <div className="text-[11px] text-zinc-400 pl-2 border-l border-zinc-800">
                              <span className="font-semibold text-zinc-500 block text-[9px] uppercase">Your Answer</span>
                              <p className="mt-0.5">{q.candidate_response}</p>
                            </div>
                            <div className="text-[11px] text-zinc-300 pl-2 border-l border-blue-900">
                              <span className="font-semibold text-blue-400 block text-[9px] uppercase">Coach Grader Feedback</span>
                              <p className="mt-0.5 leading-relaxed">{q.feedback}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="glass-panel min-h-[500px] flex items-center justify-center">
                <span className="text-xs text-zinc-500">Failed to load session details.</span>
              </Card>
            )
          ) : (
            <Card className="glass-panel min-h-[500px] flex flex-col items-center justify-center text-center p-8 space-y-3 font-sans">
              <MessageSquareCode className="h-10 w-10 text-zinc-650 border border-zinc-800 p-2 rounded bg-zinc-950" />
              <div>
                <h3 className="text-sm font-semibold text-white">No Prep Session Selected</h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Select a preparation session from the left queue to enter the Q&A simulator or review your performance roadmap metrics.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
