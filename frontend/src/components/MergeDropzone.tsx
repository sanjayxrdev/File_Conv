import React, { useRef, useState, useEffect } from 'react';
import { UploadSimple, Trash, ArrowUp, ArrowDown, Stack } from '@phosphor-icons/react';
import gsap from 'gsap';

interface MergeDropzoneProps {
  onMergeSubmit: (files: File[], mergeType: string) => void;
  isSubmitting?: boolean;
}

export const MergeDropzone: React.FC<MergeDropzoneProps> = ({ onMergeSubmit, isSubmitting }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [mergeType, setMergeType] = useState<string>('pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });

      if (iconRef.current) {
        gsap.to(iconRef.current, {
          y: -4,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (fileListRef.current && fileListRef.current.children.length > 0) {
      gsap.from(fileListRef.current.children, {
        x: -12,
        opacity: 0,
        duration: 0.3,
        stagger: 0.04,
        ease: "power2.out",
      });
    }
  }, [files.length]);

  const handleFileAdd = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;
    const newFiles = [...files];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;
    setFiles(newFiles);
  };

  const handleMergeSubmit = () => {
    if (files.length >= 2) {
      onMergeSubmit(files, mergeType);
    }
  };

  const mergeTabs = [
    { type: 'pdf', label: 'PDF' },
    { type: 'ppt', label: 'PPTX' },
    { type: 'docx', label: 'DOCX' },
  ];

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto space-y-6">

      {/* Type Selector Tabs */}
      <div className="p-1 rounded-card bg-surface-card border border-surface-border grid grid-cols-3 gap-1">
        {mergeTabs.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => setMergeType(tab.type)}
            className={`py-2.5 px-4 rounded-card text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              mergeType === tab.type
                ? 'bg-ink-primary text-white'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
            }`}
          >
            <Stack className="w-3.5 h-3.5" weight="bold" />
            <span>Merge {tab.label}</span>
          </button>
        ))}
      </div>

      {/* Multi-File Upload Drop Area */}
      <div
        ref={dropAreaRef}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-card-lg bg-surface-card p-10 text-center transition-all duration-200 border-2 border-dashed border-surface-border hover:border-ink-faint"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => e.target.files && handleFileAdd(e.target.files)}
          className="hidden"
        />
        <div ref={iconRef} className="w-14 h-14 mx-auto mb-4 rounded-card bg-surface-raised border border-surface-border text-ink-muted flex items-center justify-center">
          <UploadSimple className="w-7 h-7" weight="bold" />
        </div>
        <h4 className="font-serif text-2xl text-ink-primary">
          Select multiple .{mergeType.toUpperCase()} files
        </h4>
        <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
          Click to browse or drag and drop files to combine in sequence
        </p>
      </div>

      {/* Selected Files Reorder List */}
      {files.length > 0 && (
        <div className="rounded-card-lg bg-surface-card border border-surface-border p-6 space-y-4">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-ink-muted pb-3 border-b border-surface-border">
            <span className="flex items-center gap-1.5">
              <Stack className="w-3.5 h-3.5" weight="bold" />
              <span>Files to merge ({files.length})</span>
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-accent-red-text hover:underline text-xs font-medium"
            >
              Clear all
            </button>
          </div>

          <div ref={fileListRef} className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="p-3 rounded-card bg-surface-raised border border-surface-border flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="w-7 h-7 rounded bg-surface-card border border-surface-border text-ink-muted font-mono text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-ink-primary truncate font-medium text-xs">{file.name}</span>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => moveFile(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-surface-border text-ink-faint disabled:opacity-20 transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" weight="bold" />
                  </button>
                  <button
                    onClick={() => moveFile(idx, 'down')}
                    disabled={idx === files.length - 1}
                    className="p-1 rounded hover:bg-surface-border text-ink-faint disabled:opacity-20 transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" weight="bold" />
                  </button>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded hover:bg-accent-red text-ink-faint hover:text-accent-red-text transition-colors"
                    title="Remove"
                  >
                    <Trash className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleMergeSubmit}
            disabled={files.length < 2 || isSubmitting}
            className="w-full py-3.5 px-6 rounded-card bg-ink-primary text-white font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 hover:bg-[#333333] active:scale-[0.99] disabled:opacity-40"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Stack className="w-4 h-4" weight="bold" />
                <span>Merge {files.length} {mergeType.toUpperCase()} files</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
