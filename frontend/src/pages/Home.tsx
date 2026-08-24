import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FormatsRegistryResponse } from '../types';
import { FileDropzone } from '../components/FileDropzone';
import { ConversionCard } from '../components/ConversionCard';
import { ProgressBar } from '../components/ProgressBar';
import { ResultCard } from '../components/ResultCard';
import { BatchConversionCard } from '../components/BatchConversionCard';
import { BatchProgressBar } from '../components/BatchProgressBar';
import { BatchResultCard } from '../components/BatchResultCard';
import { Hero3DCanvas } from '../components/Hero3DCanvas';
import { Card3DTilt } from '../components/Card3DTilt';
import { IsometricPipeline3D } from '../components/IsometricPipeline3D';
import { Interactive3DConverterSandbox } from '../components/Interactive3DConverterSandbox';
import { useConversion } from '../hooks/useConversion';
import { startBatchConversion, getBatchStatus } from '../services/api';
import {
  GitMerge,
  FileText,
  Table,
  Image as ImageIcon,
  Scan,
  MusicNotes,
  Video,
  MagnifyingGlass,
  ArrowRight,
  Sparkle,
  ShieldCheck,
  Lightning,
  ArrowsLeftRight,
  Lock,
  Cpu,
  CheckCircle,
  XCircle,
  CaretDown,
  Rows,
  Code,
  DownloadSimple,
  Globe,
  Database,
  Cube,
  Perspective
} from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ToolConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  accentBg: string;
  accentText: string;
  route: string;
  targetFormat?: string;
  badge?: string;
}

