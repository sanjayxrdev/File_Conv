import React, { useEffect, useRef } from 'react';
import { Spinner, CheckCircle, XCircle } from '@phosphor-icons/react';
import gsap from 'gsap';

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
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 16,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    }, cardRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${progress}%`,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [progress]);

  return (
    <div
      ref={cardRef}
      className="w-full max-w-2xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-8 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-card bg-surface-raised border border-surface-border flex items-center justify-center text-ink-muted">
            <Spinner className="w-5 h-5 animate-spin" weight="bold" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-primary">
              Converting batch
            </h4>
            <p className="text-xs text-ink-muted font-mono mt-0.5">
              .{targetFormat.toUpperCase()} &middot; {completedFiles}/{totalFiles}
            </p>
          </div>
        </div>

        <span className="font-mono text-lg font-semibold text-ink-primary">{progress}%</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-surface-raised overflow-hidden relative border border-surface-border">
        <div
          ref={barRef}
          className="h-full bg-ink-primary rounded-full relative progress-shimmer"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Per File Status List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {files.map((file) => (
          <div
            key={file.job_id}
            className="p-2.5 rounded-card bg-surface-raised border border-surface-border flex items-center justify-between text-xs"
          >
            <span className="text-ink-primary truncate font-medium max-w-[60%]">
              {file.original_filename}
            </span>

            <div className="flex items-center gap-2">
              {file.status === 'completed' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-green text-accent-green-text font-medium text-[11px]">
                  <CheckCircle className="w-3 h-3" weight="fill" /> Done
                </span>
              )}

              {file.status === 'failed' && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-red text-accent-red-text font-medium text-[11px]"
                  title={file.error}
                >
                  <XCircle className="w-3 h-3" weight="fill" /> Failed
                </span>
              )}

              {(file.status === 'queued' || file.status === 'processing') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-border text-ink-muted font-mono text-[11px]">
                  <Spinner className="w-3 h-3 animate-spin" weight="bold" /> {file.progress}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
