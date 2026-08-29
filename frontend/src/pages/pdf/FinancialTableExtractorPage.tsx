import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiBankStatementToExcel, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { Table, ArrowLeft, MicrosoftExcelLogo, FileArrowDown, CheckCircle } from '@phosphor-icons/react';

export const FinancialTableExtractorPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [resultJob, setResultJob] = useState<{ downloadUrl: string; filename: string; summaryMsg?: string } | null>(null);

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
    setProgressMsg('Detecting and parsing structured table data from PDF...');
    setError(null);

    try {
      const init = await apiBankStatementToExcel(file);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: `${file.name.replace(/\.[^/.]+$/, '')}_extracted_tables.xlsx`,
              summaryMsg: status.message
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Table extraction failed.');
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
      setError(e.message || 'Failed to start table extraction.');
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
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Smart Financial Data Parser
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary flex items-center gap-3">
          <MicrosoftExcelLogo className="w-7 h-7 text-emerald-600 dark:text-emerald-400" weight="bold" />
          Bank Statement & Financial Table to Excel
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Extract transaction tables, invoices, balance sheets, and tabular datasets directly from PDF into structured, multi-sheet Microsoft Excel (<code className="text-xs bg-surface-canvas px-1 py-0.5 rounded border border-surface-border">.xlsx</code>) files.
        </p>
      </div>

      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          isLoading={isLoadingFile}
          label="Drop bank statement or tabular PDF here"
          description="Supports multi-page statements, invoices, and accounting reports"
        />
      ) : resultJob ? (
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
            title="Excel Spreadsheet Ready!"
            isZip={false}
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

          <div className="p-4 rounded-card bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-2 text-ink-primary">
            <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <Table className="w-4 h-4" weight="bold" />
              <span>Automatic Table Grid & Column Detection</span>
            </div>
            <p className="text-ink-muted leading-relaxed">
              Our intelligent engine parses debit/credit columns, dates, descriptions, and account summaries into separate named sheets per page.
            </p>
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
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-card bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Extracting tables to Excel...'}</span>
              </>
            ) : (
              <>
                <FileArrowDown className="w-4 h-4" weight="bold" />
                <span>Extract Tables to Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
