import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiAddPageNumbers, getJobStatus, getDownloadUrl, PdfThumbnailInfo } from '../../services/pdfApi';
import { parsePageRangeString } from '../../utils/pdfPageRangeParser';
import { ArrowLeft, Hash, Eye } from '@phosphor-icons/react';

export const AddPageNumbersPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<PdfThumbnailInfo[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Styling & Placement Options
  const [position, setPosition] = useState<string>('bottom-center');
  const [numFormat, setNumFormat] = useState<string>('Page 1 of N');
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(10);
  const [textColor, setTextColor] = useState<string>('#111111');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [customRangeText, setCustomRangeText] = useState<string>('');

  const [marginTop, setMarginTop] = useState<number>(36);
  const [marginBottom, setMarginBottom] = useState<number>(36);
  const [marginLeft, setMarginLeft] = useState<number>(36);
  const [marginRight, setMarginRight] = useState<number>(36);

  // Processing state
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
      setThumbnails(info.thumbnails);
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setTotalPages(0);
    setThumbnails([]);
    setResultJob(null);
    setError(null);
  };

  const getSampleFormattedText = (pageNum: number = 1) => {
    let numStr = pageNum.toString();
    if (numFormat === 'roman') {
      const val = [10, 9, 5, 4, 1];
      const syb = ['X', 'IX', 'V', 'IV', 'I'];
      numStr = '';
      let n = pageNum;
      let i = 0;
      while (n > 0) {
        for (let j = 0; j < Math.floor(n / val[i]); j++) {
          numStr += syb[i];
          n -= val[i];
        }
        i++;
      }
    }

    let text = numStr;
    if (numFormat === 'Page 1') text = `Page ${numStr}`;
    else if (numFormat === 'Page 1 of N') text = `Page ${numStr} of ${totalPages || 10}`;
    else if (numFormat === '- 1 -') text = `- ${numStr} -`;

    if (prefix) text = `${prefix} ${text}`;
    if (suffix) text = `${text} ${suffix}`;

    return text;
  };

  const handleProcessAddNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgressMsg('Adding page numbers...');
    setError(null);

    try {
      let targetIndices: number[] | undefined = undefined;
      if (pageRangeMode === 'custom' && customRangeText.trim()) {
        const res = parsePageRangeString(customRangeText, totalPages);
        if (!res.valid) throw new Error(res.error);
        targetIndices = res.indices;
      }

      const options = {
        position,
        num_format: numFormat,
        prefix,
        suffix,
        font_size: fontSize,
        text_color: textColor,
        start_number: startNumber,
        skip_first_page: skipFirstPage,
        target_page_indices: targetIndices,
        margin_top: marginTop,
        margin_bottom: marginBottom,
        margin_left: marginLeft,
        margin_right: marginRight,
      };

      const init = await apiAddPageNumbers(file, options);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          setProgressMsg(status.message || 'Processing...');

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
            setError(status.error || 'Adding page numbers failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to add page numbers.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-border pb-4">
        <button
          onClick={() => navigate('/#tools-directory')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
        </button>
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal flex items-center gap-2">
            <Hash className="w-8 h-8 text-accent-red-text" weight="bold" />
            Add Page Numbers
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Automatically add page numbers with custom placement, formatting, margins, and Roman numerals.
          </p>
        </div>
      </div>

      {!file ? (
        <PdfUploader
          label="Upload PDF to Add Page Numbers"
          description="Drag and drop your PDF here to customize page numbers."
          onFileSelect={handleFileSelect}
          error={error}
        />
      ) : resultJob ? (
        <PdfDownloadResult
          title="Page Numbers Added!"
          message="Your numbered PDF is ready for download."
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
              Loading document options...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Controls */}
              <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-card-lg p-6 space-y-6">
                <h3 className="font-serif text-xl text-ink-primary font-normal border-b border-surface-border pb-3">
                  Numbering Customization
                </h3>

                {/* Position Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-ink-primary">
                    Position on Page
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'top-left', label: 'Top Left' },
                      { id: 'top-center', label: 'Top Center' },
                      { id: 'top-right', label: 'Top Right' },
                      { id: 'bottom-left', label: 'Bottom Left' },
                      { id: 'bottom-center', label: 'Bottom Center' },
                      { id: 'bottom-right', label: 'Bottom Right' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPosition(pos.id)}
                        className={`p-2.5 rounded-card border text-center font-medium transition-all ${
                          position === pos.id
                            ? 'bg-ink-primary text-surface-canvas border-ink-primary'
                            : 'bg-surface-raised border-surface-border text-ink-muted hover:text-ink-primary'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-primary">Format</label>
                    <select
                      value={numFormat}
                      onChange={(e) => setNumFormat(e.target.value)}
                      className="w-full px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs focus:outline-none focus:border-ink-primary"
                    >
                      <option value="1">1 (Numbers only)</option>
                      <option value="Page 1">Page 1</option>
                      <option value="Page 1 of N">Page 1 of N</option>
                      <option value="- 1 -">- 1 -</option>
                      <option value="roman">Roman Numerals (I, II, III)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-primary">Font Size & Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={6}
                        max={36}
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 10)}
                        className="w-20 px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono"
                      />
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-9 p-1 rounded-card border border-surface-border bg-surface-card cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Prefix & Suffix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-primary">Custom Prefix</label>
                    <input
                      type="text"
                      placeholder="e.g. Doc #"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      className="w-full px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-primary">Custom Suffix</label>
                    <input
                      type="text"
                      placeholder="e.g. - Final"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      className="w-full px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Start Number & Cover Page Skip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-primary">Start Numbering From</label>
                    <input
                      type="number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="skipFirst"
                      checked={skipFirstPage}
                      onChange={(e) => setSkipFirstPage(e.target.checked)}
                      className="rounded border-surface-border text-ink-primary focus:ring-ink-primary"
                    />
                    <label htmlFor="skipFirst" className="text-xs font-semibold text-ink-primary cursor-pointer">
                      Skip first page (Cover Page)
                    </label>
                  </div>
                </div>

                {/* Margins */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-ink-primary">
                    Margins (pts)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-ink-muted">Top</span>
                      <input
                        type="number"
                        value={marginTop}
                        onChange={(e) => setMarginTop(parseFloat(e.target.value) || 36)}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-muted">Bottom</span>
                      <input
                        type="number"
                        value={marginBottom}
                        onChange={(e) => setMarginBottom(parseFloat(e.target.value) || 36)}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-muted">Left</span>
                      <input
                        type="number"
                        value={marginLeft}
                        onChange={(e) => setMarginLeft(parseFloat(e.target.value) || 36)}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-muted">Right</span>
                      <input
                        type="number"
                        value={marginRight}
                        onChange={(e) => setMarginRight(parseFloat(e.target.value) || 36)}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcessAddNumbers}
                  className="w-full py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  <Hash className="w-4 h-4" weight="bold" />
                  <span>{isProcessing ? progressMsg || 'Adding Page Numbers...' : 'Add Page Numbers to PDF'}</span>
                </button>
              </div>

              {/* Live Preview Panel */}
              <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 space-y-4">
                <h3 className="font-serif text-lg text-ink-primary font-normal flex items-center gap-2 border-b border-surface-border pb-3">
                  <Eye className="w-5 h-5 text-ink-primary" weight="bold" />
                  Live Preview
                </h3>

                <div className="relative w-full aspect-[3/4] bg-[#F4F3EF] rounded border border-surface-border overflow-hidden flex items-center justify-center">
                  {thumbnails[0] ? (
                    <img
                      src={thumbnails[0].data_url}
                      alt="Preview page"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-ink-faint font-mono text-xs">PDF Page Preview</div>
                  )}

                  {/* Simulated Page Number Overlay */}
                  <div
                    className="absolute font-mono pointer-events-none transition-all px-2 py-1 rounded"
                    style={{
                      top: position.includes('top') ? `${marginTop / 3}px` : undefined,
                      bottom: position.includes('bottom') ? `${marginBottom / 3}px` : undefined,
                      left: position.includes('left') ? `${marginLeft / 3}px` : undefined,
                      right: position.includes('right') ? `${marginRight / 3}px` : undefined,
                      transform: position.includes('center') ? 'translateX(-50%)' : undefined,
                      ...(position.includes('center') ? { left: '50%' } : {}),
                      fontSize: `${Math.max(10, fontSize)}px`,
                      color: textColor,
                      fontWeight: 600,
                    }}
                  >
                    {getSampleFormattedText(startNumber)}
                  </div>
                </div>

                <div className="p-3 bg-surface-raised border border-surface-border rounded-card text-xs text-ink-muted space-y-1 font-mono">
                  <div>Sample Text: <span className="font-bold text-ink-primary">{getSampleFormattedText(startNumber)}</span></div>
                  <div>Position: <span className="text-ink-primary">{position}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