export const TOOLS_LIST: ToolConfig[] = [
  {
    id: 'ocr-converter',
    title: 'Docling OCR & Table Studio',
    category: 'OCR & AI',
    description: 'Extract structured Markdown, interactive spreadsheet tables (CSV), and AST hierarchy from scanned PDFs & images with IBM Docling AI.',
    iconName: 'Scan',
    accentBg: 'bg-accent-purple',
    accentText: 'text-accent-purple-text',
    route: '/ocr-converter',
    targetFormat: 'md',
    badge: 'Docling AI Core',
  },
  {
    id: 'rearrange-pdf',
    title: 'Rearrange PDF Pages',
    category: 'PDF Tools',
    description: 'Drag & drop pages to reorder, delete unwanted pages, and export updated PDFs in seconds.',
    iconName: 'FileText',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/pdf/rearrange',
  },
  {
    id: 'export-images-pdf',
    title: 'Export PDF Pages as Images (.ZIP)',
    category: 'PDF Tools',
    description: 'Preview all pages visually in a grid and extract every page as JPG, PNG, or WebP inside a ZIP file.',
    iconName: 'Image',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/pdf/export-images',
  },
  {
    id: 'compare-pdf',
    title: 'Compare Two PDFs',
    category: 'PDF Tools',
    description: 'Visual side-by-side, overlay, and pixel-difference comparison between revisions.',
    iconName: 'Combine',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/pdf/compare',
  },
  {
    id: 'split-pdf',
    title: 'Split PDF Pages',
    category: 'PDF Tools',
    description: 'Split PDFs by custom page ranges, extract chapters, or separate into individual files.',
    iconName: 'FileText',
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    route: '/pdf/split',
  },
  {
    id: 'page-numbers-pdf',
    title: 'Add PDF Page Numbers',
    category: 'PDF Tools',
    description: 'Stamp professional page numbers with custom font sizes, positioning, and page offsets.',
    iconName: 'FileText',
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    route: '/pdf/page-numbers',
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF Pages',
    category: 'PDF Tools',
    description: 'Rotate individual or all pages by 90°, 180°, or 270° with lossless output.',
    iconName: 'FileText',
    accentBg: 'bg-accent-purple',
    accentText: 'text-accent-purple-text',
    route: '/pdf/rotate',
  },
  {
    id: 'extract-pdf',
    title: 'Extract PDF Pages',
    category: 'PDF Tools',
    description: 'Extract specific pages or page selections into a brand new standalone document.',
    iconName: 'FileText',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/pdf/extract',
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF (Password)',
    category: 'PDF Tools',
    description: 'Encrypt PDFs with AES-256 password protection to restrict viewing and unauthorized copying.',
    iconName: 'Lock',
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    route: '/pdf/protect',
  },
  {
    id: 'transparent-signature',
    title: 'Transparent Signature Stamper',
    category: 'PDF Tools',
    description: 'Remove background from handwritten signatures and stamp onto PDFs with precision visual positioning.',
    iconName: 'FileText',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/pdf/transparent-signature',
  },
  {
    id: 'rename-pdf',
    title: 'Batch PDF Rename',
    category: 'PDF Tools',
    description: 'Clean up and rename PDF files with structured naming conventions and date stamps.',
    iconName: 'FileText',
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    route: '/pdf/rename',
  },
  {
    id: 'merge-converter',
    title: 'Multi-Format File Merger',
    category: 'Merging',
    description: 'Combine multiple PDFs, PPTX slide decks, DOCX word documents, or images into a single unified document.',
    iconName: 'GitMerge',
    accentBg: 'bg-accent-purple',
    accentText: 'text-accent-purple-text',
    route: '/merge-converter',
  },
  {
    id: 'pdf-converter',
    title: 'PDF to Word (.docx)',
    category: 'Documents',
    description: 'Convert PDF documents into editable Microsoft Word DOCX files with native typography retention.',
    iconName: 'FileText',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/pdf-converter',
    targetFormat: 'docx',
  },
  {
    id: 'document-converter',
    title: 'Document Transcoder',
    category: 'Documents',
    description: 'Convert between Markdown, Text, HTML, DOCX, and PPTX with perfect layout loyalty.',
    iconName: 'FileText',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/document-converter',
  },
  {
    id: 'image-converter',
    title: 'Image Converter',
    category: 'Media',
    description: 'Convert between PNG, JPG, WEBP, and BMP with lossless quality and transparency support.',
    iconName: 'Image',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/image-converter',
  },
  {
    id: 'video-converter',
    title: 'Video Transcoder',
    category: 'Media',
    description: 'Transcode MP4, MKV, WEBM, MOV, and extract animated GIFs or audio stems.',
    iconName: 'Video',
    accentBg: 'bg-accent-purple',
    accentText: 'text-accent-purple-text',
    route: '/video-converter',
  },
  {
    id: 'audio-converter',
    title: 'Audio Converter',
    category: 'Media',
    description: 'Convert MP3, WAV, AAC, and FLAC audio files with custom bitrate preservation.',
    iconName: 'MusicNotes',
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    route: '/audio-converter',
  },
  {
    id: 'spreadsheet-converter',
    title: 'Spreadsheet & Data',
    category: 'Data',
    description: 'Seamlessly convert between CSV, Excel (XLSX), and JSON structured databases.',
    iconName: 'Table',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/spreadsheet-converter',
  },
];

interface HomeProps {
  registry: FormatsRegistryResponse | null;
}

