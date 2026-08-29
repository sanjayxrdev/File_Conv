import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { apiComparePdfs, CompareResultResponse } from '../../services/pdfApi';
import {
  ArrowLeft,
  GitDiff,
  Columns,
  SquareHalf,
  Eye,
  CaretLeft,
  CaretRight,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react';

type ViewMode = 'side-by-side' | 'overlay' | 'difference';

export const ComparePdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareResults, setCompareResults] = useState<CompareResultResponse | null>(null);

  // View settings
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50);
  const [activeOverlayDoc, setActiveOverlayDoc] = useState<'A' | 'B'>('A');

  const handleStartComparison = async () => {
    if (!fileA || !fileB) return;
    setIsComparing(true);
    setError(null);

    try {
      const res = await apiComparePdfs(fileA, fileB);
      setCompareResults(res);
      setCurrentPageIndex(0);
    } catch (e: any) {
      setError(e.message || 'Failed to compare PDF documents.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleClear = () => {
    setFileA(null);
    setFileB(null);
    setCompareResults(null);
    setError(null);
    setCurrentPageIndex(0);
  };

  const currentPage = compareResults?.pages[currentPageIndex];
  const totalPages = compareResults?.pages.length || 0;

  const navigateDiff = (direction: 'next' | 'prev') => {
    if (!compareResults) return;
    const changedIndices = compareResults.pages
      .map((p, idx) => (p.status !== 'identical' ? idx : -1))
      .filter((idx) => idx !== -1);

    if (changedIndices.length === 0) return;

    if (direction === 'next') {
      const nextIdx = changedIndices.find((idx) => idx > currentPageIndex);
      if (nextIdx !== undefined) setCurrentPageIndex(nextIdx);
      else setCurrentPageIndex(changedIndices[0]);
    } else {
      const prevIdx = [...changedIndices].reverse().find((idx) => idx < currentPageIndex);
      if (prevIdx !== undefined) setCurrentPageIndex(prevIdx);
      else setCurrentPageIndex(changedIndices[changedIndices.length - 1]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
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
            <GitDiff className="w-8 h-8 text-accent-blue-text" weight="bold" />
            Compare PDFs
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Compare two PDF documents side-by-side, overlay, or visual difference modes with detailed stats.
          </p>
        </div>
      </div>

      {!compareResults ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-primary">PDF A (Original Document)</label>
              <PdfUploader
                label="Upload PDF A"
                onFileSelect={(f) => setFileA(f)}
                selectedFile={fileA}
                onClear={() => setFileA(null)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-primary">PDF B (Modified Document)</label>
              <PdfUploader
                label="Upload PDF B"
                onFileSelect={(f) => setFileB(f)}
                selectedFile={fileB}
                onClear={() => setFileB(null)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-card flex items-start gap-2 text-xs text-red-700 font-sans">
              <WarningCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" weight="bold" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={!fileA || !fileB || isComparing}
            onClick={handleStartComparison}
            className="w-full py-3.5 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          >
            <GitDiff className="w-4 h-4" weight="bold" />
            <span>{isComparing ? 'Comparing Documents...' : 'Compare PDF Documents'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Panel */}
          <div className="bg-surface-card border border-surface-border rounded-card-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-3">
              <div>
                <h3 className="font-serif text-xl text-ink-primary font-normal">Comparison Report Summary</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Comparing <span className="font-semibold text-ink-primary">{fileA?.name}</span> vs{' '}
                  <span className="font-semibold text-ink-primary">{fileB?.name}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-card bg-surface-raised border border-surface-border text-ink-primary text-xs font-semibold hover:bg-surface-border transition-colors"
              >
                Compare New Files
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-surface-raised rounded-card border border-surface-border">
                <span className="block text-2xl font-serif font-normal text-ink-primary">
                  {compareResults.summary.total_pages_compared}
                </span>
                <span className="text-[11px] font-mono text-ink-muted">Pages Compared</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-card border border-amber-200">
                <span className="block text-2xl font-serif font-normal text-amber-900">
                  {compareResults.summary.changed_pages}
                </span>
                <span className="text-[11px] font-mono text-amber-700">Changed Pages</span>
              </div>

              <div className="p-3 bg-green-50 rounded-card border border-green-200">
                <span className="block text-2xl font-serif font-normal text-green-900">
                  {compareResults.summary.added_pages}
                </span>
                <span className="text-[11px] font-mono text-green-700">Added Pages</span>
              </div>

              <div className="p-3 bg-red-50 rounded-card border border-red-200">
                <span className="block text-2xl font-serif font-normal text-red-900">
                  {compareResults.summary.removed_pages}
                </span>
                <span className="text-[11px] font-mono text-red-700">Removed Pages</span>
              </div>

              <div className="p-3 bg-accent-blue/10 rounded-card border border-accent-blue/20">
                <span className="block text-2xl font-serif font-normal text-accent-blue-text">
                  {compareResults.summary.total_changes}
                </span>
                <span className="text-[11px] font-mono text-accent-blue-text">Total Changes</span>
              </div>
            </div>

            {/* Changed Pages Direct Jump List */}
            {compareResults.pages.some((p) => p.status !== 'identical') && (
              <div className="pt-3 border-t border-surface-border space-y-2 text-left">
                <span className="text-xs font-semibold text-ink-primary flex items-center gap-1.5">
                  <GitDiff className="w-3.5 h-3.5 text-accent-blue-text" weight="bold" />
                  <span>Exact Changed Pages (Click to Jump Directly):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {compareResults.pages
                    .filter((p) => p.status !== 'identical')
                    .map((p) => {
                      const isCurrent = p.page_number - 1 === currentPageIndex;
                      let badgeColor = 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200';
                      if (p.status === 'completely_different') {
                        badgeColor = 'bg-red-100 border-red-300 text-red-900 hover:bg-red-200';
                      } else if (p.status === 'added') {
                        badgeColor = 'bg-green-100 border-green-300 text-green-900 hover:bg-green-200';
                      } else if (p.status === 'removed') {
                        badgeColor = 'bg-red-100 border-red-300 text-red-900 hover:bg-red-200';
                      }

                      return (
                        <button
                          key={p.page_number}
                          type="button"
                          onClick={() => setCurrentPageIndex(p.page_number - 1)}
                          className={`px-2.5 py-1 rounded-card border text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${badgeColor} ${
                            isCurrent ? 'ring-2 ring-ink-primary shadow-xs font-bold' : ''
                          }`}
                        >
                          <span>Page {p.page_number}</span>
                          <span className="text-[10px] uppercase opacity-80">
                            ({p.status === 'completely_different' ? 'Completely Different' : p.status})
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Viewing Mode Tabs & Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card border border-surface-border rounded-card p-3 font-sans text-xs">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 rounded-card flex items-center gap-1.5 font-semibold transition-all ${viewMode === 'side-by-side'
                  ? 'bg-ink-primary text-surface-canvas'
                  : 'bg-surface-raised text-ink-muted hover:text-ink-primary'
                  }`}
              >
                <Columns className="w-3.5 h-3.5" weight="bold" />
                <span>Side-by-Side</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('overlay')}
                className={`px-3 py-1.5 rounded-card flex items-center gap-1.5 font-semibold transition-all ${viewMode === 'overlay'
                  ? 'bg-ink-primary text-surface-canvas'
                  : 'bg-surface-raised text-ink-muted hover:text-ink-primary'
                  }`}
              >
                <SquareHalf className="w-3.5 h-3.5" weight="bold" />
                <span>Overlay</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('difference')}
                className={`px-3 py-1.5 rounded-card flex items-center gap-1.5 font-semibold transition-all ${viewMode === 'difference'
                  ? 'bg-ink-primary text-surface-canvas'
                  : 'bg-surface-raised text-ink-muted hover:text-ink-primary'
                  }`}
              >
                <Eye className="w-3.5 h-3.5" weight="bold" />
                <span>Difference</span>
              </button>
            </div>

            {/* Navigation & Zoom */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigateDiff('prev')}
                className="px-2.5 py-1 rounded bg-surface-raised border border-surface-border text-ink-primary hover:bg-surface-border font-medium flex items-center gap-1"
                title="Jump to Previous Difference"
              >
                <CaretLeft className="w-3.5 h-3.5" weight="bold" />
                <span>Prev Change</span>
              </button>

              <span className="font-mono text-ink-muted">
                Page {currentPageIndex + 1} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => navigateDiff('next')}
                className="px-2.5 py-1 rounded bg-surface-raised border border-surface-border text-ink-primary hover:bg-surface-border font-medium flex items-center gap-1"
                title="Jump to Next Difference"
              >
                <span>Next Change</span>
                <CaretRight className="w-3.5 h-3.5" weight="bold" />
              </button>

              <div className="flex items-center gap-1 border-l border-surface-border pl-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                  className="p-1 text-ink-muted hover:text-ink-primary"
                >
                  <MagnifyingGlassMinus className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px]">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                  className="p-1 text-ink-muted hover:text-ink-primary"
                >
                  <MagnifyingGlassPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Page Change Banner */}
          {currentPage && (
            <div
              className={`p-3 rounded-card border flex items-center justify-between text-xs font-sans ${currentPage.status === 'identical'
                ? 'bg-green-50 border-green-200 text-green-800'
                : currentPage.status === 'completely_different'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
            >
              <div className="flex items-center gap-2">
                {currentPage.status === 'identical' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" weight="bold" />
                ) : (
                  <WarningCircle className="w-4 h-4 text-red-600 shrink-0" weight="bold" />
                )}
                <span className="font-semibold capitalize">
                  Status: {currentPage.status === 'completely_different' ? 'Completely Different' : currentPage.status}
                </span>
                <span>&middot;</span>
                <span>{currentPage.diff_summary}</span>
              </div>
            </div>
          )}

          {/* View Modes Rendering */}
          {currentPage && (
            <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 min-h-[400px]">
              {/* Mode 1: Side by Side */}
              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PDF A */}
                  <div className="space-y-2 text-center">
                    <h4 className="font-sans font-semibold text-xs text-ink-primary uppercase tracking-wider">
                      PDF A — Page {currentPageIndex + 1}
                    </h4>
                    <div className="bg-[#F4F3EF] border border-surface-border rounded p-2 flex items-center justify-center overflow-auto max-h-[500px]">
                      {currentPage.thumb_a ? (
                        <img
                          src={currentPage.thumb_a}
                          alt="PDF A Page"
                          style={{ width: `${zoomLevel}%` }}
                          className="object-contain shadow-xs"
                        />
                      ) : (
                        <span className="text-ink-faint font-mono text-xs p-8">No Page in PDF A</span>
                      )}
                    </div>
                  </div>

                  {/* PDF B */}
                  <div className="space-y-2 text-center">
                    <h4 className="font-sans font-semibold text-xs text-ink-primary uppercase tracking-wider">
                      PDF B — Page {currentPageIndex + 1}
                    </h4>
                    <div className="bg-[#F4F3EF] border border-surface-border rounded p-2 flex items-center justify-center overflow-auto max-h-[500px]">
                      {currentPage.thumb_b ? (
                        <img
                          src={currentPage.thumb_b}
                          alt="PDF B Page"
                          style={{ width: `${zoomLevel}%` }}
                          className="object-contain shadow-xs"
                        />
                      ) : (
                        <span className="text-ink-faint font-mono text-xs p-8">No Page in PDF B</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 2: Overlay */}
              {viewMode === 'overlay' && (
                <div className="space-y-4 text-center max-w-xl mx-auto">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span>Opacity Slider ({overlayOpacity}%):</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseInt(e.target.value, 10))}
                      className="w-48"
                    />
                  </div>

                  <div className="relative bg-[#F4F3EF] border border-surface-border rounded p-2 flex items-center justify-center overflow-hidden min-h-[450px]">
                    {currentPage.thumb_a && (
                      <img
                        src={currentPage.thumb_a}
                        alt="PDF A Base"
                        style={{ width: `${zoomLevel}%` }}
                        className="object-contain shadow-xs"
                      />
                    )}
                    {currentPage.thumb_b && (
                      <img
                        src={currentPage.thumb_b}
                        alt="PDF B Overlay"
                        style={{
                          width: `${zoomLevel}%`,
                          opacity: overlayOpacity / 100.0,
                        }}
                        className="absolute object-contain pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Mode 3: Difference View */}
              {viewMode === 'difference' && (
                <div className="space-y-4 text-center max-w-xl mx-auto">
                  <h4 className="font-sans font-semibold text-xs text-ink-primary uppercase tracking-wider">
                    Highlighted Difference Heatmap — Page {currentPageIndex + 1}
                  </h4>

                  <div className="bg-[#F4F3EF] border border-surface-border rounded p-2 flex items-center justify-center overflow-auto max-h-[500px]">
                    {currentPage.diff_thumb ? (
                      <img
                        src={currentPage.diff_thumb}
                        alt="Visual Difference"
                        style={{ width: `${zoomLevel}%` }}
                        className="object-contain shadow-xs"
                      />
                    ) : (
                      <div className="p-12 text-ink-muted font-mono text-xs">
                        No visual differences detected on Page {currentPageIndex + 1}.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
