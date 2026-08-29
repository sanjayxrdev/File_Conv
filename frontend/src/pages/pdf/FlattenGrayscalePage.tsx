import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiFlattenGrayscale, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { DropHalf, ArrowLeft, Printer, ShieldCheck, CheckCircle } from '@phosphor-icons/react';

export const FlattenGrayscalePage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [makeGrayscale, setMakeGrayscale] = useState<boolean>(true);
  const [flattenForms, setFlattenForms] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [resultJob, setResultJob] = useState<{ downloadUrl: string; filename: string } | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoadingFile(true);
    setError(null);
    setResultJob(null);

    try {
      const info = await fetchPdfInfo(selectedFile);
      setTotalPages(info.total_pages);
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setTotalPages(0);
    setResultJob(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg('Flattening form fields and optimizing color channels...');
    setError(null);

    try {
      const init = await apiFlattenGrayscale(file, makeGrayscale, flattenForms);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: `${file.name.replace(/\.[^/.]+$/, '')}_${makeGrayscale ? 'grayscale' : 'flattened'}.pdf`
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Optimization failed.');
          } else if (status.message) {
            setProgressMsg(status.message);
          }
        } catch (err: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(err.message || 'Failed to check status.');
        }
      }, 1000);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to start processing.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/#tools-directory')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          Print Optimizer & Form Lock
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary flex items-center gap-3">
          <DropHalf className="w-7 h-7 text-gray-500" weight="bold" />
          Flatten & Grayscale PDF (Print Optimizer)
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Convert colored documents to high-contrast monochrome grayscale (saving ink/toner) and bake interactive form fields into non-editable static PDF pages.
        </p>
      </div>

      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          isLoading={isLoadingFile}
          label="Drop your PDF here to flatten or make grayscale"
          description="Supports single and multi-page PDFs"
        />
      ) : resultJob ? (
        <div className="space-y-4">
          <PdfDownloadResult
            downloadUrl={resultJob.downloadUrl}
            downloadFilename={resultJob.filename}
            onReset={handleClear}
            title="Document Processed Successfully!"
          />
        </div>
      ) : (
        <div className="space-y-6 bg-surface-card border border-surface-border p-6 rounded-card shadow-sm">
          {/* File info */}
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-canvas border border-surface-border text-xs">
            <span className="font-semibold text-ink-primary truncate max-w-xs">{file.name}</span>
            <div className="flex items-center gap-4 text-ink-muted">
              <span>{totalPages} Pages</span>
              <button onClick={handleClear} className="text-red-500 hover:text-red-600 font-medium">
                Change File
              </button>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setMakeGrayscale(!makeGrayscale)}
              className={`p-4 rounded-card border cursor-pointer transition-all ${
                makeGrayscale
                  ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/40 text-ink-primary shadow-sm'
                  : 'border-surface-border bg-surface-canvas text-ink-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-ink-primary flex items-center gap-2">
                  <Printer className="w-4 h-4 text-gray-500" weight="bold" />
                  Convert to Grayscale
                </span>
                <input
                  type="checkbox"
                  checked={makeGrayscale}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-gray-700 pointer-events-none"
                />
              </div>
              <p className="text-xs leading-relaxed mt-1">
                Transforms all color artwork, backgrounds, and images to clean, ink-saving monochrome gray channels.
              </p>
            </div>

            <div
              onClick={() => setFlattenForms(!flattenForms)}
              className={`p-4 rounded-card border cursor-pointer transition-all ${
                flattenForms
                  ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/40 text-ink-primary shadow-sm'
                  : 'border-surface-border bg-surface-canvas text-ink-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-ink-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-500" weight="bold" />
                  Flatten Form Fields & Annotations
                </span>
                <input
                  type="checkbox"
                  checked={flattenForms}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-gray-700 pointer-events-none"
                />
              </div>
              <p className="text-xs leading-relaxed mt-1">
                Bakes fillable inputs, checkmarks, signatures, and sticky notes into permanent document graphics to prevent tampering.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-card bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Action */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={(!makeGrayscale && !flattenForms) || isProcessing}
            className="w-full py-3 px-4 rounded-card bg-ink-primary text-surface-canvas font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-canvas border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Processing document...'}</span>
              </>
            ) : (
              <>
                <DropHalf className="w-4 h-4" weight="bold" />
                <span>Apply Optimization</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
