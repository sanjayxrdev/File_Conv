import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfPageThumbnailGrid, PdfPageItem } from '../../components/pdf/PdfPageThumbnailGrid';
import { PageRangeInput } from '../../components/pdf/PageRangeInput';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiSplitPdf, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { parsePageRangeString, parseCustomGroupsString } from '../../utils/pdfPageRangeParser';
import { Scissors, ArrowLeft, Stack, ListNumbers, GridFour, Files } from '@phosphor-icons/react';

type SplitMode = 'range' | 'selected' | 'every_n' | 'custom';

export const SplitPdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [splitMode, setSplitMode] = useState<SplitMode>('range');

  // Mode 1: Range input
  const [rangeInput, setRangeInput] = useState<string>('');
  const [rangeIndices, setRangeIndices] = useState<number[]>([]);
  const [isRangeValid, setIsRangeValid] = useState<boolean>(false);

  // Mode 2: Selected pages as split points
  const [selectedSplitPoints, setSelectedSplitPoints] = useState<string[]>([]);

  // Mode 3: Every N pages
  const [everyN, setEveryN] = useState<number>(1);

  // Mode 4: Custom groups
  const [customGroupsText, setCustomGroupsText] = useState<string>('1-2\n3-5');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [resultJob, setResultJob] = useState<{ downloadUrl: string; filename: string; isZip: boolean } | null>(null);

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
      setRangeInput(`1-${info.total_pages}`);
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleToggleSplitPoint = (id: string) => {
    setSelectedSplitPoints((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleClear = () => {
    setFile(null);
    setPages([]);
    setTotalPages(0);
    setResultJob(null);
    setError(null);
    setSelectedSplitPoints([]);
  };

  // Preview generated output parts before processing
  const getPreviewParts = (): string[] => {
    if (totalPages === 0) return [];

    if (splitMode === 'every_n') {
      const parts: string[] = [];
      const n = Math.max(1, everyN);
      for (let i = 0; i < totalPages; i += n) {
        const end = Math.min(i + n, totalPages);
        parts.push(`Part ${parts.length + 1}: Pages ${i + 1} to ${end}`);
      }
      return parts;
    }

    if (splitMode === 'range') {
      if (!isRangeValid || rangeIndices.length === 0) return ['Invalid or empty page range.'];
      const res = parsePageRangeString(rangeInput, totalPages);
      return [`Output PDF: Pages ${res.indices.map((i) => i + 1).join(', ')}`];
    }

    if (splitMode === 'selected') {
      if (selectedSplitPoints.length === 0) {
        return [`Single PDF with all ${totalPages} pages (Select page thumbnails to mark split points).`];
      }
      const splitIndices = selectedSplitPoints
        .map((id) => parseInt(id.replace('page-', ''), 10))
        .sort((a, b) => a - b);

      const parts: string[] = [];
      let currentStart = 0;

      splitIndices.forEach((splitIdx, i) => {
        if (splitIdx >= currentStart) {
          parts.push(`File ${parts.length + 1}: Pages ${currentStart + 1} to ${splitIdx + 1}`);
          currentStart = splitIdx + 1;
        }
      });

      if (currentStart < totalPages) {
        parts.push(`File ${parts.length + 1}: Pages ${currentStart + 1} to ${totalPages}`);
      }
      return parts;
    }

    if (splitMode === 'custom') {
      const res = parseCustomGroupsString(customGroupsText, totalPages);
      if (!res.valid) return [`Error: ${res.error}`];
      return res.groups.map((g, idx) => `File ${idx + 1}: Pages ${g.map((i) => i + 1).join(', ')}`);
    }

    return [];
  };

  const handleProcessSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgressMsg('Submitting split request...');
    setError(null);

    try {
      let customRangesParam: number[][] | undefined = undefined;

      if (splitMode === 'range') {
        const res = parsePageRangeString(rangeInput, totalPages);
        if (!res.valid) throw new Error(res.error);
        customRangesParam = [res.indices];
      } else if (splitMode === 'selected') {
        const splitIndices = selectedSplitPoints
          .map((id) => parseInt(id.replace('page-', ''), 10))
          .sort((a, b) => a - b);

        const groups: number[][] = [];
        let currentStart = 0;
        splitIndices.forEach((splitIdx) => {
          if (splitIdx >= currentStart) {
            groups.push(Array.from({ length: splitIdx - currentStart + 1 }, (_, i) => currentStart + i));
            currentStart = splitIdx + 1;
          }
        });
        if (currentStart < totalPages) {
          groups.push(Array.from({ length: totalPages - currentStart }, (_, i) => currentStart + i));
        }
        customRangesParam = groups;
      } else if (splitMode === 'custom') {
        const res = parseCustomGroupsString(customGroupsText, totalPages);
        if (!res.valid) throw new Error(res.error);
        customRangesParam = res.groups;
      }

      const init = await apiSplitPdf(
        file,
        splitMode,
        customRangesParam,
        splitMode === 'every_n' ? everyN : undefined
      );

      // Poll job status
      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          setProgressMsg(status.message || 'Processing...');

          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            const isZip = status.target_format === 'zip';
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: isZip ? `split_pages_${file.name}.zip` : status.original_filename,
              isZip: isZip,
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'PDF split failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to start PDF split.');
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
            <Scissors className="w-8 h-8 text-accent-red-text" weight="bold" />
            Split PDF
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Divide a PDF into multiple separate documents by ranges, selected pages, or intervals.
          </p>
        </div>
      </div>

      {/* Main Content */}
      {!file ? (
        <PdfUploader
          label="Upload PDF to Split"
          description="Drag and drop your PDF document here to split into multiple files."
          onFileSelect={handleFileSelect}
          error={error}
        />
      ) : resultJob ? (
        <PdfDownloadResult
          title="PDF Split Completed!"
          message="Your split PDF files are ready to download."
          originalFilename={resultJob.filename}
          downloadUrl={resultJob.downloadUrl}
          onReset={handleClear}
          isZip={resultJob.isZip}
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
              Rendering page thumbnails...
            </div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 space-y-6">
              {/* Split Mode Tabs */}
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-2">
                  Select Split Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => setSplitMode('range')}
                    className={`p-3 rounded-card border flex items-center justify-center gap-2 transition-all ${
                      splitMode === 'range'
                        ? 'bg-ink-primary text-white border-ink-primary font-semibold'
                        : 'bg-surface-card border-surface-border text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    <ListNumbers className="w-4 h-4" weight="bold" />
                    <span>Specific Pages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMode('selected')}
                    className={`p-3 rounded-card border flex items-center justify-center gap-2 transition-all ${
                      splitMode === 'selected'
                        ? 'bg-ink-primary text-white border-ink-primary font-semibold'
                        : 'bg-surface-card border-surface-border text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    <GridFour className="w-4 h-4" weight="bold" />
                    <span>At Selected Pages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMode('every_n')}
                    className={`p-3 rounded-card border flex items-center justify-center gap-2 transition-all ${
                      splitMode === 'every_n'
                        ? 'bg-ink-primary text-white border-ink-primary font-semibold'
                        : 'bg-surface-card border-surface-border text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    <Stack className="w-4 h-4" weight="bold" />
                    <span>Every N Pages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMode('custom')}
                    className={`p-3 rounded-card border flex items-center justify-center gap-2 transition-all ${
                      splitMode === 'custom'
                        ? 'bg-ink-primary text-white border-ink-primary font-semibold'
                        : 'bg-surface-card border-surface-border text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    <Files className="w-4 h-4" weight="bold" />
                    <span>Custom Groups</span>
                  </button>
                </div>
              </div>

              {/* Mode Controls */}
              {splitMode === 'range' && (
                <PageRangeInput
                  totalPages={totalPages}
                  value={rangeInput}
                  onChange={(val, indices, valid) => {
                    setRangeInput(val);
                    setRangeIndices(indices);
                    setIsRangeValid(valid);
                  }}
                  description="Enter page numbers or ranges to extract into a single file (e.g. 1-3, 5, 8-10)."
                />
              )}

              {splitMode === 'selected' && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-muted">
                    Click page thumbnails below to toggle split points. Each selected page marks the end of an output file.
                  </p>
                  <PdfPageThumbnailGrid
                    pages={pages}
                    selectedIds={selectedSplitPoints}
                    onToggleSelect={handleToggleSplitPoint}
                    showControls={false}
                  />
                </div>
              )}

              {splitMode === 'every_n' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-ink-primary">
                    Split Document Every N Pages
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={everyN}
                      onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-32 px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono focus:outline-none focus:border-ink-primary"
                    />
                    <span className="text-xs text-ink-muted">
                      pages per output document
                    </span>
                  </div>
                </div>
              )}

              {splitMode === 'custom' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-ink-primary">
                    Define Custom Output File Groups
                  </label>
                  <textarea
                    rows={4}
                    value={customGroupsText}
                    onChange={(e) => setCustomGroupsText(e.target.value)}
                    placeholder={`File 1: 1-2\nFile 2: 3-5`}
                    className="w-full px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono focus:outline-none focus:border-ink-primary"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Enter page ranges on separate lines or separated by semicolons. Each line generates one output PDF.
                  </p>
                </div>
              )}

              {/* Output Preview List */}
              <div className="bg-surface-raised border border-surface-border rounded-card p-4 space-y-2">
                <h4 className="font-sans font-semibold text-xs text-ink-primary uppercase tracking-wider">
                  Output Files Preview ({getPreviewParts().length} files)
                </h4>
                <ul className="space-y-1 text-xs font-mono text-ink-muted">
                  {getPreviewParts().map((part, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-ink-primary/30" />
                      <span>{part}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcessSplit}
                className="w-full py-3 rounded-card bg-ink-primary text-white text-xs font-semibold hover:bg-[#333333] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                <Scissors className="w-4 h-4" weight="bold" />
                <span>{isProcessing ? progressMsg || 'Splitting PDF...' : 'Split PDF Document'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
