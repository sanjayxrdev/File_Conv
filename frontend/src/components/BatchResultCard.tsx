import React, { useRef, useEffect } from 'react';
import { CheckCircle, Download, Archive, ArrowClockwise } from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface BatchResultCardProps {
  batchId: string;
  totalFiles: number;
  completedFiles: number;
  zipDownloadUrl?: string;
  targetFormat: string;
  files: Array<{
    job_id: string;
    original_filename: string;
    target_format: string;
    status: string;
    download_url?: string;
  }>;
  onReset: () => void;
}

export const BatchResultCard: React.FC<BatchResultCardProps> = ({
  batchId,
  totalFiles,
  completedFiles,
  zipDownloadUrl,
  targetFormat,
  files,
  onReset,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(cardRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.5,
      })
      .from(badgeRef.current, {
        scale: 0.3,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(2)",
      }, "-=0.2")
      .from(Array.from(cardRef.current?.querySelectorAll('h3, p') || []), {
        y: 10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
      }, "-=0.3");

      if (fileListRef.current) {
        gsap.from(fileListRef.current.children, {
          scrollTrigger: {
            trigger: fileListRef.current,
            start: "top 90%",
            once: true,
          },
          x: -12,
          opacity: 0,
          duration: 0.35,
          stagger: 0.04,
          ease: "power2.out",
        });
      }
    }, cardRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={cardRef} className="w-full max-w-2xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-8 space-y-5 text-center">

      {/* Success Badge */}
      <div
        ref={badgeRef}
        className="w-16 h-16 mx-auto rounded-card bg-accent-green text-accent-green-text border border-accent-green-text/10 flex items-center justify-center"
      >
        <CheckCircle className="w-9 h-9" weight="fill" />
      </div>

      <div>
        <h3 className="font-serif text-2xl text-ink-primary mb-1">Batch conversion complete</h3>
        <p className="text-sm text-ink-muted">
          Converted <span className="font-semibold text-ink-primary">{completedFiles}</span> of{' '}
          <span className="font-semibold text-ink-primary">{totalFiles}</span> files to .{targetFormat.toUpperCase()}
        </p>
      </div>

      {/* Primary ZIP Download */}
      {zipDownloadUrl && (
        <a
          href={zipDownloadUrl}
          download={`converted_batch_${batchId.substring(0, 8)}.zip`}
          className="w-full py-3.5 px-6 rounded-card bg-ink-primary hover:bg-[#333333] text-white font-semibold text-sm flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all"
        >
          <Archive className="w-4 h-4" weight="bold" />
          <span>Download all as ZIP</span>
          <Download className="w-3.5 h-3.5" weight="bold" />
        </a>
      )}

      {/* Individual Downloads */}
      <div className="text-left space-y-2 pt-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          Individual files
        </div>

        <div ref={fileListRef} className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {files.map((f) => {
            const baseName = f.original_filename.split('.')[0];
            const outName = `${baseName}.${f.target_format}`;
            return (
              <div
                key={f.job_id}
                className="p-2.5 rounded-card bg-surface-raised border border-surface-border flex items-center justify-between text-xs"
              >
                <span className="text-ink-primary font-medium truncate max-w-[70%]">{outName}</span>
                {f.download_url ? (
                  <a
                    href={f.download_url}
                    download={outName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface-card border border-surface-border hover:border-ink-faint text-ink-secondary font-medium transition-colors"
                  >
                    <Download className="w-3 h-3" weight="bold" />
                    <span>Get</span>
                  </a>
                ) : (
                  <span className="text-accent-red-text font-medium">Failed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert Another Batch */}
      <button
        onClick={onReset}
        className="w-full py-3 rounded-card bg-surface-raised border border-surface-border hover:bg-surface-border/50 text-ink-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <ArrowClockwise className="w-4 h-4" weight="bold" />
        <span>Convert another batch</span>
      </button>
    </div>
  );
};
