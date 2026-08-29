import React, { useRef, useState } from 'react';
import { UploadSimple, FilePdf, X, WarningCircle } from '@phosphor-icons/react';

interface PdfUploaderProps {
  label?: string;
  description?: string;
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  pageCount?: number;
  acceptTypes?: string;
  error?: string | null;
  isLoading?: boolean;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  label = 'Upload PDF Document',
  description = 'Drag and drop your PDF here, or browse files locally',
  onFileSelect,
  selectedFile,
  onClear,
  pageCount,
  acceptTypes = '.pdf,application/pdf',
  error,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-3">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-card-lg p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-ink-primary bg-surface-raised'
              : 'border-surface-border bg-surface-card hover:border-ink-primary'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent-red/10 text-accent-red-text flex items-center justify-center">
              <FilePdf className="w-8 h-8" weight="bold" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-ink-primary font-normal">
                {label}
              </h3>
              <p className="text-ink-muted text-xs sm:text-sm mt-1">{description}</p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition-colors">
              <UploadSimple className="w-4 h-4" weight="bold" />
              <span>Choose File</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-card p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-card bg-accent-red/10 text-accent-red-text flex items-center justify-center shrink-0">
              <FilePdf className="w-6 h-6" weight="bold" />
            </div>
            <div className="min-w-0">
              <h4 className="font-sans font-semibold text-sm text-ink-primary truncate">
                {selectedFile.name}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono text-ink-muted mt-0.5">
                <span>{formatFileSize(selectedFile.size)}</span>
                {pageCount !== undefined && (
                  <>
                    <span>&middot;</span>
                    <span className="bg-surface-raised px-1.5 py-0.5 rounded text-[11px] font-semibold text-ink-primary">
                      {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-ink-muted hover:text-ink-primary hover:bg-surface-raised rounded-card transition-colors shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" weight="bold" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-card flex items-start gap-2 text-xs text-red-700 font-sans">
          <WarningCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" weight="bold" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
