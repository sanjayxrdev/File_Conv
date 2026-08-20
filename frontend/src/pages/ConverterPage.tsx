import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Video,
  MusicNotes,
  FileText,
  Image as ImageIcon,
  Code,
  Table,
  GitMerge,
  ArrowLeft,
} from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ConverterCategoryConfig {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  description: string;
  icon: React.ReactNode;
  accentBg: string;
  accentText: string;
  acceptedFormatsText: string;
  defaultTargetFormat: string;
}

export const CONVERTER_CATEGORIES: Record<string, ConverterCategoryConfig> = {
  'video-converter': {
    id: 'video-converter',
    slug: 'video-converter',
    title: 'Video & GIF Converter',
    categoryName: 'Audio & Video',
    description: 'Convert MP4, AVI, MKV, WEBM, MOV, and GIF files locally with full audio track preservation.',
    icon: <Video className="w-7 h-7" weight="bold" />,
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    acceptedFormatsText: 'MP4, AVI, MKV, WEBM, MOV, GIF',
    defaultTargetFormat: 'mp4',
  },
  'image-converter': {
    id: 'image-converter',
    slug: 'image-converter',
    title: 'Image Converter',
    categoryName: 'Image',
    description: 'Convert PNG, JPG, WEBP, BMP, GIF, and PDF page images in seconds.',
    icon: <ImageIcon className="w-7 h-7" weight="bold" />,
    accentBg: 'bg-accent-yellow',
    accentText: 'text-accent-yellow-text',
    acceptedFormatsText: 'PNG, JPG, WEBP, BMP, GIF, PDF',
    defaultTargetFormat: 'jpg',
  },
  'audio-converter': {
    id: 'audio-converter',
    slug: 'audio-converter',
    title: 'Audio Converter',
    categoryName: 'Audio & Video',
    description: 'Convert MP3, WAV, FLAC, OGG, OPUS, and AAC audio tracks locally.',
    icon: <MusicNotes className="w-7 h-7" weight="bold" />,
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    acceptedFormatsText: 'MP3, WAV, FLAC, OGG, OPUS, AAC',
    defaultTargetFormat: 'mp3',
  },
  'pdf-converter': {
    id: 'pdf-converter',
    slug: 'pdf-converter',
    title: 'PDF Converter',
    categoryName: 'Convert PDF',
    description: 'Convert PDF documents to editable DOCX, XLSX, PPTX, JPG, TXT, and Markdown files.',
    icon: <FileText className="w-7 h-7" weight="bold" />,
    accentBg: 'bg-accent-red',
    accentText: 'text-accent-red-text',
    acceptedFormatsText: 'PDF to DOCX, XLSX, PPTX, JPG, TXT, MD',
    defaultTargetFormat: 'docx',
  },
  'document-converter': {
    id: 'document-converter',
    slug: 'document-converter',
    title: 'Document Converter',
    categoryName: 'Documents',
    description: 'Convert Word (DOCX), PowerPoint (PPTX), Excel (XLSX), and HTML documents to PDF and text.',
    icon: <FileText className="w-7 h-7" weight="bold" />,
    accentBg: 'bg-accent-blue',
    accentText: 'text-accent-blue-text',
    acceptedFormatsText: 'DOCX, PPTX, XLSX, HTML, TXT, MD',
    defaultTargetFormat: 'pdf',
  },
  'code-converter': {
    id: 'code-converter',
    slug: 'code-converter',
    title: 'Code & Notebook Converter',
    categoryName: 'Code & Text',
    description: 'Convert Python, JS, C, Java, HTML, and Jupyter Notebooks to formatted HTML, PDF, or TXT.',
    icon: <Code className="w-7 h-7" weight="bold" />,
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    acceptedFormatsText: 'PY, JS, C, JAVA, HTML, IPYNB, TXT',
    defaultTargetFormat: 'html',
  },
  'spreadsheet-converter': {
    id: 'spreadsheet-converter',
    slug: 'spreadsheet-converter',
    title: 'Spreadsheet & Data Converter',
    categoryName: 'Spreadsheets',
    description: 'Convert CSV to Excel, JSON tables to CSV, or Excel spreadsheets to clean CSV data.',
    icon: <Table className="w-7 h-7" weight="bold" />,
    accentBg: 'bg-accent-green',
    accentText: 'text-accent-green-text',
    acceptedFormatsText: 'XLSX, XLS, CSV, JSON',
    defaultTargetFormat: 'csv',
  },
};

interface ConverterPageProps {
  categorySlug?: string;
  registry: FormatsRegistryResponse | null;
}

