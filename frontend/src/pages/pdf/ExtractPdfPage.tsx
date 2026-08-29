import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfPageThumbnailGrid, PdfPageItem } from '../../components/pdf/PdfPageThumbnailGrid';
import { PdfPageSelector } from '../../components/pdf/PdfPageSelector';
import { PageRangeInput } from '../../components/pdf/PageRangeInput';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiExtractPdfPages, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { ArrowLeft, Export, Sparkle } from '@phosphor-icons/react';

export const ExtractPdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rangeText, setRangeText] = useState<string>('');

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const items: PdfPageItem[] = info.thumbnails.map((t) => ({
        id: `page-${t.page_index}`,
        originalIndex: t.page_index,
        dataUrl: t.data_url,
        rotation: t.rotation,
      }));
      setPages(items);
      setSelectedIds([]);
      setRangeText('');
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      const indices = next.map((i) => parseInt(i.replace('page-', ''), 10) + 1).sort((a, b) => a - b);
      setRangeText(indices.join(', '));
      return next;
    });
  };

  const handleRangeChange = (val: string, indices: number[], isValid: boolean) => {
    setRangeText(val);
    if (isValid) {
      const ids = indices.map((idx) => `page-${idx}`);
      setSelectedIds(ids);
    }
  };

  const handleSelectAll = () => {
    const all = pages.map((p) => p.id);
    setSelectedIds(all);
    setRangeText(`1-${totalPages}`);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
    setRangeText('');
  };

  const handleSelectOdd = () => {
    const odd = pages.filter((_, idx) => idx % 2 === 0).map((p) => p.id);
    setSelectedIds(odd);
    const indices = odd.map((i) => parseInt(i.replace('page-', ''), 10) + 1);
    setRangeText(indices.join(', '));
  };

  const handleSelectEven = () => {
    const even = pages.filter((_, idx) => idx % 2 === 1).map((p) => p.id);
    setSelectedIds(even);
    const indices = even.map((i) => parseInt(i.replace('page-', ''), 10) + 1);
    setRangeText(indices.join(', '));
  };

  const handleClear = () => {
    setFile(null);
    setPages([]);
    setTotalPages(0);
    setSelectedIds([]);
    setRangeText('');
    setResultJob(null);
    setError(null);
  };

  const handleProcessExtract = async () => {
    if (!file || selectedIds.length === 0) return;
    setIsProcessing(true);
    setProgressMsg('Extracting selected pages...');
    setError(null);

    try {
      const indices = selectedIds.map((id) => parseInt(id.replace('page-', ''), 10));
      const init = await apiExtractPdfPages(file, indices);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          setProgressMsg(status.message || 'Extracting...');

          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: status.original_filename,
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Extraction failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to start extraction.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans">
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
            <Export className="w-8 h-8 text-accent-blue-text" weight="bold" />
            Extract PDF Pages
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Select specific pages visually or via ranges and extract them into a new document.
          </p>
        </div>
      </div>

      {!file ? (
        <PdfUploader
          label="Upload PDF to Extract Pages"
          description="Drag and drop your PDF here to select and save specific pages."
          onFileSelect={handleFileSelect}
          error={error}
        />
      ) : resultJob ? (
        <PdfDownloadResult
          title="Extraction Completed!"
          message={`Successfully extracted ${selectedIds.length} pages into a new PDF.`}
          originalFilename={resultJob.filename}
          downloadUrl={resultJob.downloadUrl}
          onReset={handleClear}
        />
      ) : (
        <div className="space-y-6">
          <PdfUploader
            onFileSelect={handleFileSelect}
            selectedFile={file}
            onClear={handleClear}
            pageCount={totalPages}
            error={error}
          />

          {isLoadingFile ? (
            <div className="p-12 text-center text-ink-muted font-mono text-sm animate-pulse">
              Rendering PDF thumbnails...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Range Input & Batch Selector */}
              <div className="bg-surface-card border border-surface-border rounded-card-lg p-5 space-y-4">
                <PageRangeInput
                  totalPages={totalPages}
                  value={rangeText}
                  onChange={handleRangeChange}
                  label="Specify Pages to Extract"
                  placeholder="e.g. 1-3, 5, 8-10"
                />

                <PdfPageSelector
                  totalPages={totalPages}
                  selectedCount={selectedIds.length}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onSelectOdd={handleSelectOdd}
                  onSelectEven={handleSelectEven}
                />
              </div>

              {/* Thumbnails */}
              <PdfPageThumbnailGrid
                pages={pages}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                showControls={false}
              />

              {/* Submit */}
              <button
                type="button"
                disabled={isProcessing || selectedIds.length === 0}
                onClick={handleProcessExtract}
                className="w-full py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkle className="w-4 h-4" weight="bold" />
                <span>
                  {isProcessing
                    ? progressMsg || 'Extracting Pages...'
                    : `Extract ${selectedIds.length} ${selectedIds.length === 1 ? 'Page' : 'Pages'} to New PDF`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
