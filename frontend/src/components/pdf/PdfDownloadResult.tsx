import React from 'react';
import { DownloadSimple, ArrowCounterClockwise, CheckCircle, FilePdf } from '@phosphor-icons/react';

interface PdfDownloadResultProps {
  title?: string;
  message?: string;
  originalFilename: string;
  downloadUrl: string;
  outputSizeBytes?: number;
  onReset: () => void;
  isZip?: boolean;
}

export const PdfDownloadResult: React.FC<PdfDownloadResultProps> = ({
  title = 'Processing Complete!',
  message = 'Your file is ready for instant download.',
  originalFilename,
  downloadUrl,
  outputSizeBytes,
  onReset,
  isZip = false,
}) => {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 text-center space-y-6 shadow-xs font-sans">
      <div className="w-16 h-16 rounded-full bg-accent-green/10 text-accent-green-text mx-auto flex items-center justify-center">
        <CheckCircle className="w-10 h-10" weight="bold" />
      </div>

      <div>
        <h3 className="font-serif text-2xl text-ink-primary font-normal">{title}</h3>
        <p className="text-ink-muted text-xs sm:text-sm mt-1">{message}</p>
      </div>

      <div className="bg-surface-raised border border-surface-border rounded-card p-4 flex items-center justify-between max-w-md mx-auto text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-card bg-accent-red/10 text-accent-red-text flex items-center justify-center shrink-0">
            <FilePdf className="w-6 h-6" weight="bold" />
          </div>
          <div className="min-w-0">
            <h4 className="font-sans font-semibold text-sm text-ink-primary truncate">
              {originalFilename}
            </h4>
            {outputSizeBytes && (
              <span className="font-mono text-xs text-ink-muted">
                {formatFileSize(outputSizeBytes)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <a
          href={downloadUrl}
          download
          className="w-full sm:w-auto px-6 py-3 rounded-card bg-ink-primary text-white text-xs font-semibold hover:bg-[#333333] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs"
        >
          <DownloadSimple className="w-4 h-4" weight="bold" />
          <span>{isZip ? 'Download All (ZIP)' : 'Download PDF'}</span>
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
