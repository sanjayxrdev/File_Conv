import React, { useState, useRef, useEffect } from 'react';
import { Files, ArrowRight, Trash, Lightning, Check, Stack } from '@phosphor-icons/react';
import { FormatsRegistryResponse } from '../types';
import gsap from 'gsap';

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
  const fileListRef = useRef<HTMLDivElement>(null);
  const formatGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 16,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });

      if (fileListRef.current && fileListRef.current.children.length > 0) {
        gsap.from(fileListRef.current.children, {
          x: -12,
          opacity: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: "power2.out",
        });
      }
      if (formatGridRef.current) {
        gsap.from(formatGridRef.current.children, {
          y: 8,
          opacity: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.out",
          delay: 0.2,
        });
      }
    }, cardRef);
    return () => ctx.revert();
  }, []);

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const commonTargets = [
    { ext: 'pdf', label: 'PDF Document' },
    { ext: 'md', label: 'Markdown File' },
    { ext: 'docx', label: 'Word Document' },
    { ext: 'ipynb', label: 'Jupyter Notebook' },
    { ext: 'py', label: 'Python Script' },
    { ext: 'js', label: 'JavaScript' },
    { ext: 'txt', label: 'Plain Text' },
    { ext: 'png', label: 'PNG Image' },
    { ext: 'csv', label: 'CSV Table' },
    { ext: 'html', label: 'HTML Document' },
  ];

  return (
    <div
      ref={cardRef}
      className="w-full max-w-2xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-card bg-accent-red text-accent-red-text border border-accent-red-text/10 flex items-center justify-center shrink-0">
            <Files className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <h4 className="font-sans font-semibold text-ink-primary text-base tracking-tight">
              Batch Conversion
            </h4>
            <p className="text-xs text-ink-muted mt-0.5">
              {files.length} files &middot; {formatSize(totalBytes)}
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="p-2 rounded-card text-ink-faint hover:text-accent-red-text hover:bg-accent-red transition-colors"
          title="Clear all files"
        >
          <Trash className="w-4 h-4" weight="bold" />
        </button>
      </div>

      {/* Selected File List */}
      <div ref={fileListRef} className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {files.map((f, idx) => {
          const ext = f.name.split('.').pop()?.toLowerCase() || '';
          return (
            <div
              key={`${f.name}-${idx}`}
              className="p-3 rounded-card bg-surface-raised border border-surface-border flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <kbd className="uppercase text-[10px]">.{ext}</kbd>
                <span className="text-ink-primary truncate font-medium">{f.name}</span>
                <span className="text-ink-muted text-[11px] font-mono">({formatSize(f.size)})</span>
              </div>

              <button
                onClick={() => onRemoveFile(idx)}
                className="p-1 rounded hover:bg-accent-red text-ink-faint hover:text-accent-red-text transition-colors"
                title="Remove file"
              >
                <Trash className="w-3.5 h-3.5" weight="bold" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Target Format Selector Grid */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-2">
          <Stack className="w-3.5 h-3.5" weight="bold" />
          <span>Target format for all files</span>
        </label>
        <div ref={formatGridRef} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {commonTargets.map((t) => {
            const isSelected = t.ext === selectedTarget;
            return (
              <button
                key={t.ext}
                type="button"
                onClick={() => setSelectedTarget(t.ext)}
                className={`p-2.5 rounded-card text-left border transition-all ${
                  isSelected
                    ? "border-ink-primary bg-ink-primary text-white"
                    : "border-surface-border bg-surface-card hover:border-ink-faint text-ink-secondary"
                }`}
              >
                <div className="font-semibold text-xs font-mono flex items-center justify-between">
                  <span>.{t.ext}</span>
                  {isSelected && <Check className="w-3 h-3" weight="bold" />}
                </div>
                <div className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-white/60" : "text-ink-muted"}`}>
                  {t.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Convert All Action Button */}
      <button
        onClick={() => onConvertBatch(selectedTarget)}
        disabled={isSubmitting || files.length === 0}
        className="w-full py-3.5 px-6 rounded-card bg-ink-primary text-white font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 hover:bg-[#333333] active:scale-[0.99] disabled:opacity-40"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Lightning className="w-4 h-4" weight="fill" />
            <span>Convert {files.length} files to .{selectedTarget.toUpperCase()}</span>
            <ArrowRight className="w-4 h-4" weight="bold" />
          </>
        )}
      </button>
    </div>
  );
};
