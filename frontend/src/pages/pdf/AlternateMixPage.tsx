import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiAlternateMix, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { GitMerge, ArrowLeft, UploadSimple, Shuffle, FileText, CheckCircle } from '@phosphor-icons/react';

export const AlternateMixPage: React.FC = () => {
  const navigate = useNavigate();

  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [pagesA, setPagesA] = useState<number>(0);
  const [pagesB, setPagesB] = useState<number>(0);
  const [reverseB, setReverseB] = useState<boolean>(false);
  const [repeatRemaining, setRepeatRemaining] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [resultJob, setResultJob] = useState<{ downloadUrl: string; filename: string; summaryMsg?: string } | null>(null);

  const handleSelectA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileA(f);
      setError(null);
      try {
        const info = await fetchPdfInfo(f);
        setPagesA(info.total_pages);
      } catch (err: any) {
        setError('Could not inspect Document 1.');
      }
    }
  };

  const handleSelectB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileB(f);
      setError(null);
      try {
        const info = await fetchPdfInfo(f);
        setPagesB(info.total_pages);
      } catch (err: any) {
        setError('Could not inspect Document 2.');
      }
    }
  };

  const handleClear = () => {
    setFileA(null);
    setFileB(null);
    setPagesA(0);
    setPagesB(0);
    setResultJob(null);
    setError(null);
  };

  const handleProcessMix = async () => {
    if (!fileA || !fileB) {
      setError('Please select both Document 1 and Document 2.');
      return;
    }

    setIsProcessing(true);
    setProgressMsg('Weaving odd and even pages sequentially...');
    setError(null);

    try {
      const init = await apiAlternateMix(fileA, fileB, reverseB, repeatRemaining);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: `${fileA.name.replace(/\.[^/.]+$/, '')}_mixed.pdf`,
              summaryMsg: status.message
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Mixing failed.');
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
      setError(e.message || 'Failed to start mixing.');
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
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Duplex Scanner Weaver
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary flex items-center gap-3">
          <GitMerge className="w-7 h-7 text-blue-500" weight="bold" />
          Alternate & Mix PDF (Duplex Weaver)
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Interleave two PDF documents alternately page by page. Perfect for combining separate odd and even duplex scanner runs.
        </p>
      </div>

      {resultJob ? (
        <div className="space-y-4">
          {resultJob.summaryMsg && (
            <div className="p-4 rounded-card bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" weight="fill" />
              <span>{resultJob.summaryMsg}</span>
            </div>
          )}
          <PdfDownloadResult
            downloadUrl={resultJob.downloadUrl}
            downloadFilename={resultJob.filename}
            onReset={handleClear}
            title="PDFs Mixed Successfully!"
          />
        </div>
      ) : (
        <div className="space-y-6 bg-surface-card border border-surface-border p-6 rounded-card shadow-sm">
          {/* Dual Uploaders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Doc A */}
            <div className="p-5 rounded-card bg-surface-canvas border-2 border-dashed border-surface-border flex flex-col items-center justify-center text-center space-y-3 relative hover:border-blue-500/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-5 h-5" weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-primary">Document 1 (Odd Pages)</h3>
                <p className="text-xs text-ink-muted mt-0.5">Pages: 1, 3, 5, 7...</p>
              </div>
              {fileA ? (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-full">
                  ✓ {fileA.name} ({pagesA} pgs)
                </div>
              ) : (
                <label className="cursor-pointer py-1.5 px-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition-all">
                  Choose PDF 1
                  <input type="file" accept=".pdf" className="hidden" onChange={handleSelectA} />
                </label>
              )}
            </div>

            {/* Doc B */}
            <div className="p-5 rounded-card bg-surface-canvas border-2 border-dashed border-surface-border flex flex-col items-center justify-center text-center space-y-3 relative hover:border-blue-500/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileText className="w-5 h-5" weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-primary">Document 2 (Even Pages)</h3>
                <p className="text-xs text-ink-muted mt-0.5">Pages: 2, 4, 6, 8...</p>
              </div>
              {fileB ? (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-full">
                  ✓ {fileB.name} ({pagesB} pgs)
                </div>
              ) : (
                <label className="cursor-pointer py-1.5 px-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition-all">
                  Choose PDF 2
                  <input type="file" accept=".pdf" className="hidden" onChange={handleSelectB} />
                </label>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="p-4 rounded-card bg-surface-canvas border border-surface-border space-y-3 text-xs">
            <h4 className="font-bold text-ink-primary uppercase tracking-wider text-[11px]">Weaving Settings</h4>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reverseB}
                onChange={(e) => setReverseB(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-ink-primary font-medium">
                Reverse Document 2 (Useful if even pages scanner tray fed backward: e.g. Page 10, 8, 6...)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={repeatRemaining}
                onChange={(e) => setRepeatRemaining(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-ink-primary font-medium">
                Append remaining trailing pages if page counts differ
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-card bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Action */}
          <button
            type="button"
            onClick={handleProcessMix}
            disabled={!fileA || !fileB || isProcessing}
            className="w-full py-3 px-4 rounded-card bg-ink-primary text-surface-canvas font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-canvas border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Weaving pages...'}</span>
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4" weight="bold" />
                <span>Mix & Alternate Pages Now</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
