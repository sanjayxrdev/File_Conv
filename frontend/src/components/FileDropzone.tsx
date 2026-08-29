import React, { useRef, useState, useEffect } from 'react';
import { UploadSimple, FolderSimplePlus, WarningCircle, Files } from '@phosphor-icons/react';
import { FormatsRegistryResponse } from '../types';
import gsap from 'gsap';

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
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropzoneRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(dropzoneRef.current, {
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
    }, dropzoneRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(errorRef.current,
        { x: -8, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [error]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
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
    <div className="w-full max-w-2xl mx-auto space-y-4 font-sans">
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-card-lg p-10 sm:p-14 text-center transition-all duration-200 border-2 border-dashed relative overflow-hidden ${
          isDragOver
            ? "border-ink-primary bg-surface-raised"
            : "border-surface-border hover:border-ink-primary bg-surface-card"
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

        <div className="space-y-6 relative z-10">
          <div ref={iconRef} className="w-14 h-14 mx-auto rounded-card bg-surface-raised border border-surface-border text-ink-primary flex items-center justify-center">
            <UploadSimple className="w-7 h-7" weight="bold" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-sans font-semibold text-2xl sm:text-3xl text-ink-primary tracking-tight">
              {customTitle || "Drop files here or click to browse"}
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
              {customSubtitle || "Private, local-first file converter. Drag single files or entire folders with zero telemetry."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <UploadSimple className="w-4 h-4" weight="bold" />
              <span>Select Files</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card bg-surface-card border border-surface-border text-ink-secondary text-xs font-semibold hover:bg-surface-raised transition-all"
            >
              <FolderSimplePlus className="w-4 h-4 text-ink-muted" weight="bold" />
              <span>Upload Folder</span>
            </button>
          </div>

          <div className="pt-2 text-[11px] text-ink-muted font-mono flex items-center justify-center gap-1.5 flex-wrap">
            <Files className="w-3.5 h-3.5" weight="bold" />
            <span>PDF, DOCX, PPTX, XLSX, HTML, PNG, JPG, MP4, MP3, TXT, MD, OCR</span>
          </div>
        </div>
      </div>

      {error && (
        <div ref={errorRef} className="p-4 rounded-card bg-accent-red border border-accent-red-text/20 text-accent-red-text text-xs font-medium flex items-center gap-3 animate-fade-in">
          <WarningCircle className="w-4 h-4 shrink-0" weight="bold" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
