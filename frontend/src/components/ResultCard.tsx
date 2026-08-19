import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Download, RefreshCw, FileCheck } from 'lucide-react';
import anime from 'animejs';

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
  const checkIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (checkIconRef.current) {
      anime({
        targets: checkIconRef.current,
        scale: [0.3, 1],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutQuad',
      });
    }
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
    <div className="w-full max-w-2xl mx-auto rounded-3xl glass-panel p-8 shadow-2xl space-y-6 text-center">
      
      {/* Animated Success Badge */}
      <div ref={checkIconRef} className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div>
        <h3 className="text-3xl font-extrabold text-white mb-1 tracking-tight">Conversion Complete!</h3>
        <p className="text-sm text-slate-400 font-medium">Your file has been converted successfully and is ready for download.</p>
      </div>

      {/* Result File Details */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <FileCheck className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <div className="font-extrabold text-white truncate text-base">{outputFilename}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              <span className="uppercase text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">{targetFormat}</span>
              {outputSizeBytes && <span className="ml-2">• {formatSize(outputSizeBytes)}</span>}
            </div>
          </div>
        </div>

        <a
          href={downloadUrl}
          download={outputFilename}
          className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-95 shrink-0"
        >
          <Download className="w-5 h-5" />
          <span>Download</span>
        </a>
      </div>

      {/* Convert Another File */}
      <div className="pt-2">
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-white/15"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Convert another file</span>
        </button>
      </div>

    </div>
  );
};


