import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Files, AlertCircle, FolderPlus, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import anime from 'animejs';
import { FormatsRegistryResponse } from '../types';

interface FileDropzoneProps {
  registry: FormatsRegistryResponse | null;
  onFilesSelect: (files: File[]) => void;
  error?: string | null;
  customTitle?: string;
  customSubtitle?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  registry,
  onFilesSelect,
  error,
  customTitle,
  customSubtitle,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dropzoneRef.current) {
      gsap.fromTo(
        dropzoneRef.current,
        { opacity: 0, scale: 0.98, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out' }
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
          scale: [1, 1.2],
          duration: 400,
          easing: 'easeOutQuad',
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
        duration: 300,
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
    <div className="w-full max-w-3xl mx-auto space-y-4 font-sans">
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 overflow-hidden craft-card border-2 ${
          isDragOver
            ? 'border-[#ff385c] bg-[#ff385c]/10 scale-[1.01] shadow-2xl shadow-[#ff385c]/20'
            : 'border-dashed border-white/20 hover:border-[#ff385c]/50 hover:bg-[#13151c]/90 shadow-2xl'
        }`}
      >
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

        {/* Handcrafted Electric Upload Box */}
        <div className="space-y-6">
          <div
            ref={iconRef}
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-[#ff385c] to-[#e02847] text-white flex items-center justify-center shadow-lg shadow-[#ff385c]/30 border border-white/20"
          >
            <UploadCloud className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h3 className="font-syne text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
              {customTitle || 'Drop files here or click to browse'}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto font-sans font-medium">
              {customSubtitle || '100% free, private, and local-first file converter. Drag single files or entire folders.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-heading">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff385c] to-[#e02847] hover:from-[#ff4d6d] hover:to-[#ff385c] text-white font-extrabold text-base tracking-wide shadow-xl shadow-[#ff385c]/30 transition-all duration-200 active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-[#ccff00]" />
              <span>Select Files</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 px-5 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm transition-all"
            >
              <FolderPlus className="w-4 h-4 text-[#00f2fe]" />
              <span>Folder</span>
            </button>
          </div>

          <div className="pt-2 text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
            <Files className="w-3.5 h-3.5 text-[#ff385c]" />
            <span>PDF, DOCX, PPTX, XLSX, HTML, PNG, JPG, MP4, MP3, TXT, PY & More</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff385c]/10 border border-[#ff385c]/30 text-[#ff385c] text-sm font-medium flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#ff385c]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};



