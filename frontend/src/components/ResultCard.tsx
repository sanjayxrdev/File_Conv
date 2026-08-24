import React, { useRef, useEffect } from 'react';
import { CheckCircle, Download, ArrowClockwise, FileText } from '@phosphor-icons/react';
import gsap from 'gsap';

interface ResultCardProps {
  originalFilename: string;
  targetFormat: string;
  downloadUrl: string;
  outputSizeBytes?: number;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  originalFilename,
  targetFormat,
  downloadUrl,
  outputSizeBytes,
  onReset,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

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
    }, cardRef);
    return () => ctx.revert();
  }, []);

  const lastDot = originalFilename.lastIndexOf('.');
  const baseName = lastDot !== -1 ? originalFilename.substring(0, lastDot) : originalFilename;
  const outputFilename = `${baseName}.${targetFormat}`;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div ref={cardRef} className="w-full max-w-2xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-8 space-y-6 text-center font-sans shadow-xs">

      {/* Success Badge */}
      <div
        ref={badgeRef}
        className="w-14 h-14 mx-auto rounded-card bg-accent-green text-accent-green-text border border-accent-green-text/20 flex items-center justify-center"
      >
        <CheckCircle className="w-8 h-8" weight="fill" />
      </div>

      <div className="space-y-1">
        <h3 className="font-sans font-semibold text-2xl text-ink-primary">Conversion complete</h3>
        <p className="text-xs sm:text-sm text-ink-muted">Your processed file is ready for download.</p>
      </div>

      {/* Result File Details */}
      <div className="p-4 rounded-card bg-surface-raised border border-surface-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left overflow-hidden">
          <div className="w-10 h-10 rounded-card bg-surface-card border border-surface-border text-ink-primary flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" weight="bold" />
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-ink-primary truncate text-sm">{outputFilename}</div>
            <div className="text-xs text-ink-muted font-mono mt-0.5 flex items-center gap-2">
              <kbd className="uppercase text-[10px]">{targetFormat}</kbd>
              {outputSizeBytes && <span>{formatSize(outputSizeBytes)}</span>}
            </div>
          </div>
        </div>

        <a
          href={downloadUrl}
          download={outputFilename}
          className="px-4 py-2 rounded-card bg-ink-primary hover:opacity-90 text-surface-canvas text-xs font-semibold flex items-center gap-2 active:scale-[0.98] transition-all shrink-0"
        >
          <Download className="w-4 h-4" weight="bold" />
          <span>Download</span>
        </a>
      </div>

      {/* Convert Another */}
      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-card bg-surface-raised border border-surface-border hover:bg-surface-border text-ink-secondary text-xs font-medium flex items-center justify-center gap-2 transition-all"
      >
        <ArrowClockwise className="w-4 h-4 text-ink-muted" weight="bold" />
        <span>Convert another file</span>
      </button>
    </div>
  );
};
