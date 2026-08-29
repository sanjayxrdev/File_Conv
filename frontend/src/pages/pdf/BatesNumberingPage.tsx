import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiBatesNumbering, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { IdentificationCard, ArrowLeft, CheckCircle } from '@phosphor-icons/react';

export const BatesNumberingPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bates settings
  const [prefix, setPrefix] = useState<string>('CONF-');
  const [suffix, setSuffix] = useState<string>('');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [digits, setDigits] = useState<number>(6);
  const [position, setPosition] = useState<string>('bottom-right');
  const [fontSize, setFontSize] = useState<number>(10);
  const [colorHex, setColorHex] = useState<string>('#000000');

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

  const previewSample = `${prefix}${String(startNumber).padStart(digits, '0')}${suffix}`;

  const handleProcessBates = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg('Applying legal Bates numbering stamps...');
    setError(null);

    try {
      const init = await apiBatesNumbering(
        file,
        prefix,
        suffix,
        startNumber,
        digits,
        position,
        fontSize,
        colorHex
      );

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: `${file.name.replace(/\.[^/.]+$/, '')}_bates_stamped.pdf`
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Bates numbering failed.');
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
      setError(e.message || 'Failed to start Bates numbering.');
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
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Legal & Discovery Stamping
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary flex items-center gap-3">
          <IdentificationCard className="w-7 h-7 text-indigo-500" weight="bold" />
          Bates Numbering for PDF
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Apply standardized, sequential Bates numbering stamps for legal, corporate, and discovery document archives.
        </p>
      </div>

      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          isLoading={isLoadingFile}
          label="Drop your PDF here to apply Bates numbers"
          description="Supports multi-page documents"
        />
      ) : resultJob ? (
        <div className="space-y-4">
          <PdfDownloadResult
            downloadUrl={resultJob.downloadUrl}
            downloadFilename={resultJob.filename}
            onReset={handleClear}
            title="Bates Numbers Applied Successfully!"
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

          {/* Live Preview Box */}
          <div className="p-4 rounded-card bg-surface-canvas border border-surface-border flex items-center justify-between">
            <span className="text-xs text-ink-muted">Stamp Preview:</span>
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded border border-indigo-200 dark:border-indigo-800">
              {previewSample}
            </span>
          </div>

          {/* Form Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Prefix
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. CONF-, EXHIBIT-A-"
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Suffix (Optional)
              </label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. -USA, -INTERNAL"
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Start Number
              </label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Number of Digits (Zero-Padding)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={digits}
                onChange={(e) => setDigits(Math.max(1, parseInt(e.target.value) || 6))}
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Font Size ({fontSize} pt)
              </label>
              <input
                type="range"
                min="8"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
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
            onClick={handleProcessBates}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-card bg-ink-primary text-surface-canvas font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-canvas border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Applying Bates numbers...'}</span>
              </>
            ) : (
              <>
                <IdentificationCard className="w-4 h-4" weight="bold" />
                <span>Apply Bates Numbering</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
