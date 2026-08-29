import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiCropPdf, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { Crop, ArrowLeft, CheckCircle } from '@phosphor-icons/react';

export const CropPdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop values
  const [marginTop, setMarginTop] = useState<number>(10);
  const [marginBottom, setMarginBottom] = useState<number>(10);
  const [marginLeft, setMarginLeft] = useState<number>(10);
  const [marginRight, setMarginRight] = useState<number>(10);
  const [unit, setUnit] = useState<string>('pct');

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

  const handleProcessCrop = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg('Cropping document margins across all pages...');
    setError(null);

    try {
      const init = await apiCropPdf(
        file,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        unit
      );

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: `${file.name.replace(/\.[^/.]+$/, '')}_cropped.pdf`
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Cropping failed.');
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
      setError(e.message || 'Failed to start cropping.');
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
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
          Margin & Bleed Trimmer
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary flex items-center gap-3">
          <Crop className="w-7 h-7 text-teal-500" weight="bold" />
          Crop PDF Document Margins
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Trim scanner borders, remove excessive margins, or adjust bleed dimensions across all pages.
        </p>
      </div>

      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          isLoading={isLoadingFile}
          label="Drop your PDF here to crop margins"
          description="Supports all standard PDFs"
        />
      ) : resultJob ? (
        <div className="space-y-4">
          <PdfDownloadResult
            downloadUrl={resultJob.downloadUrl}
            downloadFilename={resultJob.filename}
            onReset={handleClear}
            title="PDF Margins Cropped Successfully!"
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

          {/* Unit selector */}
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-canvas border border-surface-border">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Measurement Unit</span>
            <div className="flex gap-2">
              {[
                { id: 'pct', label: 'Percent (%)' },
                { id: 'in', label: 'Inches (in)' },
                { id: 'mm', label: 'Millimeters (mm)' },
                { id: 'pt', label: 'Points (pt)' }
              ].map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnit(u.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    unit === u.id
                      ? 'bg-ink-primary text-surface-canvas'
                      : 'bg-surface-card text-ink-muted hover:text-ink-primary border border-surface-border'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4-way Margin Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Top Margin
              </label>
              <input
                type="number"
                min="0"
                value={marginTop}
                onChange={(e) => setMarginTop(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Bottom Margin
              </label>
              <input
                type="number"
                min="0"
                value={marginBottom}
                onChange={(e) => setMarginBottom(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Left Margin
              </label>
              <input
                type="number"
                min="0"
                value={marginLeft}
                onChange={(e) => setMarginLeft(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Right Margin
              </label>
              <input
                type="number"
                min="0"
                value={marginRight}
                onChange={(e) => setMarginRight(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
              />
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
            onClick={handleProcessCrop}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-card bg-ink-primary text-surface-canvas font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-canvas border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Cropping margins...'}</span>
              </>
            ) : (
              <>
                <Crop className="w-4 h-4" weight="bold" />
                <span>Crop Document Margins Now</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
