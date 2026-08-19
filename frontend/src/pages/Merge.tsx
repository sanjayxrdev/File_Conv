import React, { useState, useRef } from 'react';
import { Layers } from 'lucide-react';
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
    <div className="space-y-12 pb-20 px-4 bg-transparent min-h-screen font-sans">
      
      {/* Hero Header */}
      <div className="text-center space-y-3 pt-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff385c]/15 border border-[#ff385c]/30 text-[#ff385c] text-xs font-mono font-bold uppercase tracking-wider">
          <Layers className="w-4 h-4 text-[#ff385c]" />
          <span>Multi-File Combiner</span>
        </div>

        <h2 className="font-syne text-3xl sm:text-5xl font-black text-white tracking-tight craft-title-gradient">
          Merge PDF, PPTX & DOCX Files
        </h2>

        <p className="font-heading text-slate-400 text-base sm:text-lg max-w-lg mx-auto font-medium">
          Combine multiple PDF documents, PowerPoint presentations, or Word files into a single unified file.
        </p>
      </div>


      {/* Main Workflow */}
      {!jobState && (
        <MergeDropzone
          onMergeSubmit={handleStartMerge}
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
        <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-4 shadow-sm">
          <h4 className="text-xl font-extrabold text-red-600">Merge Failed</h4>
          <p className="text-sm text-slate-700 font-medium">{error}</p>
          <button
            onClick={handleClear}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

    </div>
  );
};

