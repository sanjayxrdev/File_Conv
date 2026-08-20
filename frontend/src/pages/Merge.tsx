import React, { useState, useRef, useEffect } from 'react';
import { Stack } from '@phosphor-icons/react';
import { startMerge, getJobStatus } from '../services/api';
import { ConversionJobResponse } from '../types';
import { MergeDropzone } from '../components/MergeDropzone';
import { ProgressBar } from '../components/ProgressBar';
import { ResultCard } from '../components/ResultCard';
import gsap from 'gsap';

export const MergePage: React.FC = () => {
  const [jobState, setJobState] = useState<ConversionJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<any>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(heroRef.current!.querySelector('.badge'), {
        y: -10,
        opacity: 0,
        duration: 0.4,
      })
      .from(heroRef.current!.querySelector('h1'), {
        y: 20,
        opacity: 0,
        duration: 0.5,
      }, "-=0.2")
      .from(heroRef.current!.querySelector('p'), {
        y: 15,
        opacity: 0,
        duration: 0.4,
      }, "-=0.3");
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      gsap.from(errorRef.current, {
        y: 12,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [error]);

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
    <div className="space-y-16 pb-20 px-4 bg-transparent min-h-screen font-sans">

      {/* Hero Header */}
      <div ref={heroRef} className="text-center space-y-4 pt-12 max-w-3xl mx-auto">
        <div className="badge inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-mono text-ink-muted">
          <Stack className="w-3.5 h-3.5" weight="bold" />
          <span>Multi-File Combiner</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl text-ink-primary">
          Merge PDF, PPTX & DOCX files
        </h1>

        <p className="text-ink-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
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
        <div ref={errorRef} className="w-full max-w-2xl mx-auto p-6 rounded-card-lg bg-accent-red border border-accent-red-text/10 text-center space-y-3">
          <h4 className="text-lg font-semibold text-accent-red-text">Merge failed</h4>
          <p className="text-sm text-ink-secondary">{error}</p>
          <button
            onClick={handleClear}
            className="px-5 py-2 rounded-card bg-ink-primary text-white text-sm font-semibold hover:bg-[#333333] transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};
