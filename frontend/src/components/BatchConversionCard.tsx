import React, { useState, useEffect, useRef } from 'react';
import { Files, ArrowRight, Trash2, Zap, Check, FileCode, Layers } from 'lucide-react';
import gsap from 'gsap';
import { FormatsRegistryResponse } from '../types';

interface BatchConversionCardProps {
  files: File[];
  registry: FormatsRegistryResponse;
  onConvertBatch: (targetExt: string) => void;
  onClear: () => void;
  onRemoveFile: (index: number) => void;
  isSubmitting: boolean;
}

export const BatchConversionCard: React.FC<BatchConversionCardProps> = ({
  files,
  registry,
  onConvertBatch,
  onClear,
  onRemoveFile,
  isSubmitting,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('pdf');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, []);

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const commonTargets = [
    { ext: 'pdf', label: 'PDF Document', category: 'document' },
    { ext: 'md', label: 'Markdown File', category: 'text' },
    { ext: 'docx', label: 'Word Document', category: 'document' },
    { ext: 'ipynb', label: 'Jupyter Notebook', category: 'code' },
    { ext: 'py', label: 'Python Script', category: 'code' },
    { ext: 'js', label: 'JavaScript', category: 'code' },
    { ext: 'txt', label: 'Plain Text', category: 'text' },
    { ext: 'png', label: 'PNG Image', category: 'image' },
    { ext: 'csv', label: 'CSV Table', category: 'text' },
    { ext: 'html', label: 'HTML Document', category: 'code' },
  ];

  return (
    <div
      ref={cardRef}
      className="w-full max-w-2xl mx-auto rounded-3xl glass-panel p-8 shadow-2xl space-y-6 border border-white/10 relative overflow-hidden"
    >
      {/* Background Neon Highlights */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-lg tracking-tight">
              Batch Conversion ({files.length} Files)
            </h4>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>Total Size: {formatSize(totalBytes)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
          title="Clear all files"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Selected File List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {files.map((f, idx) => {
          const ext = f.name.split('.').pop()?.toLowerCase() || '';
          return (
            <div
              key={`${f.name}-${idx}`}
              className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono font-bold uppercase text-[10px]">
                  .{ext}
                </span>
                <span className="text-slate-200 truncate font-semibold">{f.name}</span>
                <span className="text-slate-500 text-[11px] font-mono">({formatSize(f.size)})</span>
              </div>

              <button
                onClick={() => onRemoveFile(idx)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Target Format Selector Grid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Choose Universal Target Format</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {commonTargets.map((t) => {
            const isSelected = t.ext === selectedTarget;
            return (
              <button
                key={t.ext}
                type="button"
                onClick={() => setSelectedTarget(t.ext)}
                className={`p-3 rounded-2xl text-left border transition-all duration-300 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/25 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                    : 'border-white/5 bg-slate-900/40 hover:border-white/20 text-slate-300'
                }`}
              >
                <div className="font-extrabold text-xs uppercase flex items-center justify-between">
                  <span>.{t.ext}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">{t.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Convert All Action Button */}
      <div className="pt-2">
        <button
          onClick={() => onConvertBatch(selectedTarget)}
          disabled={isSubmitting || files.length === 0}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 active:scale-[0.99] border border-white/20"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Convert All {files.length} Files to .{selectedTarget.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};
