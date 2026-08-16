import React, { useState, useRef } from 'react';
import { Layers, ShieldCheck } from 'lucide-react';
import { startMerge, getJobStatus } from '../services/api';
import { ConversionJobResponse } from '../types';
import { MergeDropzone } from '../components/MergeDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultCard } from '../components/ResultCard';

export const MergePage: React.FC = () => {
  const [jobState, setJobState] = useState<ConversionJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<any>(null);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleClear = () => {
    clearPollTimer();
    setJobState(null);
    setError(null);
  };

  const handleStartMerge = async (files: File[], mergeType: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const initResp = await startMerge(files, mergeType);
      const jobId = initResp.job_id;

      pollTimerRef.current = setInterval(async () => {
        try {
          const statusResp = await getJobStatus(jobId);
          setJobState(statusResp);

          if (statusResp.status === 'completed' || statusResp.status === 'failed') {
            clearPollTimer();
            setIsSubmitting(false);
            if (statusResp.status === 'failed') {
              setError(statusResp.error || 'Merge failed.');
            }
          }
        } catch (e: any) {
          clearPollTimer();
          setIsSubmitting(false);
          setError(e.message || 'Merge status check failed.');
        }
      }, 500);

    } catch (e: any) {
      setIsSubmitting(false);
      setError(e.message || 'Could not start merge.');
    }
  };

  return (
    <div className="space-y-12 pb-20 px-4">
      
      {/* Hero Header */}
      <div className="text-center space-y-3 pt-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Multi-File Combiner</span>
        </div>

        <h2 className="text-4xl font-black text-white tracking-tight">
          MERGE PPT, PDF & DOCX <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            SEAMLESSLY.
          </span>
        </h2>

        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Combine multiple PowerPoint presentations, PDF documents, or Word files into a single unified output.
        </p>
      </div>

      {/* Main Workflow */}
      {!jobState && (
        <MergeDropzone
          onStartMerge={handleStartMerge}
          isSubmitting={isSubmitting}
        />
      )}

      {jobState && jobState.status === 'processing' && (
        <ProgressBar
          progress={jobState.progress}
          message={jobState.message}
          sourceFormat={jobState.source_format}
          targetFormat={jobState.target_format}
        />
      )}

      {jobState && jobState.status === 'completed' && jobState.download_url && (
        <ResultCard
          originalFilename={jobState.original_filename}
          targetFormat={jobState.target_format}
          downloadUrl={jobState.download_url}
          outputSizeBytes={jobState.output_size_bytes}
          onReset={handleClear}
        />
      )}

      {error && (
        <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-center space-y-4">
          <h4 className="text-xl font-bold text-red-400">Merge Failed</h4>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={handleClear}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

    </div>
  );
};
