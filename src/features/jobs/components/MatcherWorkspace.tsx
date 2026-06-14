'use client';

import React from 'react';
import { Plus, Briefcase, Archive, Trash2, RefreshCw, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MatcherWorkspaceProps {
  jobs: any[];
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  isJobsLoading: boolean;
  selectedJobDetails: any;
  isMatchingJob: boolean;
  handleRunJobMatch: () => void;
  handleConvertJobToApplication: () => void;
  handleArchiveJob: (id: string, e: React.MouseEvent) => void;
  handleDeleteJob: (id: string, e: React.MouseEvent) => void;
  setIsAddJobModalOpen: (open: boolean) => void;
}

export default function MatcherWorkspace({
  jobs,
  selectedJobId,
  setSelectedJobId,
  isJobsLoading,
  selectedJobDetails,
  isMatchingJob,
  handleRunJobMatch,
  handleConvertJobToApplication,
  handleArchiveJob,
  handleDeleteJob,
  setIsAddJobModalOpen,
}: MatcherWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-white">Job Intelligence Hub</h2>
          <p className="text-xs text-zinc-400">Save jobs, parse requirements, map skills, and evaluate fit against your resume.</p>
        </div>
        <Button 
          onClick={() => setIsAddJobModalOpen(true)}
          className="flex items-center gap-1.5 text-xs py-1.5"
        >
          <Plus className="h-4 w-4" /> Save New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left side: Job list column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-3 border-b border-zinc-900">
              <CardTitle className="text-sm">Active Job Openings</CardTitle>
              <CardDescription>Select a target position to review alignment details</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-3 rounded-md cursor-pointer transition-all duration-200 border text-left flex justify-between items-start gap-2 ${
                    selectedJobId === job.id
                      ? 'bg-zinc-900/80 border-blue-900 text-white'
                      : 'bg-zinc-900/20 border-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate text-zinc-100">{job.job_title}</h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{job.company_name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[9px] capitalize py-0">
                        {job.status}
                      </Badge>
                      {job.location && (
                        <span className="text-[9px] text-zinc-500 truncate max-w-[80px]">
                          {job.location}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between h-full gap-2 shrink-0">
                    <span className="text-[9px] text-zinc-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleArchiveJob(job.id, e)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Archive"
                      >
                        <Archive className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteJob(job.id, e)}
                        className="p-1 rounded hover:bg-zinc-800 text-red-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-12 text-zinc-500 text-xs italic">
                  No saved job descriptions. Click "+ Save New Job" to add one!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right side: Detailed intelligence canvas */}
        <div className="lg:col-span-3 space-y-4">
          {selectedJobId ? (
            isJobsLoading ? (
              <Card className="glass-panel min-h-[450px] flex items-center justify-center">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Loading Job Intelligence...</span>
                </div>
              </Card>
            ) : selectedJobDetails ? (
              <Card className="glass-panel min-h-[450px] flex flex-col">
                <CardHeader className="pb-3 border-b border-zinc-900 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-semibold text-white">
                        {selectedJobDetails.job.job_title}
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400 mt-0.5">
                        {selectedJobDetails.job.company_name} &middot; {selectedJobDetails.job.location || 'Location Not Specified'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 font-sans">
                      <Badge variant="outline" className="capitalize text-xs font-semibold px-2 py-0.5">
                        {selectedJobDetails.job.status}
                      </Badge>
                      {selectedJobDetails.match && (
                        <Badge variant="blue" className="text-xs font-bold px-2 py-0.5">
                          Match Fit: {selectedJobDetails.match.match_score}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Toolbar actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 mt-1 shrink-0 gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleRunJobMatch}
                        isLoading={isMatchingJob}
                        className="text-xs flex items-center gap-1 py-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Run Match Diagnostics
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConvertJobToApplication}
                        className="text-xs flex items-center gap-1 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                      >
                        <Plus className="h-3 w-3" />
                        Track Application
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/60 px-2 py-0.5 rounded flex items-center gap-1 font-semibold select-none">
                        <CheckCircle className="h-2.5 w-2.5" /> AI context active
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[500px] space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* Left Column: Job parameters */}
                    <div className="space-y-5">
                      {/* Job Details metadata */}
                      <div className="space-y-2 text-xs">
                        <h4 className="font-semibold text-zinc-300 border-b border-zinc-900 pb-1">Position Telemetry</h4>
                        <div className="space-y-1 text-zinc-400">
                          <p><span className="text-zinc-500">Employment Type:</span> {selectedJobDetails.job.employment_type || 'N/A'}</p>
                          <p><span className="text-zinc-500">Salary Range:</span> {selectedJobDetails.job.salary || 'N/A'}</p>
                          <p><span className="text-zinc-500">Experience required:</span> {selectedJobDetails.job.experience_requirements || 'N/A'}</p>
                          <p><span className="text-zinc-500">Education required:</span> {selectedJobDetails.job.education_requirements || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Skills Extracted */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-zinc-300 border-b border-zinc-900 pb-1 font-sans">Required Skills</h4>
                        <div className="space-y-3 pt-1">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Required Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedJobDetails.skills?.filter((s: any) => !s.is_preferred).map((s: any, i: number) => (
                                <Badge key={i} variant="success" className="text-[9px] px-1.5 py-0.2">
                                  {s.skills.name}
                                </Badge>
                              ))}
                              {selectedJobDetails.skills?.filter((s: any) => !s.is_preferred).length === 0 && (
                                <span className="text-[10px] text-zinc-600 italic">None identified.</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Preferred Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedJobDetails.skills?.filter((s: any) => s.is_preferred).map((s: any, i: number) => (
                                <Badge key={i} variant="blue" className="text-[9px] px-1.5 py-0.2">
                                  {s.skills.name}
                                </Badge>
                              ))}
                              {selectedJobDetails.skills?.filter((s: any) => s.is_preferred).length === 0 && (
                                <span className="text-[10px] text-zinc-600 italic">None identified.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Responsibilities */}
                      {selectedJobDetails.job.responsibilities && selectedJobDetails.job.responsibilities.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-zinc-300 border-b border-zinc-900 pb-1">Core Responsibilities</h4>
                          <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 pl-1">
                            {selectedJobDetails.job.responsibilities.map((r: string, i: number) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Right Column: ATS Match diagnostics */}
                    <div className="space-y-5">
                      <h4 className="font-semibold text-zinc-300 border-b border-zinc-900 pb-1 text-xs">Resume Fit Report</h4>
                      {selectedJobDetails.match ? (
                        <div className="space-y-4">
                          {/* Overall progress score */}
                          <div>
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-zinc-400">Match score against Resume</span>
                              <span className="font-bold text-zinc-200">{selectedJobDetails.match.match_score}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  selectedJobDetails.match.match_score >= 80 ? 'bg-emerald-500' :
                                  selectedJobDetails.match.match_score >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                }`} 
                                style={{ width: `${selectedJobDetails.match.match_score}%` }}
                              />
                            </div>
                          </div>

                          {/* Alignments pills */}
                          <div className="space-y-2 text-xs">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-semibold text-emerald-400 block font-sans">Matching Skills</span>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {selectedJobDetails.match.matching_skills?.map((skill: string, i: number) => (
                                  <Badge key={i} variant="success" className="text-[9px] px-1.5 py-0.2">
                                    {skill}
                                  </Badge>
                                ))}
                                {(!selectedJobDetails.match.matching_skills || selectedJobDetails.match.matching_skills.length === 0) && (
                                  <span className="text-[10px] text-zinc-600 italic">None matched.</span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-semibold text-amber-400 block font-sans">Missing Skills</span>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {selectedJobDetails.match.missing_skills?.map((skill: string, i: number) => (
                                  <Badge key={i} variant="warning" className="text-[9px] px-1.5 py-0.2">
                                    {skill}
                                  </Badge>
                                ))}
                                {(!selectedJobDetails.match.missing_skills || selectedJobDetails.match.missing_skills.length === 0) && (
                                  <span className="text-[10px] text-zinc-600 italic">None.</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Gap Assessment */}
                          {selectedJobDetails.match.gap_analysis && (
                            <div className="p-3 rounded bg-zinc-900/40 border border-zinc-900/60 text-xs text-zinc-300">
                              <span className="font-semibold text-white block mb-0.5">Gap Assessment:</span>
                              {selectedJobDetails.match.gap_analysis}
                            </div>
                          )}

                          {/* Specific Skill gaps checklist table */}
                          {selectedJobDetails.gaps && selectedJobDetails.gaps.length > 0 && (
                            <div className="space-y-2 mt-2">
                              <span className="text-[9px] uppercase font-semibold text-zinc-500 block font-sans font-medium">Actionable gap recommendations</span>
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-0.5">
                                {selectedJobDetails.gaps.map((g: any, i: number) => (
                                  <div key={i} className="p-2 rounded bg-zinc-900/20 border border-zinc-900 flex flex-col gap-1 text-left">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-zinc-200">{g.skills?.name}</span>
                                      <Badge 
                                        variant={g.gap_severity === 'high' ? 'destructive' : g.gap_severity === 'medium' ? 'warning' : 'secondary'} 
                                        className="text-[8px] py-0 px-1 font-sans"
                                      >
                                        {g.gap_severity} priority
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-zinc-400">{g.recommendation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="text-center py-16 text-zinc-650 text-xs flex flex-col items-center justify-center gap-3">
                          <HelpCircle className="h-8 w-8 text-zinc-700" />
                          <div className="max-w-[200px]">
                            <p className="font-medium text-zinc-400">Not Matched Yet</p>
                            <p className="text-[10px] text-zinc-500 mt-1">
                              Click "Run Match Diagnostics" to evaluate alignment fit against your active resume.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Raw description snippet at bottom */}
                  <div className="pt-4 border-t border-zinc-900">
                    <h4 className="text-xs font-semibold text-zinc-300 mb-2">Saved Raw Job Description</h4>
                    <div className="p-3 rounded bg-zinc-900/30 border border-zinc-900 text-[10px] text-zinc-400 font-mono whitespace-pre-wrap max-h-[180px] overflow-y-auto text-left select-text">
                      {selectedJobDetails.job.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-panel min-h-[450px] flex items-center justify-center">
                <span className="text-xs text-zinc-500">Failed to load details.</span>
              </Card>
            )
          ) : (
            <Card className="glass-panel min-h-[450px] flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Briefcase className="h-10 w-10 text-zinc-600 border border-zinc-800 p-2 rounded bg-zinc-950" />
              <div>
                <h3 className="text-sm font-semibold text-white">No Target Job Selected</h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Select a target saved job description from the left list to review detailed ATS match diagnostics, required skills, and recommendations.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsAddJobModalOpen(true)} className="text-xs">
                Save A Job description
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
