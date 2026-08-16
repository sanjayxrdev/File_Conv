import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Files, AlertCircle, FolderPlus, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import anime from 'animejs';
import { FormatsRegistryResponse } from '../types';

interface FileDropzoneProps {
  registry: FormatsRegistryResponse | null;
  onFilesSelect: (files: File[]) => void;
  error?: string | null;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ registry, onFilesSelect, error }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dropzoneRef.current) {
      gsap.fromTo(
        dropzoneRef.current,
        { opacity: 0, scale: 0.96, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
      if (iconRef.current) {
        anime({
          targets: iconRef.current,
          scale: [1, 1.25],
          rotate: [0, 10, -10, 0],
          duration: 600,
          easing: 'easeOutElastic(1, .5)',
        });
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (iconRef.current) {
      anime({
        targets: iconRef.current,
        scale: 1,
        duration: 400,
        easing: 'easeOutQuad',
      });
    }
  };

  const processFiles = (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    onFilesSelect(arr);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl p-10 sm:p-14 text-center transition-all duration-500 overflow-hidden border ${
          isDragOver
            ? 'border-blue-500 bg-blue-600/15 scale-[1.02] shadow-[0_0_60px_rgba(59,130,246,0.25)]'
            : 'border-white/10 glass-panel hover:border-blue-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_40px_rgba(59,130,246,0.12)]'
        }`}
      >
        {/* Background Glowing Ambient Radial */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          type="file"
          ref={folderInputRef}
          // @ts-ignore
          webkitdirectory=""
          // @ts-ignore
          directory=""
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Upload Icon Container */}
        <div
          ref={iconRef}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10"
        >
          <UploadCloud className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Drop Files or Folders Here
        </h3>
        <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
          Drag and drop <span className="text-blue-400 font-semibold">1 to N files</span> or select an entire folder to start batch conversion.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all duration-300 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Browse Files</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              folderInputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 font-semibold transition-all duration-300"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>Select Folder</span>
          </button>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
          <Files className="w-3.5 h-3.5 text-indigo-400" />
          <span>Supports Multi-File & Batch Conversions</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 glass-panel">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
