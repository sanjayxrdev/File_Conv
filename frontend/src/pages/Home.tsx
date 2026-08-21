import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormatsRegistryResponse } from '../types';
import { FileDropzone } from '../components/FileDropzone';
import { ConversionCard } from '../components/ConversionCard';
import { ProgressBar } from '../components/ProgressBar';
import { ResultCard } from '../components/ResultCard';
import { BatchConversionCard } from '../components/BatchConversionCard';
import { BatchProgressBar } from '../components/BatchProgressBar';
import { BatchResultCard } from '../components/BatchResultCard';
import { useConversion } from '../hooks/useConversion';
import { startBatchConversion, getBatchStatus } from '../services/api';
import {
  GitMerge,
  FileText,
  Table,
  Image as ImageIcon,
  Code,
  MusicNotes,
  Video,
  MagnifyingGlass,
  ArrowRight,
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
}

export const TOOLS_LIST: ToolConfig[] = [
  {
    id: 'rearrange-pdf',
    title: 'Rearrange PDF',
    category: 'PDF Tools',
    description: 'Drag & drop pages to reorder, delete, and export updated PDF.',
    iconName: 'FileText',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/pdf/rearrange',
  },
  {
    id: 'compare-pdf',
    title: 'Compare PDFs',
    category: 'PDF Tools',
    description: 'Compare two PDFs side-by-side, overlay, or difference view.',
    iconName: 'Combine',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/pdf/compare',
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    category: 'PDF Tools',
    description: 'Split PDFs by ranges, selected pages, or custom groups.',
    iconName: 'FileText',
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    route: '/pdf/split',
  },
  {
    id: 'page-numbers-pdf',
    title: 'Add Page Numbers',
    category: 'PDF Tools',
    description: 'Add page numbers with custom position, margins, and styling.',
    iconName: 'FileText',
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    route: '/pdf/page-numbers',
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF Pages',
    category: 'PDF Tools',
    description: 'Rotate single pages, ranges, or all pages by 90°, 180°, 270°.',
    iconName: 'FileText',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/pdf/rotate',
  },
  {
    id: 'extract-pdf',
    title: 'Extract PDF Pages',
    category: 'PDF Tools',
    description: 'Select and extract specific pages into a new PDF document.',
    iconName: 'FileText',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/pdf/extract',
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    category: 'PDF Tools',
    description: 'Encrypt PDFs with AES-256 passwords and permission flags.',
    iconName: 'FileText',
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    route: '/pdf/protect',
  },
  {
    id: 'transparent-signature',
    title: 'Transparent Signature',
    category: 'PDF Tools',
    description: 'Remove background from signature images and stamp on PDFs.',
    iconName: 'ImageIcon',
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    route: '/pdf/transparent-signature',
  },
  {
    id: 'rename-pdf',
    title: 'Rename PDF',
    category: 'PDF Tools',
    description: 'Change PDF document filename while preserving contents and extension.',
    iconName: 'FileText',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/pdf/rename',
  },
  {
    id: 'video-converter',
    title: 'Video Converter',
    category: 'Audio & Video',
    description: 'Convert MP4, AVI, MKV, WEBM, MOV, and GIF files locally.',
    iconName: 'Video',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/video-converter',
    targetFormat: 'mp4',
  },
  {
    id: 'image-converter',
    title: 'Image Converter',
    category: 'Image',
    description: 'Convert PNG, JPG, WEBP, BMP, GIF, and PDF page images.',
    iconName: 'ImageIcon',
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    route: '/image-converter',
    targetFormat: 'jpg',
  },
  {
    id: 'audio-converter',
    title: 'Audio Converter',
    category: 'Audio & Video',
    description: 'Convert MP3, WAV, FLAC, OGG, OPUS, and AAC files locally.',
    iconName: 'Music',
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    route: '/audio-converter',
    targetFormat: 'mp3',
  },
  {
    id: 'pdf-converter',
    title: 'PDF Converter',
    category: 'Convert PDF',
    description: 'Convert PDFs to editable DOCX, XLSX, PPTX, JPG, and TXT.',
    iconName: 'FileText',
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    route: '/pdf-converter',
    targetFormat: 'docx',
  },
  {
    id: 'document-converter',
    title: 'Document Converter',
    category: 'Documents',
    description: 'Convert Word, PowerPoint, Excel, and HTML files to PDF.',
    iconName: 'FileText',
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    route: '/document-converter',
    targetFormat: 'pdf',
  },
  {
    id: 'code-converter',
    title: 'Code & Notebook Converter',
    category: 'Code & Text',
    description: 'Convert Python, JS, C, Java, HTML, and Jupyter Notebooks.',
    iconName: 'Code',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/code-converter',
    targetFormat: 'html',
  },
  {
    id: 'spreadsheet-converter',
    title: 'Spreadsheet Converter',
    category: 'Spreadsheets',
    description: 'Convert CSV to Excel, JSON to CSV, or Excel to CSV.',
    iconName: 'Table',
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    route: '/spreadsheet-converter',
    targetFormat: 'csv',
  },
  {
    id: 'merge-converter',
    title: 'Merge PDF & Documents',
    category: 'Merge & Edit',
    description: 'Combine multiple PDFs, PPTX presentations, or DOCX files.',
    iconName: 'Combine',
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    route: '/merge-converter',
    targetFormat: 'pdf',
  },
];

