import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfPageThumbnailGrid, PdfPageItem } from '../../components/pdf/PdfPageThumbnailGrid';
import { PdfPageSelector } from '../../components/pdf/PdfPageSelector';
import { PageRangeInput } from '../../components/pdf/PageRangeInput';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiRotatePdfPages, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { ArrowLeft, ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';

export const RotatePdfPage: React.FC = () => {
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

  const handleRotateSingle = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p))
    );
  };

  const handleRotateSelected = (angleDelta: number) => {
    if (selectedIds.length === 0) return;
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, rotation: ((p.rotation || 0) + angleDelta + 360) % 360 } : p
      )
    );
  };

  const handleRotateAll = (angleDelta: number) => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: ((p.rotation || 0) + angleDelta + 360) % 360 })));
  };

  const handleRangeChange = (val: string, indices: number[], isValid: boolean) => {
    setRangeText(val);
    if (isValid) {
      const ids = indices.map((idx) => `page-${idx}`);
      setSelectedIds(ids);
    }
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

  const handleProcessRotate = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgressMsg('Applying page rotations...');
    setError(null);

    try {
      const rotMap: Record<number, number> = {};
      pages.forEach((p) => {
        if (p.rotation && p.rotation !== 0) {
          rotMap[p.originalIndex] = p.rotation;
        }
      });

      const init = await apiRotatePdfPages(file, rotMap, 0);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          setProgressMsg(status.message || 'Rotating...');

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
            setError(status.error || 'Rotation failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to start page rotation.');
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
            <ArrowClockwise className="w-8 h-8 text-accent-yellow-text" weight="bold" />
            Rotate PDF Pages
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Rotate individual pages, selected ranges, or all pages in your PDF document.
          </p>
        </div>
      </div>

      {!file ? (
        <PdfUploader
          label="Upload PDF to Rotate Pages"
          description="Drag and drop your PDF here to adjust orientation."
          onFileSelect={handleFileSelect}
          error={error}
        />
      ) : resultJob ? (
        <PdfDownloadResult
          title="Rotation Completed!"
          message="Your rotated PDF is ready for download."
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
              {/* Batch Rotation Controls */}
              <div className="bg-surface-card border border-surface-border rounded-card-lg p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-sans text-xs">
                    <span className="font-semibold text-ink-primary">Quick Rotation Controls:</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRotateAll(90)}
                      className="px-3 py-1.5 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowClockwise className="w-4 h-4" weight="bold" />
                      <span>Rotate All 90° CW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRotateAll(180)}
                      className="px-3 py-1.5 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowClockwise className="w-4 h-4" weight="bold" />
                      <span>Rotate All 180°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRotateAll(-90)}
                      className="px-3 py-1.5 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowCounterClockwise className="w-4 h-4" weight="bold" />
                      <span>Rotate All 90° CCW</span>
                    </button>
                  </div>
                </div>

                {selectedIds.length > 0 && (
                  <div className="p-3 bg-surface-raised border border-surface-border rounded-card flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-ink-primary">
                      Selected ({selectedIds.length} pages):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRotateSelected(90)}
                        className="px-2.5 py-1 rounded bg-ink-primary text-surface-canvas font-semibold flex items-center gap-1"
                      >
                        <ArrowClockwise className="w-3.5 h-3.5" weight="bold" />
                        <span>Rotate Selected 90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateSelected(180)}
                        className="px-2.5 py-1 rounded bg-ink-primary text-surface-canvas font-semibold flex items-center gap-1"
                      >
                        <span>180°</span>
                      </button>
                    </div>
                  </div>
                )}

                <PageRangeInput
                  totalPages={totalPages}
                  value={rangeText}
                  onChange={handleRangeChange}
                  label="Select Specific Pages to Rotate"
                  placeholder="e.g. 1-3, 5"
                />

                <PdfPageSelector
                  totalPages={totalPages}
                  selectedCount={selectedIds.length}
                  onSelectAll={() => {
                    setSelectedIds(pages.map((p) => p.id));
                    setRangeText(`1-${totalPages}`);
                  }}
                  onDeselectAll={() => {
                    setSelectedIds([]);
                    setRangeText('');
                  }}
                  onSelectOdd={() => {
                    const odd = pages.filter((_, idx) => idx % 2 === 0).map((p) => p.id);
                    setSelectedIds(odd);
                    setRangeText(odd.map((i) => parseInt(i.replace('page-', ''), 10) + 1).join(', '));
                  }}
                  onSelectEven={() => {
                    const even = pages.filter((_, idx) => idx % 2 === 1).map((p) => p.id);
                    setSelectedIds(even);
                    setRangeText(even.map((i) => parseInt(i.replace('page-', ''), 10) + 1).join(', '));
                  }}
                />
              </div>

              {/* Thumbnails */}
              <PdfPageThumbnailGrid
                pages={pages}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onRotate={handleRotateSingle}
                showControls={true}
              />

              {/* Submit */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcessRotate}
                className="w-full py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                <ArrowClockwise className="w-4 h-4" weight="bold" />
                <span>{isProcessing ? progressMsg || 'Rotating Pages...' : 'Export Rotated PDF'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
