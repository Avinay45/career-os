'use client';

import React from 'react';
import { Sparkles, CheckCircle, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResumeWorkspaceProps {
  resumeText: string;
  saveResume: (text: string) => void;
  handleAnalyzeResume: () => void;
  isAnalyzingResume: boolean;
  atsAnalysis: any;
}

export default function ResumeWorkspace({
  resumeText,
  saveResume,
  handleAnalyzeResume,
  isAnalyzingResume,
  atsAnalysis,
}: ResumeWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white">Resume Workspace</h2>
        <p className="text-xs text-zinc-400">Paste your raw resume text to analyze and rewrite using Hermes 3 AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor Left */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-3 border-b border-zinc-900 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Raw Resume Editor</CardTitle>
              {resumeText && (
                <span className="text-[10px] text-zinc-500">
                  {resumeText.length} characters
                </span>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                value={resumeText}
                onChange={(e) => saveResume(e.target.value)}
                placeholder="Paste your existing resume content here (Markdown or Plain Text format)..."
                className="min-h-[400px] font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </CardContent>
            <CardFooter className="flex items-center justify-between bg-zinc-950/40 p-4 border-t border-zinc-900 rounded-b-lg">
              <span className="text-xs text-zinc-500">Changes are automatically saved locally.</span>
              <Button
                onClick={handleAnalyzeResume}
                disabled={!resumeText.trim()}
                isLoading={isAnalyzingResume}
                className="flex items-center gap-1 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Analyze Resume
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Analysis Right */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-panel min-h-[400px] flex flex-col">
            <CardHeader className="border-b border-zinc-900 pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>ATS Analysis Results</span>
                {atsAnalysis && (
                  <Badge variant="blue" className="text-xs">
                    ATS Score: {atsAnalysis.atsScore}/100
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[420px]">
              {atsAnalysis ? (
                <div className="space-y-5">
                  {/* Score Meter */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-zinc-400">Overall Score</span>
                      <span className="font-semibold text-zinc-100">{atsAnalysis.atsScore}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          atsAnalysis.atsScore >= 80 ? 'bg-emerald-500' :
                          atsAnalysis.atsScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                        }`} 
                        style={{ width: `${atsAnalysis.atsScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Extracted Skills */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-500" /> Extracted Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {atsAnalysis.skills?.map((skill: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0.5">
                          {skill}
                        </Badge>
                      ))}
                      {(!atsAnalysis.skills || atsAnalysis.skills.length === 0) && (
                        <p className="text-xs text-zinc-500 italic">No skills extracted.</p>
                      )}
                    </div>
                  </div>

                  {/* Formatting Suggestions */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Formatting Fixes
                    </h4>
                    <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 pl-1">
                      {atsAnalysis.feedback?.formatting?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact Suggestions */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Impact & Metrics
                    </h4>
                    <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 pl-1">
                      {atsAnalysis.feedback?.impact?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* General coach comment */}
                  <div className="p-3 rounded bg-zinc-900/40 border border-zinc-900/60 text-xs text-zinc-300">
                    <span className="font-semibold text-white block mb-0.5">Coach Overview:</span>
                    {atsAnalysis.feedback?.general}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
                  <HelpCircle className="h-8 w-8 text-zinc-600" />
                  <div className="max-w-[200px]">
                    <p className="text-xs font-medium text-zinc-400">No active analysis</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Paste your resume and click Analyze to scan for ATS alignment.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
