import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Download, Archive, RefreshCw, Sparkles } from 'lucide-react';
import anime from 'animejs';

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
  const checkIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (checkIconRef.current) {
      anime({
        targets: checkIconRef.current,
        scale: [0.2, 1],
        opacity: [0, 1],
        rotateZ: [-45, 0],
        duration: 800,
        easing: 'easeOutElastic(1, .5)',
      });
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl glass-panel p-8 shadow-2xl space-y-6 text-center border border-white/10 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Animated Check Badge */}
      <div
        ref={checkIconRef}
        className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600/30 to-cyan-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20"
      >
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <h3 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center justify-center gap-2">
          <span>Batch Conversion Complete!</span>
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </h3>
        <p className="text-sm text-slate-300">
          Successfully converted <span className="text-emerald-400 font-bold">{completedFiles}</span> of <span className="text-white font-bold">{totalFiles}</span> files to .{targetFormat.toUpperCase()}
        </p>
      </div>

      {/* Primary ZIP Archive Download Action */}
      {zipDownloadUrl && (
        <a
          href={zipDownloadUrl}
          download={`converted_batch_${batchId.substring(0, 8)}.zip`}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-emerald-600/30 active:scale-[0.99] border border-white/20"
        >
          <Archive className="w-5 h-5" />
          <span>Download All Converted Files (.ZIP)</span>
          <Download className="w-4 h-4 ml-1" />
        </a>
      )}

      {/* Individual File Download List */}
      <div className="text-left space-y-3 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Individual File Downloads:
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {files.map((f) => {
            const baseName = f.original_filename.split('.')[0];
            const outName = `${baseName}.${f.target_format}`;
            return (
              <div
                key={f.job_id}
                className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <span className="text-slate-200 font-semibold truncate max-w-[70%]">{outName}</span>
                {f.download_url ? (
                  <a
                    href={f.download_url}
                    download={outName}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                ) : (
                  <span className="text-red-400 font-semibold">Failed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert Another Batch */}
      <div className="pt-2">
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Convert another batch</span>
        </button>
      </div>

    </div>
  );
};
