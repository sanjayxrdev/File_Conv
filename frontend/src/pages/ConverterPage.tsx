import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Music,
  FileText,
  Image as ImageIcon,
  Code,
  Table,
  Combine,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface ConverterCategoryConfig {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  description: string;
  icon: React.ReactNode;
  bgLight: string;
  textColor: string;
  borderColor: string;
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
    icon: <Video className="w-8 h-8" />,
    bgLight: 'bg-indigo-500/20',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    acceptedFormatsText: 'MP4, AVI, MKV, WEBM, MOV, GIF',
    defaultTargetFormat: 'mp4',
  },
  'image-converter': {
    id: 'image-converter',
    slug: 'image-converter',
    title: 'Image Converter',
    categoryName: 'Image',
    description: 'Convert PNG, JPG, WEBP, BMP, GIF, and PDF page images in seconds.',
    icon: <ImageIcon className="w-8 h-8" />,
    bgLight: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    acceptedFormatsText: 'PNG, JPG, WEBP, BMP, GIF, PDF',
    defaultTargetFormat: 'jpg',
  },
  'audio-converter': {
    id: 'audio-converter',
    slug: 'audio-converter',
    title: 'Audio Converter',
    categoryName: 'Audio & Video',
    description: 'Convert MP3, WAV, FLAC, OGG, OPUS, AAC audio tracks locally with crystal clarity.',
    icon: <Music className="w-8 h-8" />,
    bgLight: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    acceptedFormatsText: 'MP3, WAV, FLAC, OGG, OPUS, AAC',
    defaultTargetFormat: 'mp3',
  },
  'pdf-converter': {
    id: 'pdf-converter',
    slug: 'pdf-converter',
    title: 'PDF Converter',
    categoryName: 'Convert PDF',
    description: 'Convert PDF documents to editable DOCX, XLSX, PPTX, JPG, TXT, and Markdown files.',
    icon: <FileText className="w-8 h-8" />,
    bgLight: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    acceptedFormatsText: 'PDF to DOCX, XLSX, PPTX, JPG, TXT, MD',
    defaultTargetFormat: 'docx',
  },
  'document-converter': {
    id: 'document-converter',
    slug: 'document-converter',
    title: 'Document Converter',
    categoryName: 'Documents',
    description: 'Convert Word (DOCX), PowerPoint (PPTX), Excel (XLSX), and HTML documents to PDF and text.',
    icon: <FileText className="w-8 h-8" />,
    bgLight: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    acceptedFormatsText: 'DOCX, PPTX, XLSX, HTML, TXT, MD',
    defaultTargetFormat: 'pdf',
  },
  'code-converter': {
    id: 'code-converter',
    slug: 'code-converter',
    title: 'Code & Notebook Converter',
    categoryName: 'Code & Text',
    description: 'Convert Python, JS, C, Java, HTML, and Jupyter Notebooks (.ipynb) to formatted HTML, PDF, or TXT.',
    icon: <Code className="w-8 h-8" />,
    bgLight: 'bg-cyan-500/20',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    acceptedFormatsText: 'PY, JS, C, JAVA, HTML, IPYNB, TXT',
    defaultTargetFormat: 'html',
  },
  'spreadsheet-converter': {
    id: 'spreadsheet-converter',
    slug: 'spreadsheet-converter',
    title: 'Spreadsheet & Data Converter',
    categoryName: 'Spreadsheets',
    description: 'Convert CSV to Excel, JSON tables to CSV, or Excel spreadsheets to clean CSV data.',
    icon: <Table className="w-8 h-8" />,
    bgLight: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
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

  // Single file conversion hook
  const {
    selectedFile,
    jobState,
    isSubmitting: isSingleSubmitting,
    error: singleError,
    handleSelectFile,
    handleClear: handleSingleClear,
    startJob,
  } = useConversion();

  // Multi-file batch state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchState, setBatchState] = useState<any | null>(null);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const batchPollTimerRef = useRef<any>(null);

  useEffect(() => {
    // Reset file selections when navigating between different conversion pages
    handleSingleClear();
    handleBatchClear();
  }, [slug]);

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
    <div className="space-y-12 pb-24 bg-transparent min-h-screen text-slate-100 relative font-sans">

      {/* Background Glowing Lights */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Breadcrumb & Navigation Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-slate-200 hover:text-white hover:bg-white/20 transition-all shadow-md mb-6"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span>Back to All Converters</span>
        </button>

        {/* Hero Banner for Dedicated Page */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${categoryConfig.bgLight} ${categoryConfig.textColor} ${categoryConfig.borderColor} border flex items-center justify-center shadow-lg`}>
              {categoryConfig.icon}
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight gradient-heading">
            {categoryConfig.title}
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto font-medium">
            {categoryConfig.description}
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Supported: {categoryConfig.acceptedFormatsText}</span>
          </div>
        </div>
      </div>

      {/* Main Conversion Workflow Area */}
      <div className="px-4 max-w-6xl mx-auto relative z-10">
        {/* Category File Dropzone */}
        {!selectedFile && selectedFiles.length === 0 && !jobState && !batchState && (
          <FileDropzone
            registry={registry}
            onFilesSelect={handleFilesSelect}
            error={singleError || batchError}
            customTitle={`Upload ${categoryConfig.title.split(' ')[0]} Files`}
            customSubtitle={`Select single or multiple files for instant ${categoryConfig.title.toLowerCase()}.`}
          />
        )}

        {/* Single File Conversion Card */}
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

        {/* Single File Progress */}
        {jobState && jobState.status === 'processing' && (
          <ProgressBar
            progress={jobState.progress}
            message={jobState.message}
            sourceFormat={jobState.source_format}
            targetFormat={jobState.target_format}
          />
        )}

        {/* Single File Result */}
        {jobState && jobState.status === 'completed' && jobState.download_url && (
          <ResultCard
            originalFilename={jobState.original_filename}
            targetFormat={jobState.target_format}
            downloadUrl={jobState.download_url}
            outputSizeBytes={jobState.output_size_bytes}
            onReset={handleSingleClear}
          />
        )}

        {/* Multi-File Batch Conversion Card */}
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

        {/* Multi-File Batch Progress */}
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

        {/* Multi-File Batch Result */}
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

      {/* Cross Navigation to Other Conversion Pages */}
      <div className="max-w-6xl mx-auto px-4 pt-12 border-t border-white/10 relative z-10">
        <h3 className="text-center text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-6">
          Explore Other Conversion Tools
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.values(CONVERTER_CATEGORIES)
            .filter((c) => c.slug !== slug)
            .map((c) => (
              <button
                key={c.slug}
                onClick={() => navigate(`/${c.slug}`)}
                className="p-4 rounded-2xl glass-card bg-slate-900/70 border border-white/10 hover:border-blue-500/50 text-center space-y-2 transition-all group"
              >
                <div className={`w-10 h-10 mx-auto rounded-xl ${c.bgLight} ${c.textColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {c.icon}
                </div>
                <div className="font-extrabold text-white text-xs truncate group-hover:text-blue-400 transition-colors">
                  {c.title}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

