import React, { useEffect, useRef } from 'react';
import { Spinner } from '@phosphor-icons/react';
import gsap from 'gsap';

interface ProgressBarProps {
  progress: number;
  message?: string;
  sourceFormat: string;
  targetFormat: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  sourceFormat,
  targetFormat,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

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
    <div ref={cardRef} className="w-full max-w-2xl mx-auto rounded-card-lg border border-surface-border bg-surface-card p-8 space-y-6 text-center font-sans shadow-xs">
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-card bg-surface-raised border border-surface-border flex items-center justify-center text-ink-primary">
          <Spinner className="w-5 h-5 animate-spin" weight="bold" />
        </div>
        <div className="text-left">
          <h4 className="text-sm font-semibold text-ink-primary">Converting file</h4>
          <p className="text-xs text-ink-muted font-mono">
            {sourceFormat.toUpperCase()} &rarr; {targetFormat.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full space-y-2">
        <div className="w-full h-2 rounded-pill bg-surface-raised overflow-hidden relative border border-surface-border">
          <div
            ref={barRef}
            className="h-full bg-ink-primary rounded-pill transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted font-mono">
          <span>{message || 'Processing with local engine...'}</span>
          <span className="font-semibold text-ink-primary">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
