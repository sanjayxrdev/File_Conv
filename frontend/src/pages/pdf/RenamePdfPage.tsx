import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiRenamePdf, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { stripExtension, getDownloadFilename } from '../../utils/filenameUtils';
import { ArrowLeft, PencilSimple, DownloadSimple, CheckCircle, FilePdf } from '@phosphor-icons/react';

export const RenamePdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Custom Filename state
  const [newBaseName, setNewBaseName] = useState<string>('');
  
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Download result state
  const [resultJob, setResultJob] = useState<{ downloadUrl: string; filename: string } | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoadingFile(true);
    setError(null);
    setResultJob(null);

    const initialBase = stripExtension(selectedFile.name, 'pdf') || 'document';
    setNewBaseName(initialBase);

    try {
      const info = await fetchPdfInfo(selectedFile);
      setTotalPages(info.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to read PDF document.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTotalPages(0);
    setNewBaseName('');
    setError(null);
    setResultJob(null);
    setIsProcessing(false);
  };

  const finalFilename = getDownloadFilename(newBaseName, 'pdf', file ? stripExtension(file.name) : 'document');

  const handleProcessRename = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgressMsg('Submitting rename request...');

    try {
      const init = await apiRenamePdf(file, finalFilename);
      
      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          setProgressMsg(status.message || 'Renaming PDF...');

          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id, finalFilename),
              filename: finalFilename,
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'PDF rename failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);

    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Failed to rename PDF.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-border pb-4">
        <button
          type="button"
          onClick={() => navigate('/#tools-directory')}
          className="p-2 rounded-card bg-surface-card border border-surface-border text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
        </button>
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal flex items-center gap-2">
            <PencilSimple className="w-8 h-8 text-accent-blue-text" weight="bold" />
            Rename PDF
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Change your PDF document filename while preserving document contents and `.pdf` extension.
          </p>
        </div>
      </div>

      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          error={error}
        />
      ) : resultJob ? (
        <PdfDownloadResult
          title="PDF Renamed Successfully!"
          message="Your document has been renamed and is ready for instant download."
          originalFilename={resultJob.filename}
          downloadUrl={resultJob.downloadUrl}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          {/* File Card & Current Filename */}
          <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 space-y-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-card bg-accent-red/10 text-accent-red-text flex items-center justify-center shrink-0">
                  <FilePdf className="w-6 h-6" weight="bold" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    Current Document
                  </span>
                  <h3 className="font-sans font-semibold text-sm text-ink-primary truncate">
                    {file.name}
                  </h3>
                  <span className="text-xs text-ink-muted">
                    {totalPages} {totalPages === 1 ? 'page' : 'pages'} &middot; {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-card text-xs font-semibold text-ink-muted hover:text-ink-primary hover:bg-surface-raised transition-colors"
              >
                Change File
              </button>
            </div>

            {/* Rename Input Section */}
            <div className="space-y-4 max-w-lg mx-auto pt-2">
              <label htmlFor="pdf-rename-input" className="block text-xs font-semibold text-ink-primary">
                New File Name:
              </label>

              <div className="flex items-center rounded-card border border-surface-border bg-surface-card overflow-hidden focus-within:ring-2 focus-within:ring-ink-primary/20 shadow-xs">
                <input
                  id="pdf-rename-input"
                  type="text"
                  value={newBaseName}
                  onChange={(e) => setNewBaseName(e.target.value)}
                  placeholder="my-new-document"
                  className="flex-1 px-3.5 py-2.5 text-sm font-medium text-ink-primary bg-transparent focus:outline-none"
                />
                <span className="px-3.5 py-2.5 bg-surface-raised border-l border-surface-border text-ink-muted text-sm font-mono font-semibold select-none">
                  .pdf
                </span>
              </div>

              {/* Live Preview */}
              <div className="bg-surface-raised border border-surface-border rounded-card p-3 flex items-center justify-between text-xs">
                <span className="text-ink-muted font-medium">Final Download Name:</span>
                <span className="font-mono font-semibold text-ink-primary truncate max-w-[240px]">
                  {finalFilename}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-card text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing || !newBaseName.trim()}
                  onClick={handleProcessRename}
                  className="w-full py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  <DownloadSimple className="w-4 h-4" weight="bold" />
                  <span>{isProcessing ? progressMsg || 'Renaming PDF...' : 'Download Renamed PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
