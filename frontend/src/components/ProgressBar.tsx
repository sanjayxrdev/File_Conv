import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';

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
  const barRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-dark-card/90 p-8 shadow-2xl space-y-6 text-center">
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <div className="text-left">
          <h4 className="text-lg font-semibold text-white">Converting File...</h4>
          <p className="text-xs text-slate-400 font-mono">
            {sourceFormat.toUpperCase()} → {targetFormat.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full space-y-2">
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            ref={barRef}
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{message || 'Processing...'}</span>
          <span className="font-bold text-blue-400">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