interface HomeProps {
  registry: FormatsRegistryResponse | null;
  activeCategoryFilter?: string;
}

export const Home: React.FC<HomeProps> = ({ registry, activeCategoryFilter }) => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const toolsGridRef = useRef<HTMLDivElement>(null);
  const sectionHeaderRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    selectedFile,
    jobState,
    isSubmitting: isSingleSubmitting,
    error: singleError,
    handleSelectFile,
    handleClear: handleSingleClear,
    startJob,
  } = useConversion();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchState, setBatchState] = useState<any | null>(null);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const batchPollTimerRef = useRef<any>(null);

  useEffect(() => {
    if (activeCategoryFilter) {
      setSelectedCategory(activeCategoryFilter);
    }
  }, [activeCategoryFilter]);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      const hero = heroRef.current;
      if (!hero) return;

      tl.from(hero.querySelector('h1'), {
        y: 30,
        opacity: 0,
        duration: 0.7,
      })
        .from(hero.querySelector('p'), {
          y: 20,
          opacity: 0,
          duration: 0.5,
        }, '-=0.4')
        .from(Array.from(hero.querySelectorAll('kbd, span')).filter(el => el.closest('div.flex')), {
          y: 10,
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
        }, '-=0.3');
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!toolsGridRef.current || !sectionHeaderRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(sectionHeaderRef.current!.children, {
        scrollTrigger: {
          trigger: sectionHeaderRef.current!,
          start: 'top 85%',
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power3.out',
      });

      gsap.from(toolsGridRef.current!.children, {
        scrollTrigger: {
          trigger: toolsGridRef.current!,
          start: 'top 85%',
          once: true,
        },
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power3.out',
      });
    }, toolsGridRef);
    return () => ctx.revert();
  }, []);

  const categories = [
    'All',
    'PDF Tools',
    'Merge & Edit',
    'Documents',
    'Spreadsheets',
    'Audio & Video',
    'Code & Text',
  ];

  const filteredTools = useMemo(() => {
    return TOOLS_LIST.filter((tool) => {
      const matchCat = selectedCategory === 'All' || tool.category === selectedCategory;
      const matchSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.targetFormat?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleFilesSelect = (files: File[]) => {
    if (files.length === 1) {
      handleSelectFile(files[0]);
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files);
      handleSingleClear();
    }
  };

  const handleToolCardClick = (tool: ToolConfig) => {
    navigate(tool.route);
  };

  const handleBatchClear = () => {
    if (batchPollTimerRef.current) {
      clearInterval(batchPollTimerRef.current);
    }
    setSelectedFiles([]);
    setBatchState(null);
    setBatchError(null);
    setIsBatchSubmitting(false);
  };

  const handleRemoveFile = (index: number) => {
    const next = selectedFiles.filter((_, i) => i !== index);
    if (next.length === 1) {
      handleSelectFile(next[0]);
      setSelectedFiles([]);
    } else {
      setSelectedFiles(next);
    }
  };

  const handleStartBatch = async (targetFormat: string) => {
    setIsBatchSubmitting(true);
    setBatchError(null);

    try {
      const initResp = await startBatchConversion(selectedFiles, targetFormat);
      const batchId = initResp.batch_id;

      batchPollTimerRef.current = setInterval(async () => {
        try {
          const statusResp = await getBatchStatus(batchId);
          setBatchState(statusResp);

          if (statusResp.status === 'completed' || statusResp.status === 'failed') {
            clearInterval(batchPollTimerRef.current);
            batchPollTimerRef.current = null;
            setIsBatchSubmitting(false);
          }
        } catch (e: any) {
          clearInterval(batchPollTimerRef.current);
          batchPollTimerRef.current = null;
          setIsBatchSubmitting(false);
          setBatchError(e.message || 'Batch status update failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsBatchSubmitting(false);
      setBatchError(e.message || 'Could not start batch conversion.');
    }
  };

  const renderIcon = (iconName: string) => {
    const iconClass = "w-7 h-7";
    switch (iconName) {
      case 'Combine': return <GitMerge className={iconClass} weight="bold" />;
      case 'FileText': return <FileText className={iconClass} weight="bold" />;
      case 'Table': return <Table className={iconClass} weight="bold" />;
      case 'ImageIcon': return <ImageIcon className={iconClass} weight="bold" />;
      case 'Code': return <Code className={iconClass} weight="bold" />;
      case 'Music': return <MusicNotes className={iconClass} weight="bold" />;
      case 'Video': return <Video className={iconClass} weight="bold" />;
      default: return <FileText className={iconClass} weight="bold" />;
    }
  };

  return (
    <div className="space-y-20 pb-24 bg-transparent min-h-screen text-ink-primary relative font-sans">

      {/* Hero Section */}
      <div ref={heroRef} className="text-center space-y-6 pt-16 sm:pt-24 max-w-4xl mx-auto px-4 relative z-10">
        <h1 className="font-serif text-5xl sm:text-7xl font-normal text-ink-primary tracking-tight">
          Convert any file instantly
        </h1>
        <p className="text-ink-muted text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Fast, local-first digital file converter. Convert documents, images, audio, video, code, and spreadsheets with zero telemetry.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-ink-muted font-mono">
          <kbd>PDF</kbd>
          <kbd>DOCX</kbd>
          <kbd>MP4</kbd>
          <kbd>MP3</kbd>
          <kbd>PNG</kbd>
          <kbd>PY</kbd>
          <span className="text-ink-faint">+12 more</span>
        </div>
      </div>

      {/* Main Conversion Workflow Area */}
      <div className="px-4 max-w-4xl mx-auto relative z-10">
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

      {/* Tools Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div ref={sectionHeaderRef} className="mb-10">
          <h2 className="font-serif text-3xl sm:text-4xl text-ink-primary tracking-tight mb-2">
            All conversion tools
          </h2>
          <p className="text-ink-muted text-sm">
            Every format route is validated against our backend conversion matrix.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-sans">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-card text-xs font-medium whitespace-nowrap transition-all ${isActive
                      ? 'bg-ink-primary text-white'
                      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised border border-surface-border'
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <MagnifyingGlass className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" weight="bold" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs focus:outline-none focus:border-ink-primary/30 placeholder:text-ink-faint transition-colors"
            />
          </div>
        </div>

        {/* Tool Grid */}
        <div ref={toolsGridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleToolCardClick(tool)}
              className="card-lift bg-surface-card border border-surface-border rounded-card-lg p-5 flex flex-col justify-between h-full cursor-pointer group"
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-card ${tool.accentBg} ${tool.accentText} flex items-center justify-center`}>
                  {renderIcon(tool.iconName)}
                </div>

                <div>
                  <h3 className="font-sans font-semibold text-ink-primary text-sm tracking-tight group-hover:text-ink-secondary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-ink-muted text-xs mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-surface-border flex items-center justify-between text-[11px] font-mono text-ink-muted uppercase tracking-wider">
                <span>{tool.category}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-ink-primary" weight="bold" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
