import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfPageThumbnailGrid, PdfPageItem } from '../../components/pdf/PdfPageThumbnailGrid';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiExportPdfPagesAsImages, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { ArrowLeft, Image as ImageIcon, DownloadSimple, SlidersHorizontal, Sparkle } from '@phosphor-icons/react';

export const ExportPdfImagesPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [targetFormat, setTargetFormat] = useState<string>('jpg');
  const [dpi, setDpi] = useState<number>(150);

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
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF pages.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleProcessExport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgressMsg('Rendering PDF pages into high-res images...');

    try {
      const initResp = await apiExportPdfPagesAsImages(file, targetFormat, dpi);
      const jobId = initResp.job_id;

      const timer = setInterval(async () => {
        try {
          const statusResp = await getJobStatus(jobId);
          if (statusResp.message) setProgressMsg(statusResp.message);

          if (statusResp.status === 'completed') {
            clearInterval(timer);
            setIsProcessing(false);
            const downloadUrl = getDownloadUrl(jobId);
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            setResultJob({
              downloadUrl,
              filename: `${baseName}_all_pages_images.zip`,
            });
          } else if (statusResp.status === 'failed') {
            clearInterval(timer);
            setIsProcessing(false);
            setError(statusResp.error || 'Failed to export PDF pages to images.');
          }
        } catch (e: any) {
          clearInterval(timer);
          setIsProcessing(false);
          setError(e.message || 'Error checking export progress.');
        }
      }, 500);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Could not start page export.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <button
          onClick={() => navigate('/#tools-directory')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
          <span>Back to Tools</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-card bg-accent-blue text-accent-blue-text font-bold text-[10px] uppercase tracking-wider">
            PDF Page Image Extractor
          </span>
        </div>
      </div>

      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight">
          Export PDF Pages to Images (.ZIP)
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Preview all pages in your PDF document and extract every single page as an individual image arranged sequentially by page number.
        </p>
      </div>

      {/* Main Upload / Editor Area */}
      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          label="Select PDF Document to Convert Pages"
          description="Upload any PDF to view all page thumbnails and extract every page as JPG, PNG, or WebP"
          isLoading={isLoadingFile}
        />
      ) : (
        <div className="space-y-6">
          {resultJob ? (
            <PdfDownloadResult
              downloadUrl={resultJob.downloadUrl}
              downloadFilename={resultJob.filename}
              onReset={() => {
                setFile(null);
                setPages([]);
                setResultJob(null);
              }}
              title="All PDF Pages Exported Successfully!"
              description={`Extracted all ${totalPages} pages into a single ZIP archive.`}
              isZip={true}
            />
          ) : (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="p-4 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                    <ImageIcon className="w-4 h-4 text-accent-blue-text" weight="bold" />
                    <span>{file.name} ({totalPages} pages)</span>
                  </div>

                  <button
                    onClick={() => {
                      setFile(null);
                      setPages([]);
                    }}
                    className="text-xs font-medium text-accent-red-text hover:underline"
                  >
                    Change File
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Target Format Selector */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold uppercase tracking-wider text-[10px] text-ink-muted">
                      Target Image Extension
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { ext: 'jpg', label: 'JPG / JPEG' },
                        { ext: 'png', label: 'PNG Image' },
                        { ext: 'webp', label: 'WebP Image' },
                      ].map((fmt) => (
                        <button
                          key={fmt.ext}
                          type="button"
                          onClick={() => setTargetFormat(fmt.ext)}
                          className={`py-2 px-3 rounded-card border font-semibold transition-all ${
                            targetFormat === fmt.ext
                              ? 'bg-ink-primary text-surface-canvas border-ink-primary'
                              : 'bg-surface-raised border-surface-border text-ink-muted hover:text-ink-primary'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution Selector */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold uppercase tracking-wider text-[10px] text-ink-muted">
                      Quality / DPI Resolution
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { val: 150, label: '150 DPI (Standard)' },
                        { val: 300, label: '300 DPI (High-Res)' },
                        { val: 72, label: '72 DPI (Web)' },
                      ].map((res) => (
                        <button
                          key={res.val}
                          type="button"
                          onClick={() => setDpi(res.val)}
                          className={`py-2 px-2 rounded-card border text-[11px] font-semibold transition-all ${
                            dpi === res.val
                              ? 'bg-ink-primary text-surface-canvas border-ink-primary'
                              : 'bg-surface-raised border-surface-border text-ink-muted hover:text-ink-primary'
                          }`}
                        >
                          {res.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Grid Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
                  <span className="uppercase tracking-wider text-[11px]">
                    Page Preview Grid ({totalPages} Pages)
                  </span>
                  <span>Will be saved as page_01.{targetFormat}, page_02.{targetFormat}...</span>
                </div>

                <PdfPageThumbnailGrid
                  pages={pages}
                  selectable={false}
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing || totalPages === 0}
                onClick={handleProcessExport}
                className="w-full py-3.5 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-surface-canvas/30 border-t-surface-canvas rounded-full animate-spin" />
                ) : (
                  <>
                    <DownloadSimple className="w-4 h-4" weight="bold" />
                    <span>Convert & Download All {totalPages} Pages as .{targetFormat.toUpperCase()} Images (.ZIP)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-card bg-accent-red border border-accent-red-text/20 text-accent-red-text text-xs text-center font-medium">
          {error}
        </div>
      )}
    </div>
  );
};
