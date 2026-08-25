import React, { useState } from 'react';
import { DownloadSimple, ArrowCounterClockwise, CheckCircle, FilePdf, PencilSimple } from '@phosphor-icons/react';
import { stripExtension, getDownloadFilename } from '../../utils/filenameUtils';

interface PdfDownloadResultProps {
  title?: string;
  message?: string;
  description?: string;
  originalFilename?: string;
  downloadFilename?: string;
  downloadUrl: string;
  outputSizeBytes?: number;
  onReset: () => void;
  isZip?: boolean;
}

export const PdfDownloadResult: React.FC<PdfDownloadResultProps> = ({
  title = 'Processing Complete!',
  message,
  description,
  originalFilename = 'document.pdf',
  downloadFilename,
  downloadUrl,
  outputSizeBytes,
  onReset,
  isZip = false,
}) => {
  const effectiveFilename = downloadFilename || originalFilename;
  const effectiveMessage = description || message || 'Your file is ready for instant download.';
  const targetExt = isZip ? 'zip' : 'pdf';
  const initialBase = stripExtension(effectiveFilename, targetExt) || 'document';
  
  const [customBaseName, setCustomBaseName] = useState<string>(initialBase);

  const finalDownloadName = getDownloadFilename(customBaseName, targetExt, initialBase);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Build direct download URL with custom_filename param
  const finalUrl = `${downloadUrl}?custom_filename=${encodeURIComponent(finalDownloadName)}`;

  return (
    <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 text-center space-y-6 shadow-xs font-sans">
      <div className="w-16 h-16 rounded-full bg-accent-green/10 text-accent-green-text mx-auto flex items-center justify-center">
        <CheckCircle className="w-10 h-10" weight="bold" />
      </div>

      <div>
        <h3 className="font-serif text-2xl text-ink-primary font-normal">{title}</h3>
        <p className="text-ink-muted text-xs sm:text-sm mt-1">{effectiveMessage}</p>
      </div>

      {/* Interactive Filename Editor Card */}
      <div className="bg-surface-raised border border-surface-border rounded-card p-4 space-y-3 max-w-md mx-auto text-left">
        <div className="flex items-center justify-between">
          <label htmlFor="custom-filename-input" className="text-xs font-semibold text-ink-primary flex items-center gap-1.5">
            <PencilSimple className="w-3.5 h-3.5 text-accent-blue-text" weight="bold" />
            <span>Customize Download Filename</span>
          </label>
          {outputSizeBytes && (
            <span className="font-mono text-[11px] text-ink-muted">
              {formatFileSize(outputSizeBytes)}
            </span>
          )}
        </div>

        <div className="flex items-center rounded-card border border-surface-border bg-surface-card overflow-hidden focus-within:ring-2 focus-within:ring-ink-primary/20">
          <input
            id="custom-filename-input"
            type="text"
            value={customBaseName}
            onChange={(e) => setCustomBaseName(e.target.value)}
            placeholder="Enter file name..."
            className="flex-1 px-3 py-2 text-xs font-medium text-ink-primary bg-transparent focus:outline-none"
          />
          <span className="px-3 py-2 bg-surface-raised border-l border-surface-border text-ink-muted text-xs font-mono font-semibold select-none">
            .{targetExt}
          </span>
        </div>

        <div className="text-[11px] text-ink-muted flex items-center justify-between">
          <span>Final Download Name:</span>
          <span className="font-mono font-semibold text-ink-primary truncate max-w-[200px]">
            {finalDownloadName}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <a
          href={finalUrl}
          download={finalDownloadName}
          className="w-full sm:w-auto px-6 py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs"
        >
          <DownloadSimple className="w-4 h-4" weight="bold" />
          <span>{isZip ? 'Download ZIP' : 'Download PDF'}</span>
        </a>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-3 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-semibold hover:bg-surface-raised transition-colors flex items-center justify-center gap-2"
        >
          <ArrowCounterClockwise className="w-4 h-4" weight="bold" />
          <span>Process Another File</span>
        </button>
      </div>
    </div>
  );
};
