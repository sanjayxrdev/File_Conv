import React, { useState, useEffect, useRef } from 'react';
import { Files, ArrowRight, Trash2, Zap, Check, Layers } from 'lucide-react';
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
        { opacity: 0, scale: 0.98, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }
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
      className="w-full max-w-3xl mx-auto rounded-3xl bg-white p-8 shadow-xl space-y-6 border border-slate-200 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shrink-0 shadow-md">
            <Files className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">
              Batch Conversion ({files.length} Files Selected)
            </h4>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Total Size: {formatSize(totalBytes)}
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="px-2.5 py-1 rounded-lg bg-red-100 border border-red-200 text-red-600 font-mono font-bold uppercase text-[10px]">
                  .{ext}
                </span>
                <span className="text-slate-900 truncate font-extrabold">{f.name}</span>
                <span className="text-slate-500 text-[11px] font-mono">({formatSize(f.size)})</span>
              </div>

              <button
                onClick={() => onRemoveFile(idx)}
                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Target Format Selector Grid */}
      <div>
        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-red-600" />
          <span>Choose Target Format for All Files</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {commonTargets.map((t) => {
            const isSelected = t.ext === selectedTarget;
            return (
              <button
                key={t.ext}
                type="button"
                onClick={() => setSelectedTarget(t.ext)}
                className={`p-3.5 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? 'border-red-600 bg-red-50 text-slate-900 font-extrabold shadow-md scale-[1.02]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold'
                }`}
              >
                <div className="font-extrabold text-xs uppercase flex items-center justify-between">
                  <span>.{t.ext}</span>
                  {isSelected && <Check className="w-4 h-4 text-red-600" />}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-1 font-medium">{t.label}</div>
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
          className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-lg tracking-wide transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-red-600/30 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-6 h-6 fill-white" />
              <span>Convert All {files.length} Files to .{selectedTarget.toUpperCase()}</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};

