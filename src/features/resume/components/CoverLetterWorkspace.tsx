'use client';

import React from 'react';
import { Sparkles, Copy, FileSignature } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CoverLetterWorkspaceProps {
  companyName: string;
  setCompanyName: (val: string) => void;
  jobTitle: string;
  setJobTitle: (val: string) => void;
  jobDescription: string;
  setJobDescription: (val: string) => void;
  resumeText: string;
  coverLetterResult: string | null;
  isGeneratingCoverLetter: boolean;
  handleGenerateCoverLetter: () => void;
}

export default function CoverLetterWorkspace({
  companyName,
  setCompanyName,
  jobTitle,
  setJobTitle,
  jobDescription,
  setJobDescription,
  resumeText,
  coverLetterResult,
  isGeneratingCoverLetter,
  handleGenerateCoverLetter,
}: CoverLetterWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white">Cover Letter Generator</h2>
        <p className="text-xs text-zinc-400">Generate a custom Cover Letter tailored to your target job profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Controls Left */}
        <div className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-sm">Letter Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-500">Company Name</label>
                <Input
                  placeholder="e.g. Vercel"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-500">Job Title</label>
                <Input
                  placeholder="e.g. Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-500">Job Description (Snippets or full text)</label>
                <Textarea
                  placeholder="Paste job requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[140px] text-xs"
                />
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-zinc-900 bg-zinc-950/40 rounded-b-lg">
              <Button
                onClick={handleGenerateCoverLetter}
                disabled={!resumeText.trim() || !jobDescription.trim()}
                isLoading={isGeneratingCoverLetter}
                className="w-full text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Generate Cover Letter
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Generated Content Right */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-panel flex flex-col min-h-[400px]">
            <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Drafted Letter</CardTitle>
              {coverLetterResult && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetterResult);
                    alert("Copied to clipboard!");
                  }}
                  className="text-[10px] h-7 px-2 text-zinc-400 hover:text-white"
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy Markdown
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[400px]">
              {coverLetterResult ? (
                <div className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900/20 p-4 border border-zinc-900 rounded select-text">
                  {coverLetterResult}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-24 space-y-3">
                  <FileSignature className="h-8 w-8 text-zinc-600" />
                  <div className="max-w-[200px]">
                    <p className="text-xs font-medium text-zinc-400">Ready to draft</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Specify job Details, click generate, and Hermes 3 will create a letter aligned with your resume.</p>
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