export const Home: React.FC<HomeProps> = ({ registry }) => {
  const navigate = useNavigate();

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Single File Conversion Hook
  const {
    jobState,
    isSubmitting: isSingleSubmitting,
    error: singleError,
    startJob,
    handleClear: clearSingleJob,
  } = useConversion();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Batch Conversion State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchState, setBatchState] = useState<{
    batch_id: string;
    status: string;
    progress: number;
    total_files: number;
    completed_files: number;
    failed_files: number;
    zip_download_url?: string;
    files: any[];
  } | null>(null);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Animation Refs
  const spotlightRef = useRef<HTMLDivElement>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);
  const matrixSectionRef = useRef<HTMLDivElement>(null);
  const faqSectionRef = useRef<HTMLDivElement>(null);

  const handleFilesSelect = (files: File[]) => {
    if (files.length === 1) {
      setSelectedFile(files[0]);
      setSelectedFiles([]);
      clearSingleJob();
      setBatchState(null);
    } else if (files.length > 1) {
      setSelectedFiles(files);
      setSelectedFile(null);
      clearSingleJob();
      setBatchState(null);
    }
  };

  const handleSingleClear = () => {
    setSelectedFile(null);
    clearSingleJob();
  };

  const handleBatchClear = () => {
    setSelectedFiles([]);
    setBatchState(null);
    setBatchError(null);
  };

  const handleRemoveFile = (index: number) => {
    const updated = [...selectedFiles];
    updated.splice(index, 1);
    if (updated.length === 1) {
      setSelectedFile(updated[0]);
      setSelectedFiles([]);
    } else {
      setSelectedFiles(updated);
    }
  };

  const handleStartBatch = async (targetExt: string) => {
    if (selectedFiles.length === 0) return;
    setIsBatchSubmitting(true);
    setBatchError(null);

    try {
      const resp = await startBatchConversion(selectedFiles, targetExt);
      setBatchState({
        batch_id: resp.batch_id,
        status: 'processing',
        progress: 0,
        total_files: resp.total_files,
        completed_files: 0,
        failed_files: 0,
        files: [],
      });

      const pollInterval = window.setInterval(async () => {
        try {
          const status = await getBatchStatus(resp.batch_id);
          setBatchState({
            batch_id: status.batch_id,
            status: status.status,
            progress: status.progress,
            total_files: status.total_files,
            completed_files: status.completed_files,
            failed_files: status.failed_files,
            zip_download_url: status.zip_download_url,
            files: status.files,
          });

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsBatchSubmitting(false);
          }
        } catch {
          clearInterval(pollInterval);
          setIsBatchSubmitting(false);
          setBatchError('Error polling batch status.');
        }
      }, 1000);
    } catch (err: any) {
      setIsBatchSubmitting(false);
      setBatchError(err.message || 'Failed to start batch conversion.');
    }
  };

  const categories = ['All', 'OCR & AI', 'PDF Tools', 'Documents', 'Media', 'Data', 'Merging'];

  const filteredTools = useMemo(() => {
    return TOOLS_LIST.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'All' || tool.category === selectedCategory;
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const renderIcon = (name: string, className: string) => {
    switch (name) {
      case 'Scan':
        return <Scan className={className} weight="bold" />;
      case 'FileText':
        return <FileText className={className} weight="bold" />;
      case 'Image':
        return <ImageIcon className={className} weight="bold" />;
      case 'Video':
        return <Video className={className} weight="bold" />;
      case 'MusicNotes':
        return <MusicNotes className={className} weight="bold" />;
      case 'Table':
        return <Table className={className} weight="bold" />;
      case 'GitMerge':
        return <GitMerge className={className} weight="bold" />;
      case 'Lock':
        return <Lock className={className} weight="bold" />;
      default:
        return <ArrowsLeftRight className={className} weight="bold" />;
    }
  };

  const faqItems = [
    {
      q: 'How does FILE CONV guarantee 100% private conversion?',
      a: 'All conversions happen inside your own local machine and backend server instance. None of your uploaded files or extracted data are sent to external third-party cloud APIs.',
    },
    {
      q: 'What makes the IBM Docling OCR Studio different from standard OCR?',
      a: 'Standard OCR merely extracts flat unformatted characters. IBM Docling uses neural document vision to understand visual reading order, identify paragraph hierarchies, extract bounding boxes into an AST, and reconstruct multi-column spreadsheet tables into editable CSV grids.',
    },
    {
      q: 'Why is PDF to DOCX restricted specifically to Microsoft Word output?',
      a: 'To guarantee pristine formatting fidelity, text flow, and layout preservation, PDF-to-Word conversions utilize specialized vector reconstruction tailored directly for Microsoft Word (.docx).',
    },
    {
      q: 'Is there a limit on file size or batch conversion count?',
      a: 'Because FILE CONV leverages your local device resources rather than rate-limited cloud servers, there are no artificial file size ceilings or conversion paywalls. You can convert dozens of files in parallel with ZIP export.',
    },
    {
      q: 'What audio, video, and document formats are supported?',
      a: 'We support 100+ format pairs across PDF, DOCX, PPTX, XLSX, HTML, TXT, MD, PNG, JPG, WEBP, BMP, MP4, MKV, WEBM, MOV, GIF, MP3, WAV, AAC, and FLAC.',
    },
  ];

  return (
    <div className="space-y-24 pb-28 bg-transparent min-h-screen text-ink-primary relative font-sans overflow-x-hidden">
      {/* Hero Section with Integrated 3D Geometric Canvas */}
      <div className="relative max-w-5xl mx-auto px-4 pt-10 sm:pt-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-accent-purple border border-accent-purple-text/20 text-accent-purple-text text-xs font-semibold shadow-xs">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
              <span>IBM Docling AI Document Studio & 3D Local Engine</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-ink-primary tracking-tight leading-[1.08]">
              Transform, process & extract <br className="hidden sm:inline" />
              <span className="italic font-light">any file in milliseconds.</span>
            </h1>

            <p className="hero-subtext text-ink-muted text-base sm:text-lg leading-relaxed">
              The all-in-one local-first file processing suite. Convert documents, transcode multimedia, manipulate PDFs, and parse scanned documents with deep AI layout intelligence.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <a
                href="#dropzone-area"
                className="hero-cta-btn px-6 py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-xs"
              >
                <Lightning className="w-4 h-4" weight="fill" />
                <span>Start Converting Free</span>
              </a>

              <button
                onClick={() => navigate('/ocr-converter')}
                className="hero-cta-btn px-6 py-3 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-semibold hover:bg-surface-raised active:scale-[0.98] transition-all flex items-center gap-2 shadow-xs"
              >
                <Scan className="w-4 h-4 text-accent-purple-text" weight="bold" />
                <span>Launch Docling OCR Studio</span>
              </button>
            </div>

            {/* Trust & Key Stats Strip */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-ink-muted font-sans">
              <div className="trust-pill p-3 rounded-card bg-surface-card border border-surface-border flex flex-col items-center shadow-xs">
                <span className="font-mono font-bold text-sm text-ink-primary">100+</span>
                <span className="text-[10px] text-ink-muted">Format Pairs</span>
              </div>
              <div className="trust-pill p-3 rounded-card bg-surface-card border border-surface-border flex flex-col items-center shadow-xs">
                <span className="font-mono font-bold text-sm text-ink-primary">0ms</span>
                <span className="text-[10px] text-ink-muted">Telemetry</span>
              </div>
              <div className="trust-pill p-3 rounded-card bg-surface-card border border-surface-border flex flex-col items-center shadow-xs">
                <span className="font-mono font-bold text-sm text-accent-purple-text">Docling AI</span>
                <span className="text-[10px] text-ink-muted">Deep Table OCR</span>
              </div>
              <div className="trust-pill p-3 rounded-card bg-surface-card border border-surface-border flex flex-col items-center shadow-xs">
                <span className="font-mono font-bold text-sm text-ink-primary">100% Free</span>
                <span className="text-[10px] text-ink-muted">Local Native</span>
              </div>
            </div>
          </div>

          {/* Right 3D Interactive WebGL Wireframe Canvas */}
          <div className="lg:col-span-5 h-[340px] sm:h-[420px] relative flex items-center justify-center">
            <Hero3DCanvas />
          </div>
        </div>
      </div>

      {/* Main Conversion Workflow Dropzone Area */}
      <div id="dropzone-area" className="px-4 max-w-4xl mx-auto relative z-10 scroll-mt-20">
        {!selectedFile && selectedFiles.length === 0 && !jobState && !batchState && (
          <FileDropzone
            registry={registry}
            onFilesSelect={handleFilesSelect}
            error={singleError || batchError}
          />
        )}

        {selectedFile && (!jobState || jobState.status === 'queued') && (
          <ConversionCard
            file={selectedFile}
            registry={registry!}
            onConvert={startJob}
            onClear={handleSingleClear}
            isSubmitting={isSingleSubmitting}
            restrictPdfToDocx={true}
          />
        )}

        {jobState && jobState.status === 'processing' && (
          <ProgressBar
            progress={jobState.progress}
            message={jobState.message}
            sourceFormat={jobState.source_format}
            targetFormat={jobState.target_format}
          />
        )}

        {jobState && jobState.status === 'completed' && jobState.download_url && (
          <ResultCard
            originalFilename={jobState.original_filename}
            targetFormat={jobState.target_format}
            downloadUrl={jobState.download_url}
            outputSizeBytes={jobState.output_size_bytes}
            onReset={handleSingleClear}
          />
        )}

        {selectedFiles.length > 1 && (!batchState || batchState.status === 'queued') && (
          <BatchConversionCard
            files={selectedFiles}
            registry={registry!}
            onConvertBatch={handleStartBatch}
            onClear={handleBatchClear}
            onRemoveFile={handleRemoveFile}
            isSubmitting={isBatchSubmitting}
            restrictPdfToDocx={true}
          />
        )}

        {batchState && batchState.status === 'processing' && (
          <BatchProgressBar
            progress={batchState.progress}
            totalFiles={batchState.total_files}
            completedFiles={batchState.completed_files}
            failedFiles={batchState.failed_files}
            targetFormat={batchState.files[0]?.target_format || 'pdf'}
            files={batchState.files}
          />
        )}

        {batchState && batchState.status === 'completed' && (
          <BatchResultCard
            batchId={batchState.batch_id}
            totalFiles={batchState.total_files}
            completedFiles={batchState.completed_files}
            zipDownloadUrl={batchState.zip_download_url}
            targetFormat={batchState.files[0]?.target_format || 'pdf'}
            files={batchState.files}
            onReset={handleBatchClear}
          />
        )}
      </div>

      {/* NEW FEATURE: 3D Isometric Document Pipeline Decomposition */}
      <div className="px-4 max-w-5xl mx-auto relative z-10">
        <IsometricPipeline3D />
      </div>

      {/* NEW FEATURE: Live 3D Transformation Sandbox */}
      <div className="px-4 max-w-5xl mx-auto relative z-10">
        <Interactive3DConverterSandbox />
      </div>

      {/* Feature Spotlight: IBM Docling AI Document Intelligence Studio */}
      <div ref={spotlightRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <Card3DTilt maxRotation={5} scale={1.01}>
          <div className="rounded-card-lg bg-surface-card border border-surface-border p-8 sm:p-12 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-card bg-accent-purple border border-accent-purple-text/20 text-accent-purple-text text-xs font-semibold">
                  <Scan className="w-3.5 h-3.5" weight="bold" />
                  <span>Featured AI Innovation</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight leading-tight">
                  Docling AI Document Intelligence Studio
                </h2>

                <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
                  Move beyond flat OCR text. Docling parses complex PDF layouts, extracts multi-column spreadsheet tables into editable CSV grids, and generates clean GitHub Flavored Markdown and JSON AST.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-card bg-surface-raised border border-surface-border space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                      <Rows className="w-4 h-4 text-accent-purple-text" weight="bold" />
                      <span>Table Grid Extraction</span>
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      Exports data tables to interactive spreadsheets and 1-click CSV files.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-card bg-surface-raised border border-surface-border space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                      <Code className="w-4 h-4 text-accent-purple-text" weight="bold" />
                      <span>Docling JSON AST</span>
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      Full bounding box trees, reading order, and hierarchy inspection.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigate('/ocr-converter')}
                    className="px-5 py-2.5 rounded-card bg-ink-primary text-surface-canvas font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <Scan className="w-4 h-4" weight="bold" />
                    <span>Open OCR Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </div>
              </div>

              {/* Code / Markdown Mockup Card */}
              <div className="lg:col-span-5 bg-surface-raised border border-surface-border rounded-card p-5 space-y-4 font-mono text-xs text-ink-secondary">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  </div>
                  <span className="text-[10px] text-ink-muted font-semibold">docling_pipeline.md</span>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed font-mono">
                  <div className="text-accent-purple-text font-bold"># Quarterly Financial Summary</div>
                  <div className="text-ink-secondary">| Metric | Q1 2026 | Q2 2026 | Growth |</div>
                  <div className="text-ink-muted">| :--- | :--- | :--- | :--- |</div>
                  <div className="text-ink-secondary">| Revenue | $4.2M | $6.8M | +61.9% |</div>
                  <div className="text-ink-secondary">| Active Users | 142k | 290k | +104% |</div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-ink-muted border-t border-surface-border">
                  <span>Layout Confidence: 99.4%</span>
                  <span className="text-emerald-600 font-bold">2 Tables Detected</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>
      </div>

      {/* Four Core Pillars Grid with 3D Tilt */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight">
            Engineered for speed, privacy & power
          </h2>
          <p className="text-ink-muted text-sm">
            Everything you need in a modern conversion toolkit, without the compromises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card3DTilt maxRotation={8} scale={1.03}>
            <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-3 shadow-xs h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-card bg-accent-green text-accent-green-text flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" weight="bold" />
                </div>
                <h3 className="font-semibold text-sm text-ink-primary">100% Private & Local</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Files process in your local environment. Zero uploads to external advertising clouds, no telemetry.
                </p>
              </div>
            </div>
          </Card3DTilt>

          <Card3DTilt maxRotation={8} scale={1.03}>
            <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-3 shadow-xs h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-card bg-accent-blue text-accent-blue-text flex items-center justify-center">
                  <Cpu className="w-5 h-5" weight="bold" />
                </div>
                <h3 className="font-semibold text-sm text-ink-primary">Hardware Accelerated</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Powered by native PyMuPDF, FFmpeg transcoding, and vectorized Python pipelines for instant throughput.
                </p>
              </div>
            </div>
          </Card3DTilt>

          <Card3DTilt maxRotation={8} scale={1.03}>
            <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-3 shadow-xs h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-card bg-accent-yellow text-accent-yellow-text flex items-center justify-center">
                  <FileText className="w-5 h-5" weight="bold" />
                </div>
                <h3 className="font-semibold text-sm text-ink-primary">Deep PDF Workspace</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Visual page rearrange, split, compare revisions, transparent signature stamping, and encryption.
                </p>
              </div>
            </div>
          </Card3DTilt>

          <Card3DTilt maxRotation={8} scale={1.03}>
            <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-3 shadow-xs h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-card bg-accent-purple text-accent-purple-text flex items-center justify-center">
                  <Scan className="w-5 h-5" weight="bold" />
                </div>
                <h3 className="font-semibold text-sm text-ink-primary">Docling AI Intelligence</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  State of the art document vision models parse complex visual hierarchies, tables, and formula ASTs.
                </p>
              </div>
            </div>
          </Card3DTilt>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div ref={matrixSectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="rounded-card-lg bg-surface-card border border-surface-border p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-purple-text">
              Architecture Benchmark
            </span>
            <h2 className="font-serif text-3xl text-ink-primary">
              Why FILE CONV outclasses cloud converters
            </h2>
            <p className="text-xs text-ink-muted">
              Compare our local native architecture with typical cloud converter services.
            </p>
          </div>

          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Capabilities</th>
                  <th className="pb-3 text-ink-primary font-bold">FILE CONV (Local First)</th>
                  <th className="pb-3 text-ink-muted">Typical Cloud Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-sans">
                <tr>
                  <td className="py-3.5 pl-2 font-medium text-ink-primary">Data Privacy & Storage</td>
                  <td className="py-3.5 font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" weight="fill" />
                    <span>100% Local / 0 Cloud Uploads</span>
                  </td>
                  <td className="py-3.5 text-accent-red-text">
                    Uploaded to remote server farms
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pl-2 font-medium text-ink-primary">AI Document Table OCR</td>
                  <td className="py-3.5 font-semibold text-accent-purple-text">
                    IBM Docling Layout Engine & AST
                  </td>
                  <td className="py-3.5 text-ink-muted">
                    Basic flat regex or paid paywall
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pl-2 font-medium text-ink-primary">File Size & Daily Limits</td>
                  <td className="py-3.5 font-semibold text-ink-primary">
                    Unlimited &bull; No Paywall
                  </td>
                  <td className="py-3.5 text-ink-muted">
                    Strict caps, throttling & ads
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pl-2 font-medium text-ink-primary">PDF Workspace Suite</td>
                  <td className="py-3.5 font-semibold text-ink-primary">
                    Rearrange, Split, Compare, Sign, Encrypt
                  </td>
                  <td className="py-3.5 text-ink-muted">
                    Fragmented across multiple sites
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pl-2 font-medium text-ink-primary">Offline Processing Speed</td>
                  <td className="py-3.5 font-semibold text-ink-primary">
                    Sub-second &bull; Hardware Accelerated
                  </td>
                  <td className="py-3.5 text-ink-muted">
                    Slow upload/download queues
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complete Tools & Formats Directory */}
      <div ref={toolsSectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight">
              Comprehensive Conversion Directory
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Choose from 17 dedicated converters, PDF tools, and OCR extraction engines.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <MagnifyingGlass className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools & formats... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-card pl-9 pr-3.5 py-2 text-xs text-ink-primary placeholder:text-ink-faint focus:border-ink-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Tabs with Framer Motion Layout Animation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-4 font-sans">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-3.5 py-1.5 rounded-card text-xs font-semibold transition-all shrink-0 ${isSelected
                    ? 'bg-ink-primary text-surface-canvas shadow-xs'
                    : 'bg-surface-card border border-surface-border text-ink-muted hover:text-ink-primary'
                  }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Tools Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTools.map((tool) => (
              <motion.div
                key={tool.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card3DTilt maxRotation={6} scale={1.02}>
                  <div
                    onClick={() => navigate(tool.route)}
                    className="p-5 rounded-card-lg bg-surface-card border border-surface-border hover:border-ink-muted transition-all cursor-pointer space-y-3 group shadow-xs h-full flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-card ${tool.accentBg} ${tool.accentText} flex items-center justify-center`}>
                          {renderIcon(tool.iconName, 'w-4 h-4')}
                        </div>
                        {tool.badge ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-purple text-accent-purple-text border border-accent-purple-text/20 font-mono">
                            {tool.badge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-ink-muted uppercase">
                            {tool.category}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm text-ink-primary group-hover:text-accent-purple-text transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-xs text-ink-muted leading-relaxed mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary group-hover:text-ink-primary pt-2 border-t border-surface-border">
                      <span>Launch Tool</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" weight="bold" />
                    </div>
                  </div>
                </Card3DTilt>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Three Step Explainer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight">
            How it works in 3 simple steps
          </h2>
          <p className="text-ink-muted text-xs sm:text-sm">
            Frictionless file conversion from drag-and-drop to download.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-3 shadow-xs">
            <span className="font-mono text-xl font-bold text-accent-purple-text">01</span>
            <h3 className="font-semibold text-sm text-ink-primary">Drop Your Files</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Drag one or dozens of files directly into the dropzone. Formats and routing are detected automatically.
            </p>
          </div>

          <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-3 shadow-xs">
            <span className="font-mono text-xl font-bold text-accent-purple-text">02</span>
            <h3 className="font-semibold text-sm text-ink-primary">Select Target Output</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Pick your desired target format or configure layout & OCR options in the contextual inspector.
            </p>
          </div>

          <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-3 shadow-xs">
            <span className="font-mono text-xl font-bold text-accent-purple-text">03</span>
            <h3 className="font-semibold text-sm text-ink-primary">Download Instantly</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Get single files or bundled ZIP packages in milliseconds with zero telemetry tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div ref={faqSectionRef} className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-ink-muted text-xs sm:text-sm">
            Everything you need to know about formats, privacy, and OCR pipelines.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-card bg-surface-card border border-surface-border overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-ink-primary hover:bg-surface-raised transition-colors"
                >
                  <span>{item.q}</span>
                  <CaretDown
                    className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-ink-primary' : ''
                      }`}
                    weight="bold"
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-ink-muted leading-relaxed border-t border-surface-border bg-surface-raised">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* High-Impact Bottom Call to Action */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <Card3DTilt maxRotation={4} scale={1.01}>
          <div className="rounded-card-lg bg-surface-card border border-surface-border p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <h2 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight">
              Ready to experience effortless, local file conversion?
            </h2>
            <p className="text-ink-muted text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              No registration required. Drop your first file now and enjoy fast, private, AI-powered document conversion.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#dropzone-area"
                className="px-6 py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
              >
                Start Converting Now
              </a>
              <button
                onClick={() => navigate('/ocr-converter')}
                className="px-6 py-3 rounded-card bg-surface-raised text-ink-primary border border-surface-border text-xs font-semibold hover:bg-surface-card active:scale-[0.98] transition-all"
              >
                Explore OCR Studio
              </button>
            </div>
          </div>
        </Card3DTilt>
      </div>
    </div>
  );
};

export default Home;
