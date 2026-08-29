import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiCompressPdf, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { ArrowsInLineVertical, Sparkle, Gauge, ShieldCheck, ArrowLeft, CheckCircle } from '@phosphor-icons/react';

export const CompressPdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [compressionLevel, setCompressionLevel] = useState<'recommended' | 'extreme' | 'light'>('recommended');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [resultJob, setResultJob] = useState<{ downloadUrl: string; filename: string; savingsMsg?: string } | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileSizeBytes(selectedFile.size);
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
    setFileSizeBytes(0);
    setResultJob(null);
    setError(null);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProcessCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg('Optimizing images and deflating PDF streams...');
    setError(null);

    try {
      const init = await apiCompressPdf(file, compressionLevel);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.pdf`,
              savingsMsg: status.message
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Compression failed.');
          } else if (status.message) {
            setProgressMsg(status.message);
          }
        } catch (err: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(err.message || 'Failed to monitor compression job.');
        }
      }, 1000);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to start PDF compression.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/#tools-directory')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          ⚡ 100% Private Local Optimization
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary flex items-center gap-3">
          <ArrowsInLineVertical className="w-7 h-7 text-emerald-500" weight="bold" />
          Compress PDF Document
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Reduce PDF file size significantly while preserving crisp text, vector sharpness, and high visual quality.
        </p>
      </div>

      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          isLoading={isLoadingFile}
          label="Drop your PDF here to compress"
          description="Supports all standard PDFs with zero file size limits"
        />
      ) : resultJob ? (
        <div className="space-y-4">
          {resultJob.savingsMsg && (
            <div className="p-4 rounded-card bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" weight="fill" />
              <span>{resultJob.savingsMsg}</span>
            </div>
          )}
          <PdfDownloadResult
            downloadUrl={resultJob.downloadUrl}
            downloadFilename={resultJob.filename}
            onReset={handleClear}
            title="PDF Compressed Successfully!"
          />
        </div>
      ) : (
        <div className="space-y-6 bg-surface-card border border-surface-border p-6 rounded-card shadow-sm">
          {/* File summary badge */}
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-canvas border border-surface-border text-xs">
            <span className="font-semibold text-ink-primary truncate max-w-xs">{file.name}</span>
            <div className="flex items-center gap-4 text-ink-muted">
              <span>{totalPages} Pages</span>
              <span className="font-mono">{formatBytes(fileSizeBytes)}</span>
              <button
                onClick={handleClear}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Compression Level Presets */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Select Compression Level
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Recommended */}
              <button
                type="button"
                onClick={() => setCompressionLevel('recommended')}
                className={`p-4 rounded-card border text-left transition-all relative ${
                  compressionLevel === 'recommended'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-ink-primary shadow-sm'
                    : 'border-surface-border bg-surface-canvas hover:border-ink-muted/40 text-ink-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                    <Sparkle className="w-4 h-4 text-emerald-500" weight="fill" />
                    Recommended
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                    Best Balance
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  Smart downsampling to ~144 DPI. High visual quality with 40-70% size reduction.
                </p>
              </button>

              {/* Extreme */}
              <button
                type="button"
                onClick={() => setCompressionLevel('extreme')}
                className={`p-4 rounded-card border text-left transition-all ${
                  compressionLevel === 'extreme'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-ink-primary shadow-sm'
                    : 'border-surface-border bg-surface-canvas hover:border-ink-muted/40 text-ink-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-500" weight="bold" />
                    Extreme
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold">
                    Max Savings
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  Aggressive 96 DPI image compression. Perfect for email attachments and strict web portal limits.
                </p>
              </button>

              {/* Light */}
              <button
                type="button"
                onClick={() => setCompressionLevel('light')}
                className={`p-4 rounded-card border text-left transition-all ${
                  compressionLevel === 'light'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-ink-primary shadow-sm'
                    : 'border-surface-border bg-surface-canvas hover:border-ink-muted/40 text-ink-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-500" weight="bold" />
                    Light
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                    Lossless
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  Deflates duplicate streams and fonts while preserving pristine 200+ DPI print-ready images.
                </p>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-card bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleProcessCompress}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-card bg-ink-primary text-surface-canvas font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-canvas border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Compressing PDF...'}</span>
              </>
            ) : (
              <>
                <ArrowsInLineVertical className="w-4 h-4" weight="bold" />
                <span>Compress PDF Now</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
