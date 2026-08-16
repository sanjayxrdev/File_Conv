import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Layers, Trash2, ArrowUp, ArrowDown, Merge, Sparkles } from 'lucide-react';
import gsap from 'gsap';

interface MergeDropzoneProps {
  onStartMerge: (files: File[], mergeType: string) => void;
  isSubmitting: boolean;
}

export const MergeDropzone: React.FC<MergeDropzoneProps> = ({ onStartMerge, isSubmitting }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [mergeType, setMergeType] = useState<string>('pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.96, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }
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
      onStartMerge(files, mergeType);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Type Selector Tabs */}
      <div className="p-2 rounded-2xl glass-panel grid grid-cols-3 gap-2 border border-white/10">
        <button
          type="button"
          onClick={() => setMergeType('pdf')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            mergeType === 'pdf'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Merge PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setMergeType('ppt')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            mergeType === 'ppt'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Merge PPTX</span>
        </button>

        <button
          type="button"
          onClick={() => setMergeType('docx')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            mergeType === 'docx'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Merge DOCX</span>
        </button>
      </div>

      {/* Multi-File Upload Drop Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-3xl glass-panel p-10 text-center transition-all duration-500 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(59,130,246,0.12)] border border-white/10 relative overflow-hidden"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => e.target.files && handleFileAdd(e.target.files)}
          className="hidden"
        />
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h4 className="text-xl font-bold text-white tracking-tight">
          Select Multiple .{mergeType.toUpperCase()} Files
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Click to browse or drag & drop files to combine in sequence
        </p>
      </div>

      {/* Selected Files Reorder List */}
      {files.length > 0 && (
        <div className="rounded-3xl glass-panel p-6 space-y-4 border border-white/10">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-white/10">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Files to Merge ({files.length})</span>
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-red-400 hover:underline text-xs font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-sm hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 truncate font-semibold">{file.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveFile(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveFile(idx, 'down')}
                    disabled={idx === files.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
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
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 active:scale-[0.99] border border-white/20"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Merge className="w-5 h-5" />
                <span>Merge {files.length} {mergeType.toUpperCase()} Files Now</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
