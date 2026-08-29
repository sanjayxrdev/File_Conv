import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Scan,
  FileText,
  Table as TableIcon,
  Code,
  FileCode,
  Globe,
  Copy,
  DownloadSimple,
  Check,
  ArrowLeft,
  UploadSimple,
  Sparkle,
  Cpu,
  Eye,
  Rows,
  WarningCircle,
  Clock,
  BookOpen,
  ArrowCounterClockwise
} from '@phosphor-icons/react';
import gsap from 'gsap';
import { analyzeDocumentOcr } from '../services/api';
import { OcrAnalysisResult, OcrTableData } from '../types';
import { useHistory } from '../context/HistoryContext';

const OCR_CACHE_KEY = 'fileconv_cached_ocr';
type ActiveTab = 'markdown' | 'tables' | 'text' | 'ast' | 'html';

export const OcrStudio: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnHash = (location.state as any)?.returnHash || '#tools-directory';
  const { addHistoryItem } = useHistory();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('Initializing Docling...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrAnalysisResult | null>(() => {
    try {
      const cached = sessionStorage.getItem(OCR_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('markdown');
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRawMarkdown, setIsRawMarkdown] = useState(false);
  const [isRawHtml, setIsRawHtml] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current!.children, {
        y: 16,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const handleDownloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcessFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    // Simulated progress stage messages while Docling runs
    const stages = [
      'Reading document structure...',
      'Running Docling layout recognition AI...',
      'Extracting table grids & reading order...',
      'Synthesizing Markdown & JSON AST...',
    ];
    let stageIdx = 0;
    const interval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setAnalysisStage(stages[stageIdx]);
    }, 1800);

    try {
      const data = await analyzeDocumentOcr(selectedFile);
      setResult(data);
      sessionStorage.setItem(OCR_CACHE_KEY, JSON.stringify(data));

      if (data.tables && data.tables.length > 0) {
        setSelectedTableIndex(0);
      }

      // Record in session history
      addHistoryItem({
        job_id: `ocr_${Date.now()}`,
        original_filename: selectedFile.name,
        source_format: selectedFile.name.split('.').pop() || 'pdf',
        target_format: 'md (ocr)',
        status: 'completed',
        output_size_bytes: data.markdown ? data.markdown.length : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Docling document analysis failed.');
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem(OCR_CACHE_KEY);
    setFile(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    setActiveTab('markdown');
  };

  return (
    <div className="min-h-screen pb-24 text-ink-primary font-sans">
      {/* Breadcrumb & Hero */}
      <div ref={heroRef} className="max-w-5xl mx-auto px-4 pt-8">
        <button
          onClick={() => navigate(`/${returnHash}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface-raised border border-surface-border text-xs font-medium text-ink-muted hover:text-ink-primary hover:bg-surface-border/50 transition-all mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
          <span>All Converters</span>
        </button>

        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-card-lg bg-purple-100 text-purple-800 flex items-center justify-center shadow-sm">
              <Scan className="w-7 h-7" weight="bold" />
            </div>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl text-ink-primary">
            Docling AI Document Intelligence
          </h1>

          <p className="text-ink-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            State-of-the-art document parsing and layout recognition powered by <strong>IBM Docling</strong>. Extract clean structured Markdown, spreadsheet tables, plain text, and AST from scanned PDFs, images, and documents.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
              <span>Layout Vision Model</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-ink-secondary border border-surface-border text-xs font-medium">
              <TableIcon className="w-3.5 h-3.5" weight="bold" />
              <span>Table & Matrix Extraction</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-ink-secondary border border-surface-border text-xs font-medium">
              <FileCode className="w-3.5 h-3.5" weight="bold" />
              <span>Docling JSON AST</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="max-w-5xl mx-auto px-4 pt-10">
        {!result && !isAnalyzing && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-card-lg p-12 text-center transition-all duration-200 border-2 border-dashed ${
                isDragOver
                  ? 'border-purple-500 bg-surface-raised'
                  : 'border-surface-border hover:border-purple-500/60 bg-surface-card'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.docx,.pptx,.xlsx,.html,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="space-y-4">
                <div className="w-14 h-14 mx-auto rounded-card bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                  <UploadSimple className="w-7 h-7" weight="bold" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-ink-primary mb-1">
                    Drop document or image here
                  </h3>
                  <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                    Upload any PDF, scanned document, screenshot, or spreadsheet to analyze its structure, tables, and text.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-6 py-2.5 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition-all"
                  >
                    Browse Files
                  </button>
                </div>

                <div className="text-[11px] font-mono text-ink-muted">
                  Supported: PDF, PNG, JPG, WEBP, DOCX, PPTX, XLSX
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-card bg-accent-red/10 border border-accent-red-text/20 text-accent-red-text text-xs font-medium flex items-center gap-3">
                <WarningCircle className="w-5 h-5 shrink-0" weight="bold" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Analyzing Progress State */}
        {isAnalyzing && (
          <div className="max-w-xl mx-auto p-10 rounded-card-lg bg-surface-card border border-surface-border text-center space-y-6 shadow-sm">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
              <Cpu className="w-7 h-7 text-purple-700 animate-pulse" weight="bold" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl text-ink-primary">Docling Document Intelligence</h3>
              <p className="text-sm text-purple-700 font-medium animate-pulse">{analysisStage}</p>
              <p className="text-xs text-ink-muted">
                Parsing layout, headers, paragraphs, formulas, and tabular structures.
              </p>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {result && (
          <div ref={resultsRef} className="space-y-6">
            {/* Header Document Summary & Quick Actions */}
            <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-card bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-primary text-base truncate max-w-md">
                      {result.filename}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
                      <span>Docling Intelligence Analysis</span>
                      <span className="text-ink-faint">&middot;</span>
                      <span className="text-emerald-700 font-medium">Ready</span>
                    </div>
                  </div>
                </div>

                {/* Top Action Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      handleDownloadBlob(
                        result.markdown,
                        `${result.filename.replace(/\.[^/.]+$/, '')}.md`,
                        'text/markdown'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface-raised border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-surface-border/50 transition-all"
                  >
                    <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
                    <span>Download .MD</span>
                  </button>

                  <button
                    onClick={() =>
                      handleDownloadBlob(
                        JSON.stringify(result.ast, null, 2),
                        `${result.filename.replace(/\.[^/.]+$/, '')}_ast.json`,
                        'application/json'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface-raised border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-surface-border/50 transition-all"
                  >
                    <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
                    <span>Download AST (.JSON)</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition-all"
                  >
                    <ArrowCounterClockwise className="w-3.5 h-3.5" weight="bold" />
                    <span>Analyze Another File</span>
                  </button>
                </div>
              </div>

              {/* Document Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
                  <span className="text-ink-muted block text-[11px]">Pages / Views</span>
                  <span className="font-semibold text-ink-primary text-sm font-mono">
                    {result.metadata.num_pages}
                  </span>
                </div>
                <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
                  <span className="text-ink-muted block text-[11px]">Tables Detected</span>
                  <span className="font-semibold text-purple-700 text-sm font-mono">
                    {result.metadata.num_tables}
                  </span>
                </div>
                <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
                  <span className="text-ink-muted block text-[11px]">Headings Found</span>
                  <span className="font-semibold text-ink-primary text-sm font-mono">
                    {result.metadata.num_headings}
                  </span>
                </div>
                <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
                  <span className="text-ink-muted block text-[11px]">Word Count</span>
                  <span className="font-semibold text-ink-primary text-sm font-mono">
                    {result.metadata.word_count.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
                  <span className="text-ink-muted block text-[11px]">Est. Reading Time</span>
                  <span className="font-semibold text-ink-primary text-sm font-mono">
                    ~{result.metadata.reading_time_mins} min
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-xs font-semibold transition-all ${
                    activeTab === 'markdown'
                      ? 'bg-ink-primary text-surface-canvas shadow-sm'
                      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
                  }`}
                >
                  <FileText className="w-4 h-4" weight="bold" />
                  <span>Structured Markdown</span>
                </button>

                <button
                  onClick={() => setActiveTab('tables')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-xs font-semibold transition-all ${
                    activeTab === 'tables'
                      ? 'bg-ink-primary text-surface-canvas shadow-sm'
                      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
                  }`}
                >
                  <TableIcon className="w-4 h-4" weight="bold" />
                  <span>Extracted Tables ({result.tables.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('text')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-xs font-semibold transition-all ${
                    activeTab === 'text'
                      ? 'bg-ink-primary text-surface-canvas shadow-sm'
                      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
                  }`}
                >
                  <Rows className="w-4 h-4" weight="bold" />
                  <span>Plain Text OCR</span>
                </button>

                <button
                  onClick={() => setActiveTab('ast')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-xs font-semibold transition-all ${
                    activeTab === 'ast'
                      ? 'bg-ink-primary text-surface-canvas shadow-sm'
                      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
                  }`}
                >
                  <Code className="w-4 h-4" weight="bold" />
                  <span>Docling AST</span>
                </button>

                <button
                  onClick={() => setActiveTab('html')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-xs font-semibold transition-all ${
                    activeTab === 'html'
                      ? 'bg-ink-primary text-surface-canvas shadow-sm'
                      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
                  }`}
                >
                  <Globe className="w-4 h-4" weight="bold" />
                  <span>Semantic HTML</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: MARKDOWN */}
            {activeTab === 'markdown' && (
              <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span className="font-semibold text-ink-primary">Document Markdown Output</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRawMarkdown(!isRawMarkdown)}
                      className="px-2.5 py-1 rounded bg-surface-raised border border-surface-border text-[11px] font-medium text-ink-secondary hover:text-ink-primary"
                    >
                      {isRawMarkdown ? 'View Formatted' : 'View Raw Markdown'}
                    </button>
                    <button
                      onClick={() => handleCopy(result.markdown, 'markdown')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                    >
                      {copiedKey === 'markdown' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" weight="bold" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isRawMarkdown ? (
                  <pre className="p-4 rounded-card bg-surface-raised border border-surface-border text-xs font-mono text-ink-primary whitespace-pre-wrap overflow-x-auto max-h-[600px] leading-relaxed">
                    {result.markdown}
                  </pre>
                ) : (
                  <div className="prose prose-sm max-w-none text-ink-secondary leading-relaxed p-4 bg-surface-raised rounded-card border border-surface-border max-h-[600px] overflow-y-auto whitespace-pre-wrap font-sans">
                    {result.markdown}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: TABLES */}
            {activeTab === 'tables' && (
              <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-6">
                {result.tables.length === 0 ? (
                  <div className="text-center py-12 text-ink-muted text-sm">
                    <TableIcon className="w-8 h-8 mx-auto mb-2 opacity-40" weight="bold" />
                    <p>No structured tables detected in this document.</p>
                  </div>
                ) : (
                  <>
                    {/* Table Selectors */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3">
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {result.tables.map((tbl, idx) => (
                          <button
                            key={tbl.index}
                            onClick={() => setSelectedTableIndex(idx)}
                            className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all ${
                              selectedTableIndex === idx
                                ? 'bg-purple-100 text-purple-900 border border-purple-300 font-semibold'
                                : 'bg-surface-raised border border-surface-border text-ink-muted hover:text-ink-primary'
                            }`}
                          >
                            <span>
                              Table {tbl.index} ({tbl.num_rows} × {tbl.num_cols})
                            </span>
                          </button>
                        ))}
                      </div>

                      {result.tables[selectedTableIndex] && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleCopy(
                                result.tables[selectedTableIndex].csv,
                                `csv-${selectedTableIndex}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                          >
                            {copiedKey === `csv-${selectedTableIndex}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" weight="bold" />
                            )}
                            <span>Copy CSV</span>
                          </button>

                          <button
                            onClick={() =>
                              handleDownloadBlob(
                                result.tables[selectedTableIndex].csv,
                                `${result.filename.replace(/\.[^/.]+$/, '')}_table_${selectedTableIndex + 1}.csv`,
                                'text/csv'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100"
                          >
                            <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
                            <span>Download CSV</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Table View Grid */}
                    {result.tables[selectedTableIndex] && (
                      <div className="overflow-x-auto rounded-card border border-surface-border max-h-[500px]">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead>
                            <tr className="bg-surface-raised border-b border-surface-border text-ink-primary">
                              {result.tables[selectedTableIndex].headers.map((h, i) => (
                                <th key={i} className="p-3 font-semibold border-r border-surface-border/50 last:border-r-0">
                                  {h || `Column ${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-border/50">
                            {result.tables[selectedTableIndex].rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-surface-raised/40 transition-colors">
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="p-3 text-ink-secondary border-r border-surface-border/30 last:border-r-0 font-mono text-[11px]">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: PLAIN TEXT */}
            {activeTab === 'text' && (
              <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span className="font-semibold text-ink-primary">Extracted Clean Text</span>
                    <span className="text-ink-faint">&middot;</span>
                    <span>{result.metadata.word_count} words</span>
                  </div>

                  <button
                    onClick={() => handleCopy(result.text, 'text')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                  >
                    {copiedKey === 'text' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" weight="bold" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  readOnly
                  value={result.text}
                  rows={16}
                  className="w-full p-4 rounded-card bg-surface-raised border border-surface-border text-xs font-sans text-ink-primary leading-relaxed focus:outline-none resize-none"
                />
              </div>
            )}

            {/* TAB CONTENT 4: AST EXPLORER */}
            {activeTab === 'ast' && (
              <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div className="text-xs text-ink-muted">
                    <span className="font-semibold text-ink-primary">Docling Document AST Structure</span>
                  </div>

                  <button
                    onClick={() => handleCopy(JSON.stringify(result.ast, null, 2), 'ast')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                  >
                    {copiedKey === 'ast' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" weight="bold" />
                        <span>Copy AST JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-card bg-surface-raised border border-surface-border text-[11px] font-mono text-ink-primary whitespace-pre overflow-x-auto max-h-[600px] leading-relaxed">
                  {JSON.stringify(result.ast, null, 2)}
                </pre>
              </div>
            )}

            {/* TAB CONTENT 5: HTML */}
            {activeTab === 'html' && (
              <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <span className="font-semibold text-ink-primary text-xs">Semantic HTML Output</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRawHtml(!isRawHtml)}
                      className="px-2.5 py-1 rounded bg-surface-raised border border-surface-border text-[11px] font-medium text-ink-secondary hover:text-ink-primary"
                    >
                      {isRawHtml ? 'View Rendered' : 'View HTML Code'}
                    </button>

                    <button
                      onClick={() => handleCopy(result.html, 'html')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                    >
                      {copiedKey === 'html' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" weight="bold" />
                          <span>Copy HTML</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isRawHtml ? (
                  <pre className="p-4 rounded-card bg-surface-raised border border-surface-border text-xs font-mono text-ink-primary whitespace-pre-wrap overflow-x-auto max-h-[600px] leading-relaxed">
                    {result.html}
                  </pre>
                ) : (
                  <div
                    className="p-6 rounded-card bg-surface-raised border border-surface-border max-h-[600px] overflow-y-auto text-xs leading-relaxed text-ink-primary"
                    dangerouslySetInnerHTML={{ __html: result.html }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OcrStudio;
