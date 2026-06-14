'use client';

import React from 'react';
import { Plus, RefreshCw, Trash2, ChevronRight, History, LayoutDashboard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TrackerWorkspaceProps {
  pipelineAnalytics: any;
  appSearchQuery: string;
  setAppSearchQuery: (val: string) => void;
  isAppsLoading: boolean;
  applications: any[];
  selectedAppId: string | null;
  setSelectedAppId: (id: string | null) => void;
  selectedAppDetails: any;
  handleDeleteApp: (id: string) => void;
  handleUpdateAppStage: (stage: string) => void;
  stageNotes: string;
  setStageNotes: (val: string) => void;
  newInterviewDate: string;
  setNewInterviewDate: (val: string) => void;
  handleAddInterviewDate: (e: React.FormEvent) => void;
  handleRemoveInterviewDate: (idx: number) => void;
  setSelectedJobId: (id: string | null) => void;
  setActiveTab: (tab: any) => void;
  setIsAddAppOpen: (open: boolean) => void;
}

export default function TrackerWorkspace({
  pipelineAnalytics,
  appSearchQuery,
  setAppSearchQuery,
  isAppsLoading,
  applications,
  selectedAppId,
  setSelectedAppId,
  selectedAppDetails,
  handleDeleteApp,
  handleUpdateAppStage,
  stageNotes,
  setStageNotes,
  newInterviewDate,
  setNewInterviewDate,
  handleAddInterviewDate,
  handleRemoveInterviewDate,
  setSelectedJobId,
  setActiveTab,
  setIsAddAppOpen,
}: TrackerWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-white">Career Pipeline Dashboard</h2>
          <p className="text-xs text-zinc-400">Track and optimize your entire application journey from discovery to offer.</p>
        </div>
        <Button 
          onClick={() => setIsAddAppOpen(true)}
          className="flex items-center gap-1.5 text-xs py-1.5"
        >
          <Plus className="h-4 w-4" /> Add Application Lead
        </Button>
      </div>

      {/* Pipeline Analytics Stats Grid */}
      {pipelineAnalytics ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-sans">
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Submitted</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">{pipelineAnalytics.submittedCount}</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Interviews</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">{pipelineAnalytics.interviewsCount}</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Offers</span>
            <span className="text-sm font-bold text-emerald-400 mt-1">{pipelineAnalytics.offersCount}</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Interview Rate</span>
            <span className="text-sm font-bold text-blue-400 mt-1">{pipelineAnalytics.interviewRate}%</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Offer Rate</span>
            <span className="text-sm font-bold text-emerald-500 mt-1">{pipelineAnalytics.offerRate}%</span>
          </Card>
          <Card className="glass-panel p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Rejection Rate</span>
            <span className="text-sm font-bold text-red-400 mt-1">{pipelineAnalytics.rejectionRate}%</span>
          </Card>
        </div>
      ) : (
        <div className="h-12 bg-zinc-950/20 border border-zinc-900 rounded-md flex items-center justify-center text-xs text-zinc-500 animate-pulse font-sans">
          Loading Pipeline Analytics...
        </div>
      )}

      {/* Split-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Pane: Searchable Applications Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-panel flex flex-col h-[550px]">
            <div className="p-3 border-b border-zinc-900 flex flex-col gap-2">
              <Input
                placeholder="Search applications..."
                value={appSearchQuery}
                onChange={e => setAppSearchQuery(e.target.value)}
                className="h-8 text-xs bg-zinc-900/50 border-zinc-800"
              />
            </div>
            <CardContent className="p-2 flex-1 overflow-y-auto space-y-1.5 max-h-[480px]">
              {isAppsLoading ? (
                <div className="flex items-center justify-center py-20 text-zinc-500 gap-2 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Loading Pipeline Queue...</span>
                </div>
              ) : (
                applications
                  .filter(app => {
                    const q = appSearchQuery.toLowerCase();
                    return app.company_name.toLowerCase().includes(q) || app.job_title.toLowerCase().includes(q);
                  })
                  .map(app => {
                    const isSelected = selectedAppId === app.id;
                    const appliedDate = app.applied_at ? new Date(app.applied_at) : new Date(app.created_at);
                    const daysSinceApplied = Math.floor((new Date().getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppId(app.id)}
                        className={`p-3 border rounded-md cursor-pointer transition-all duration-200 text-left ${
                          isSelected
                            ? 'bg-zinc-900/60 border-zinc-700 text-white font-medium shadow-md'
                            : 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:bg-zinc-900/20 hover:border-zinc-850 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold truncate text-zinc-200">{app.company_name}</h4>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{app.job_title}</p>
                          </div>
                          <Badge variant="outline" className="text-[8px] uppercase tracking-wider py-0 px-1 hover:bg-transparent">
                            {app.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-3 border-t border-zinc-900/60 pt-2 shrink-0">
                          <span>Activity: {new Date(app.updated_at).toLocaleDateString()}</span>
                          {app.status !== 'wishlist' && (
                            <span>Applied: {daysSinceApplied}d ago</span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
              {!isAppsLoading && applications.length === 0 && (
                <div className="text-center py-24 text-zinc-500 text-xs italic">
                  No active applications found. Click "+ Add Application" to track your first lead!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane: Detailed Application Workspace */}
        <div className="lg:col-span-3 space-y-4">
          {selectedAppId && selectedAppDetails ? (
            <Card className="glass-panel min-h-[550px] flex flex-col">
              {/* Detailed View Header */}
              <CardHeader className="pb-3 border-b border-zinc-900 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">
                      {selectedAppDetails.application.company_name}
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400 mt-0.5">
                      {selectedAppDetails.application.job_title} &middot; {selectedAppDetails.application.location || 'Location N/A'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteApp(selectedAppDetails.application.id)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-950/20 p-1 px-2 text-[10px]"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>

                {/* Stage transition controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-900/60 mt-1">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Move Pipeline Stage</span>
                    <select
                      value={selectedAppDetails.application.status}
                      onChange={e => handleUpdateAppStage(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
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
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Transition Log Note</span>
                    <Input
                      placeholder="e.g. Cleared technical coding test"
                      value={stageNotes}
                      onChange={e => setStageNotes(e.target.value)}
                      className="h-8 text-xs bg-zinc-900/50 border-zinc-800"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[420px] space-y-5">
                {/* Visual Progress Bar */}
                <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 p-3 rounded-md">
                  <span className="text-[9px] uppercase font-semibold text-zinc-500 block font-sans">Pipeline Progress</span>
                  <div className="flex items-center gap-1">
                    {['wishlist', 'applied', 'screening', 'interviewing', 'technical', 'final_round', 'offered', 'accepted'].map((stage, i, arr) => {
                      const stages = ['wishlist', 'applied', 'screening', 'interviewing', 'technical', 'final_round', 'offered', 'accepted', 'rejected', 'withdrawn'];
                      const currentIdx = stages.indexOf(selectedAppDetails.application.status);
                      const targetIdx = stages.indexOf(stage);
                      
                      let isDone = currentIdx >= targetIdx;
                      if (currentIdx === 8 && targetIdx >= 1) isDone = false; // rejected
                      if (currentIdx === 9 && targetIdx >= 1) isDone = false; // withdrawn
                      
                      let isTerminal = false;
                      if (i === arr.length - 1 && ['rejected', 'withdrawn'].includes(selectedAppDetails.application.status)) {
                        isTerminal = true;
                      }

                      return (
                        <React.Fragment key={stage}>
                          <div 
                            className={`flex-1 h-1.5 rounded-full ${
                              isTerminal ? 'bg-red-500' :
                              isDone ? 'bg-blue-500' : 'bg-zinc-800'
                            }`}
                            title={stage}
                          />
                          {i < arr.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-zinc-700 shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[8px] uppercase tracking-wider text-zinc-500 px-0.5">
                    <span>Wishlist</span>
                    <span>Interviewing</span>
                    <span>Outcome</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start font-sans">
                  {/* Follow-Up Intelligence & Health Card */}
                  <div className="space-y-4">
                    <Card className="bg-zinc-900/20 border border-zinc-900/80 p-3 space-y-3 font-sans">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-zinc-500">Coach Health Scan</span>
                        <Badge 
                          variant={
                            selectedAppDetails.followUp.health === 'needs_action' ? 'destructive' :
                            selectedAppDetails.followUp.health === 'stale' ? 'warning' : 'success'
                          } 
                          className="text-[8px] uppercase font-semibold py-0.2 px-1.5"
                        >
                          {selectedAppDetails.followUp.health.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs text-left">
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-bold text-zinc-500 block">Immediate Next Action</span>
                          {selectedAppDetails.followUp.nextActions?.map((action: string, idx: number) => (
                            <p key={idx} className="text-[10px] text-zinc-200 leading-normal flex items-start gap-1 font-medium">
                              <span className="text-blue-500 mt-0.5">&#9658;</span> {action}
                            </p>
                          ))}
                        </div>
                        <div className="space-y-1 pt-1.5 border-t border-zinc-900/60 mt-1.5">
                          <span className="text-[8px] uppercase font-bold text-zinc-500 block">Coach Recommendations</span>
                          {selectedAppDetails.followUp.suggestions?.map((sug: string, idx: number) => (
                            <p key={idx} className="text-[10px] text-zinc-400 leading-normal pl-1 border-l border-zinc-800">
                              {sug}
                            </p>
                          ))}
                        </div>
                      </div>
                    </Card>

                    {/* Job Description Matching (If linked) */}
                    {selectedAppDetails.application.job_id && (
                      <Card className="bg-zinc-900/20 border border-zinc-900/80 p-3 space-y-2">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 font-sans">
                          <span className="text-[9px] uppercase font-bold text-zinc-500">ATS Match Analytics</span>
                          {selectedAppDetails.matchScore !== null ? (
                            <Badge variant="blue" className="text-[9px] font-bold py-0.2">
                              {selectedAppDetails.matchScore}% Match Fit
                            </Badge>
                          ) : (
                            <span className="text-[8px] text-zinc-650">Pending Evaluation</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                          <span>Job Intelligence Linked</span>
                          <button
                            onClick={() => {
                              setSelectedJobId(selectedAppDetails.application.job_id);
                              setActiveTab('matcher');
                            }}
                            className="text-[9px] text-blue-500 hover:text-blue-400 underline cursor-pointer"
                          >
                            View Match Report &rarr;
                          </button>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Milestones & Timeline Dates Card */}
                  <Card className="bg-zinc-900/20 border border-zinc-900/80 p-3 space-y-4 text-left font-sans">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Timeline Milestones</span>
                    
                    <div className="space-y-2 text-[10px] text-zinc-400">
                      <p className="flex justify-between"><span className="text-zinc-500">Created:</span> {new Date(selectedAppDetails.application.created_at).toLocaleDateString()}</p>
                      <p className="flex justify-between"><span className="text-zinc-500">Applied:</span> {selectedAppDetails.application.applied_at ? new Date(selectedAppDetails.application.applied_at).toLocaleDateString() : 'Pending'}</p>
                      {selectedAppDetails.application.offer_date && (
                        <p className="flex justify-between text-emerald-400 font-medium"><span className="text-zinc-500">Offer Received:</span> {new Date(selectedAppDetails.application.offer_date).toLocaleDateString()}</p>
                      )}
                      {selectedAppDetails.application.outcome_date && (
                        <p className="flex justify-between text-zinc-200"><span className="text-zinc-500">Outcome Logged:</span> {new Date(selectedAppDetails.application.outcome_date).toLocaleDateString()}</p>
                      )}
                    </div>

                    {/* Scheduled Interview Dates */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900/60 mt-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Interview Schedule</span>
                      
                      <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-0.5">
                        {selectedAppDetails.application.interview_dates?.map((dateStr: string, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-1.5 bg-zinc-900/40 border border-zinc-900 rounded text-[10px]">
                            <span className="text-zinc-300">{new Date(dateStr).toLocaleString()}</span>
                            <button
                              onClick={() => handleRemoveInterviewDate(idx)}
                              className="text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Remove milestone"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {(!selectedAppDetails.application.interview_dates || selectedAppDetails.application.interview_dates.length === 0) && (
                          <span className="text-[10px] text-zinc-650 italic block py-1">No interviews scheduled yet.</span>
                        )}
                      </div>

                      <form onSubmit={handleAddInterviewDate} className="flex gap-1.5 pt-2">
                        <Input
                          type="datetime-local"
                          value={newInterviewDate}
                          onChange={e => setNewInterviewDate(e.target.value)}
                          required
                          className="h-7 text-[10px] bg-zinc-950 border-zinc-800 py-0.5 flex-1"
                        />
                        <Button type="submit" size="sm" className="h-7 text-[9px] px-2.5">
                          Add
                        </Button>
                      </form>
                    </div>
                  </Card>
                </div>

                {/* History Transition Logs */}
                <div className="pt-4 border-t border-zinc-900 font-sans">
                  <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5 text-left">
                    <History className="h-3.5 w-3.5 text-zinc-400" /> Pipeline History Logs
                  </h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-0.5">
                    {selectedAppDetails.history?.map((log: any) => (
                      <div key={log.id} className="p-2 rounded bg-zinc-900/20 border border-zinc-900 text-left text-[10px] leading-relaxed">
                        <div className="flex justify-between text-zinc-500 text-[9px] mb-1">
                          <span>{new Date(log.changed_at).toLocaleString()}</span>
                          <span className="font-semibold uppercase text-zinc-400 font-sans">
                            {log.from_stage ? `${log.from_stage} -> ${log.to_stage}` : `Initialized Stage: ${log.to_stage}`}
                          </span>
                        </div>
                        <p className="text-zinc-300">{log.notes || 'Stage update logged.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-panel min-h-[550px] flex flex-col items-center justify-center text-center p-8 space-y-3 font-sans">
              <LayoutDashboard className="h-10 w-10 text-zinc-650 border border-zinc-800 p-2 rounded bg-zinc-950" />
              <div>
                <h3 className="text-sm font-semibold text-white">No Application Selected</h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Select an active application lead from the left pipeline queue to review recommendations, timelines, and transition histories.
                </p>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
