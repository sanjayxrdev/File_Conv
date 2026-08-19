import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Layers, Trash2, ArrowUp, ArrowDown, Merge, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.98, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

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

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Type Selector Tabs */}
      <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-md grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setMergeType('pdf')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            mergeType === 'pdf'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Merge PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setMergeType('ppt')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            mergeType === 'ppt'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Merge PPTX</span>
        </button>

        <button
          type="button"
          onClick={() => setMergeType('docx')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            mergeType === 'docx'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Merge DOCX</span>
        </button>
      </div>

      {/* Multi-File Upload Drop Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-3xl bg-white p-10 text-center transition-all duration-300 hover:border-red-500 border-2 border-dashed border-slate-300 shadow-md hover:shadow-xl relative overflow-hidden"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => e.target.files && handleFileAdd(e.target.files)}
          className="hidden"
        />
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shadow-md">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Select Multiple .{mergeType.toUpperCase()} Files
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-medium">
          Click to browse or drag & drop files to combine in sequence
        </p>
      </div>

      {/* Selected Files Reorder List */}
      {files.length > 0 && (
        <div className="rounded-3xl bg-white p-6 space-y-4 border border-slate-200 shadow-xl">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>Files to Merge ({files.length})</span>
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-red-600 hover:underline text-xs font-bold"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-8 h-8 rounded-xl bg-red-100 border border-red-200 text-red-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-slate-900 truncate font-extrabold">{file.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveFile(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveFile(idx, 'down')}
                    disabled={idx === files.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleMergeSubmit}
            disabled={files.length < 2 || isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-lg tracking-wide transition-all flex items-center justify-center gap-2.5 shadow-lg hover:shadow-red-600/30 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Merge className="w-6 h-6" />
                <span>Merge {files.length} {mergeType.toUpperCase()} Files Now</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

