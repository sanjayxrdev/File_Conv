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
    <div ref={cardRef} className="w-full max-w-2xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-8 space-y-5 text-center">

      {/* Success Badge */}
      <div
        ref={badgeRef}
        className="w-16 h-16 mx-auto rounded-card bg-accent-green text-accent-green-text border border-accent-green-text/10 flex items-center justify-center"
      >
        <CheckCircle className="w-9 h-9" weight="fill" />
      </div>

      <div>
        <h3 className="font-serif text-2xl text-ink-primary mb-1">Conversion complete</h3>
        <p className="text-sm text-ink-muted">Your file is ready for download.</p>
      </div>

      {/* Result File Details */}
      <div className="p-4 rounded-card bg-surface-raised border border-surface-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left overflow-hidden">
          <div className="w-10 h-10 rounded-card bg-ink-primary text-white flex items-center justify-center shrink-0">
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
          className="px-5 py-2.5 rounded-card bg-ink-primary hover:bg-[#333333] text-white text-sm font-semibold flex items-center gap-2 active:scale-[0.98] transition-all shrink-0"
        >
          <Download className="w-4 h-4" weight="bold" />
          <span>Download</span>
        </a>
      </div>

      {/* Convert Another */}
      <button
        onClick={onReset}
        className="w-full py-3 rounded-card bg-surface-raised border border-surface-border hover:bg-surface-border/50 text-ink-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <ArrowClockwise className="w-4 h-4" weight="bold" />
        <span>Convert another file</span>
      </button>
    </div>
  );
};
