'use client';

import React from 'react';
import { Sparkles, Award, KanbanSquare, MessageSquareCode, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardWorkspaceProps {
  atsAnalysis: any;
  applications: any[];
  prepMetrics: any;
  resumeText: string;
  setActiveTab: (tab: any) => void;
  handleAnalyzeResume: () => void;
  matcherResult: any;
}

export default function DashboardWorkspace({
  atsAnalysis,
  applications,
  prepMetrics,
  resumeText,
  setActiveTab,
  handleAnalyzeResume,
  matcherResult,
}: DashboardWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Welcome to CareerOS <Sparkles className="h-5 w-5 text-blue-500" />
        </h1>
        <p className="text-sm text-zinc-400">
          Your mission control for job search preparation. Manage, refine, and rehearse all in one window.
        </p>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-panel" hoverable>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-400">ATS Resume Score</CardTitle>
              <Award className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{atsAnalysis ? atsAnalysis.atsScore : 'N/A'}</span>
              <span className="text-xs text-zinc-500">/ 100</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {atsAnalysis ? 'Based on last resume analysis.' : 'Upload your resume to calculate score.'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel" hoverable>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-400">Active Applications</CardTitle>
              <KanbanSquare className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {applications.filter(a => a.status === 'applied' || a.status === 'interviewing').length}
              </span>
              <span className="text-xs text-zinc-500">active</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Total leads tracked: {applications.length}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel" hoverable>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-400">Interview Prep Status</CardTitle>
              <MessageSquareCode className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {prepMetrics ? `${prepMetrics.completedCount}` : '0'}
              </span>
              <span className="text-xs text-zinc-500">completed</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {prepMetrics && prepMetrics.upcomingCount > 0 ? `${prepMetrics.upcomingCount} session(s) scheduled.` : 'No upcoming sessions.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="glass-panel border-zinc-800/40">
          <CardHeader>
            <CardTitle className="text-base">Quick Start Checklist</CardTitle>
            <CardDescription>Steps to maximize your job search profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/30 border border-zinc-900">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${resumeText ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {resumeText ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-zinc-200">Paste/Upload Resume</p>
                <p className="text-[10px] text-zinc-500">Load your experiences to configure AI analysis.</p>
              </div>
              {!resumeText && (
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('resume')} className="text-blue-400 hover:text-blue-300">Go</Button>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/30 border border-zinc-900">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${atsAnalysis ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {atsAnalysis ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-zinc-200">Run ATS Score Scan</p>
                <p className="text-[10px] text-zinc-500">Identify formatting and metric-based impact gaps.</p>
              </div>
              {!atsAnalysis && resumeText && (
                <Button size="sm" variant="ghost" onClick={() => { setActiveTab('resume'); handleAnalyzeResume(); }} className="text-blue-400 hover:text-blue-300">Run</Button>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/30 border border-zinc-900">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${matcherResult ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {matcherResult ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-zinc-200">Match Against Job Description</p>
                <p className="text-[10px] text-zinc-500">Compare skills gap for targeted optimization.</p>
              </div>
              {!matcherResult && (
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('matcher')} className="text-blue-400 hover:text-blue-300">Go</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Applications list summary */}
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Leads</CardTitle>
              <CardDescription>Track status in Kanban board</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('tracker')} className="text-xs">
              View Board
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[220px] overflow-y-auto">
            {applications.map(app => (
              <div key={app.id} className="flex items-center justify-between p-2 rounded bg-zinc-900/20 border border-zinc-900/50 hover:border-zinc-800 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-zinc-100">{app.company_name}</p>
                  <p className="text-[10px] text-zinc-400">{app.job_title}</p>
                </div>
                <Badge 
                  variant={
                    app.status === 'offered' ? 'success' : 
                    app.status === 'interviewing' ? 'blue' : 
                    app.status === 'applied' ? 'default' : 'secondary'
                  } 
                  className="capitalize text-[10px]"
                >
                  {app.status}
                </Badge>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="text-center py-6 text-xs text-zinc-500">
                No active jobs tracked.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
