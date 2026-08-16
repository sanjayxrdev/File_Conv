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
        rotateZ: [-30, 0],
        duration: 700,
        easing: 'easeOutElastic(1, .5)',
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
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-dark-card/90 p-8 shadow-2xl space-y-6 text-center">
      
      {/* Animated Success Badge */}
      <div ref={checkIconRef} className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-1">Conversion Complete!</h3>
        <p className="text-sm text-slate-400">Your converted file is ready for download.</p>
      </div>

      {/* Result File Details */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-left overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-white truncate text-sm">{outputFilename}</div>
            <div className="text-xs text-slate-400 font-mono">
              <span className="uppercase text-emerald-400 font-semibold">{targetFormat}</span>
              {outputSizeBytes && <span> • {formatSize(outputSizeBytes)}</span>}
            </div>
          </div>
        </div>

        <a
          href={downloadUrl}
          download={outputFilename}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </a>
      </div>

      {/* Convert Another File */}
      <div className="pt-2">
        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Convert another file</span>
        </button>
      </div>

    </div>
  );
};
