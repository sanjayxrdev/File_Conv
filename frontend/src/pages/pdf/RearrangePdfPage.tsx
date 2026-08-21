import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfPageThumbnailGrid, PdfPageItem } from '../../components/pdf/PdfPageThumbnailGrid';
import { PdfPageSelector } from '../../components/pdf/PdfPageSelector';
import { PdfToolbar } from '../../components/pdf/PdfToolbar';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiRearrangePdf, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { ArrowLeft, SquaresFour, Export } from '@phosphor-icons/react';

export const RearrangePdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Undo / Redo history stack
  const [history, setHistory] = useState<PdfPageItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [resultJob, setResultJob] = useState<{ downloadUrl: string; filename: string } | null>(null);

  const updatePagesWithHistory = (newPages: PdfPageItem[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newPages);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setPages(newPages);
  };

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
      setHistory([items]);
      setHistoryIndex(0);
      setSelectedIds([]);
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPages(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPages(history[nextIndex]);
    }
  };

  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updatePagesWithHistory(updated);
  };

  const handleMoveRight = (index: number) => {
    if (index >= pages.length - 1) return;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updatePagesWithHistory(updated);
  };

  const handleMoveToStart = (index: number) => {
    if (index <= 0) return;
    const updated = [...pages];
    const [item] = updated.splice(index, 1);
    updated.unshift(item);
    updatePagesWithHistory(updated);
  };

  const handleMoveToEnd = (index: number) => {
    if (index >= pages.length - 1) return;
    const updated = [...pages];
    const [item] = updated.splice(index, 1);
    updated.push(item);
    updatePagesWithHistory(updated);
  };

  const handleDeletePage = (index: number) => {
    const itemToDelete = pages[index];
    const updated = pages.filter((_, i) => i !== index);
    if (itemToDelete) {
      setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete.id));
    }
    updatePagesWithHistory(updated);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const updated = pages.filter((p) => !selectedIds.includes(p.id));
    setSelectedIds([]);
    updatePagesWithHistory(updated);
  };

  const handleRotatePage = (index: number) => {
    const updated = pages.map((p, i) =>
      i === index ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p
    );
    updatePagesWithHistory(updated);
  };

  const handleRotateSelected = () => {
    if (selectedIds.length === 0) return;
    const updated = pages.map((p) =>
      selectedIds.includes(p.id) ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p
    );
    updatePagesWithHistory(updated);
  };

  const handleClear = () => {
    setFile(null);
    setPages([]);
    setTotalPages(0);
    setSelectedIds([]);
    setHistory([]);
    setHistoryIndex(-1);
    setResultJob(null);
    setError(null);
  };

  const handleProcessRearrange = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    setProgressMsg('Rearranging PDF document...');
    setError(null);

    try {
      const orderIndices = pages.map((p) => p.originalIndex);
      const init = await apiRearrangePdf(file, orderIndices);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          setProgressMsg(status.message || 'Rearranging...');

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
            setError(status.error || 'Rearrange failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to start page rearrange.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-border pb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2 rounded-card bg-surface-card border border-surface-border text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
        </button>
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal flex items-center gap-2">
            <SquaresFour className="w-8 h-8 text-accent-green-text" weight="bold" />
            Rearrange PDF Pages
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Drag and drop page thumbnails or use move controls to reorder and delete pages.
          </p>
        </div>
      </div>

      {!file ? (
        <PdfUploader
          label="Upload PDF to Rearrange Pages"
          description="Drag and drop your PDF here to organize page sequence."
          onFileSelect={handleFileSelect}
          error={error}
        />
      ) : resultJob ? (
        <PdfDownloadResult
          title="PDF Rearranged!"
          message="Your document has been reordered and exported."
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
            pageCount={pages.length}
            error={error}
          />

          {isLoadingFile ? (
            <div className="p-12 text-center text-ink-muted font-mono text-sm animate-pulse">
              Rendering page thumbnails...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toolbar & Selector */}
              <PdfToolbar
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                selectedCount={selectedIds.length}
                onRotateSelected={handleRotateSelected}
                onDeleteSelected={handleDeleteSelected}
                onReset={() => {
                  if (history.length > 0) {
                    setPages(history[0]);
                    setHistoryIndex(0);
                    setSelectedIds([]);
                  }
                }}
              />

              <PdfPageSelector
                totalPages={pages.length}
                selectedCount={selectedIds.length}
                onSelectAll={() => setSelectedIds(pages.map((p) => p.id))}
                onDeselectAll={() => setSelectedIds([])}
                onSelectOdd={() => setSelectedIds(pages.filter((_, idx) => idx % 2 === 0).map((p) => p.id))}
                onSelectEven={() => setSelectedIds(pages.filter((_, idx) => idx % 2 === 1).map((p) => p.id))}
              />

              {/* Page Grid */}
              <PdfPageThumbnailGrid
                pages={pages}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onMoveLeft={handleMoveLeft}
                onMoveRight={handleMoveRight}
                onMoveToStart={handleMoveToStart}
                onMoveToEnd={handleMoveToEnd}
                onRotate={handleRotatePage}
                onDelete={handleDeletePage}
                onReorder={(newPages) => updatePagesWithHistory(newPages)}
                showControls={true}
              />

              {/* Export Button */}
              <button
                type="button"
                disabled={isProcessing || pages.length === 0}
                onClick={handleProcessRearrange}
                className="w-full py-3 rounded-card bg-ink-primary text-white text-xs font-semibold hover:bg-[#333333] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                <Export className="w-4 h-4" weight="bold" />
                <span>
                  {isProcessing ? progressMsg || 'Processing...' : `Export Rearranged PDF (${pages.length} pages)`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