export const ConverterPage: React.FC<ConverterPageProps> = ({ categorySlug: propSlug, registry }) => {
  const { categorySlug: urlSlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();

  const slug = propSlug || urlSlug || 'pdf-converter';
  const categoryConfig = CONVERTER_CATEGORIES[slug] || CONVERTER_CATEGORIES['pdf-converter'];

  const heroRef = useRef<HTMLDivElement>(null);
  const crossNavRef = useRef<HTMLDivElement>(null);

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
    handleSingleClear();
    handleBatchClear();
  }, [slug]);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(heroRef.current!.querySelector('.back-btn'), {
        x: -10,
        opacity: 0,
        duration: 0.3,
      })
      .from(heroRef.current!.querySelector('.icon-box'), {
        scale: 0.5,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(2)",
      }, "-=0.1")
      .from(heroRef.current!.querySelector('h1'), {
        y: 20,
        opacity: 0,
        duration: 0.5,
      }, "-=0.3")
      .from(heroRef.current!.querySelector('p'), {
        y: 15,
        opacity: 0,
        duration: 0.4,
      }, "-=0.3")
      .from(heroRef.current!.querySelector('.formats-badge'), {
        y: 8,
        opacity: 0,
        duration: 0.3,
      }, "-=0.2");
    }, heroRef);
    return () => ctx.revert();
  }, [slug]);

  useEffect(() => {
    if (!crossNavRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(crossNavRef.current!.querySelectorAll('button'), {
        scrollTrigger: {
          trigger: crossNavRef.current!,
          start: "top 90%",
          once: true,
        },
        y: 12,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.out",
      });
    }, crossNavRef);
    return () => ctx.revert();
  }, []);

  const handleFilesSelect = (files: File[]) => {
    if (files.length === 1) {
      handleSelectFile(files[0]);
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files);
      handleSingleClear();
    }
  };

  const handleBatchClear = () => {
    if (batchPollTimerRef.current) {
      clearInterval(batchPollTimerRef.current);
      batchPollTimerRef.current = null;
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

  return (
    <div className="space-y-16 pb-24 bg-transparent min-h-screen text-ink-primary relative font-sans">

      {/* Breadcrumb & Hero */}
      <div ref={heroRef} className="max-w-4xl mx-auto px-4 pt-8 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="back-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface-raised border border-surface-border text-xs font-medium text-ink-muted hover:text-ink-primary hover:bg-surface-border/50 transition-all mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
          <span>All Converters</span>
        </button>

        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-center">
            <div className={`icon-box w-14 h-14 rounded-card-lg ${categoryConfig.accentBg} ${categoryConfig.accentText} flex items-center justify-center`}>
              {categoryConfig.icon}
            </div>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl text-ink-primary">
            {categoryConfig.title}
          </h1>

          <p className="text-ink-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {categoryConfig.description}
          </p>

          <div className="formats-badge inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-mono text-ink-muted">
            <span>{categoryConfig.acceptedFormatsText}</span>
          </div>
        </div>
      </div>

      {/* Main Conversion Workflow Area */}
      <div className="px-4 max-w-4xl mx-auto relative z-10">
        {!selectedFile && selectedFiles.length === 0 && !jobState && !batchState && (
          <FileDropzone
            registry={registry}
            onFilesSelect={handleFilesSelect}
            error={singleError || batchError}
            customTitle={`Upload ${categoryConfig.title.split(' ')[0]} files`}
            customSubtitle={`Select single or multiple files for ${categoryConfig.title.toLowerCase()}.`}
          />
        )}

        {selectedFile && (!jobState || jobState.status === 'queued') && (
          <ConversionCard
            file={selectedFile}
            registry={registry!}
            onConvert={startJob}
            onClear={handleSingleClear}
            isSubmitting={isSingleSubmitting}
            defaultTargetFormat={categoryConfig.defaultTargetFormat}
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

      {/* Cross Navigation */}
      <div ref={crossNavRef} className="max-w-4xl mx-auto px-4 pt-10 border-t border-surface-border relative z-10">
        <h3 className="text-center text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-6">
          Other conversion tools
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.values(CONVERTER_CATEGORIES)
            .filter((c) => c.slug !== slug)
            .map((c) => (
              <button
                key={c.slug}
                onClick={() => navigate(`/${c.slug}`)}
                className="card-lift p-3 rounded-card bg-surface-card border border-surface-border text-center space-y-2 group"
              >
                <div className={`w-9 h-9 mx-auto rounded-card ${c.accentBg} ${c.accentText} flex items-center justify-center`}>
                  {c.icon}
                </div>
                <div className="font-medium text-ink-primary text-[11px] truncate">
                  {c.title}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
