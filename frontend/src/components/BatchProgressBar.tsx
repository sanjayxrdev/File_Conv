import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface BatchProgressBarProps {
  progress: number;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  targetFormat: string;
  files: Array<{
    job_id: string;
    original_filename: string;
    status: string;
    progress: number;
    error?: string;
  }>;
}

export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  progress,
  totalFiles,
  completedFiles,
  failedFiles,
  targetFormat,
  files,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${progress}%`,
        duration: 0.4,
        ease: 'power1.out',
      });
    }
  }, [progress]);

  return (
    <div
      ref={cardRef}
      className="w-full max-w-2xl mx-auto rounded-3xl glass-panel p-8 shadow-2xl space-y-6 border border-white/10 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between text-left">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Converting Batch...</span>
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Target: .{targetFormat.toUpperCase()} • {completedFiles}/{totalFiles} Completed
            </p>
          </div>
        </div>

        <span className="font-mono text-2xl font-black gradient-heading">{progress}%</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3.5 rounded-full bg-slate-900 overflow-hidden relative border border-white/5 p-0.5">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 relative shadow-[0_0_15px_#3b82f6]"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Per File Status List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {files.map((file) => (
          <div
            key={file.job_id}
            className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
          >
            <span className="text-slate-200 truncate font-medium max-w-[60%]">
              {file.original_filename}
            </span>

            <div className="flex items-center gap-2">
              {file.status === 'completed' && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              )}

              {file.status === 'failed' && (
                <span
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 font-semibold text-[11px]"
                  title={file.error}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Failed
                </span>
              )}

              {(file.status === 'queued' || file.status === 'processing') && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 font-mono text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {file.progress}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
