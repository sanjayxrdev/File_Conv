import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
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
  Combine,
  Scissors,
  Minimize2,
  FileText,
  Table,
  Presentation,
  Image as ImageIcon,
  Code,
  Music,
  Video,
  Globe,
  Search,
  Zap,
} from 'lucide-react';

export interface ToolConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  route: string;
  targetFormat?: string;
}

export const TOOLS_LIST: ToolConfig[] = [
  {
    id: 'video-converter',
    title: 'Video Converter',
    category: 'Audio & Video',
    description: 'Convert MP4, AVI, MKV, WEBM, MOV, GIF files locally.',
    iconName: 'Video',
    bgLight: 'bg-[#00f2fe]/10',
    textColor: 'text-[#00f2fe]',
    borderColor: 'border-[#00f2fe]/30',
    route: '/video-converter',
    targetFormat: 'mp4',
  },
  {
    id: 'image-converter',
    title: 'Image Converter',
    category: 'Image',
    description: 'Convert PNG, JPG, WEBP, BMP, GIF, and PDF page images.',
    iconName: 'ImageIcon',
    bgLight: 'bg-[#ccff00]/10',
    textColor: 'text-[#ccff00]',
    borderColor: 'border-[#ccff00]/30',
    route: '/image-converter',
    targetFormat: 'jpg',
  },
  {
    id: 'audio-converter',
    title: 'Audio Converter',
    category: 'Audio & Video',
    description: 'Convert MP3, WAV, FLAC, OGG, OPUS, AAC files locally.',
    iconName: 'Music',
    bgLight: 'bg-[#a855f7]/15',
    textColor: 'text-[#a855f7]',
    borderColor: 'border-[#a855f7]/30',
    route: '/audio-converter',
    targetFormat: 'mp3',
  },
  {
    id: 'pdf-converter',
    title: 'PDF Converter',
    category: 'Convert PDF',
    description: 'Convert PDFs to editable DOCX, XLSX, PPTX, JPG, and TXT.',
    iconName: 'FileText',
    bgLight: 'bg-[#ff385c]/15',
    textColor: 'text-[#ff385c]',
    borderColor: 'border-[#ff385c]/30',
    route: '/pdf-converter',
    targetFormat: 'docx',
  },
  {
    id: 'document-converter',
    title: 'Document Converter',
    category: 'Documents',
    description: 'Convert Word, PowerPoint, Excel, and HTML files to PDF.',
    iconName: 'FileText',
    bgLight: 'bg-[#00f2fe]/15',
    textColor: 'text-[#00f2fe]',
    borderColor: 'border-[#00f2fe]/30',
    route: '/document-converter',
    targetFormat: 'pdf',
  },
  {
    id: 'code-converter',
    title: 'Code & Notebook Converter',
    category: 'Code & Text',
    description: 'Convert Python, JS, C, Java, HTML, Jupyter Notebooks (.ipynb).',
    iconName: 'Code',
    bgLight: 'bg-[#ccff00]/15',
    textColor: 'text-[#ccff00]',
    borderColor: 'border-[#ccff00]/30',
    route: '/code-converter',
    targetFormat: 'html',
  },
  {
    id: 'spreadsheet-converter',
    title: 'Spreadsheet Converter',
    category: 'Spreadsheets',
    description: 'Convert CSV to Excel, JSON to CSV, or Excel to CSV.',
    iconName: 'Table',
    bgLight: 'bg-[#10b981]/15',
    textColor: 'text-[#10b981]',
    borderColor: 'border-[#10b981]/30',
    route: '/spreadsheet-converter',
    targetFormat: 'csv',
  },
  {
    id: 'merge-converter',
    title: 'Merge PDF & Documents',
    category: 'Merge & Edit',
    description: 'Combine multiple PDFs, PPTX presentations, or DOCX files.',
    iconName: 'Combine',
    bgLight: 'bg-[#ff385c]/15',
    textColor: 'text-[#ff385c]',
    borderColor: 'border-[#ff385c]/30',
    route: '/merge-converter',
    targetFormat: 'pdf',
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    category: 'Convert PDF',
    description: 'Easily convert PDF files into editable Word documents.',
    iconName: 'FileText',
    bgLight: 'bg-[#00f2fe]/15',
    textColor: 'text-[#00f2fe]',
    borderColor: 'border-[#00f2fe]/30',
    route: '/pdf-converter',
    targetFormat: 'docx',
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel',
    category: 'Convert PDF',
    description: 'Pull data straight from PDFs into Excel spreadsheets.',
    iconName: 'Table',
    bgLight: 'bg-[#10b981]/15',
    textColor: 'text-[#10b981]',
    borderColor: 'border-[#10b981]/30',
    route: '/pdf-converter',
    targetFormat: 'xlsx',
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    category: 'Convert to PDF',
    description: 'Convert DOC and DOCX files to PDF in seconds.',
    iconName: 'FileText',
    bgLight: 'bg-[#00f2fe]/15',
    textColor: 'text-[#00f2fe]',
    borderColor: 'border-[#00f2fe]/30',
    route: '/document-converter',
    targetFormat: 'pdf',
  },
  {
    id: 'jpg-to-pdf',
    title: 'JPG to PDF',
    category: 'Convert to PDF',
    description: 'Convert JPG & PNG images to PDF documents.',
    iconName: 'ImageIcon',
    bgLight: 'bg-[#ccff00]/15',
    textColor: 'text-[#ccff00]',
    borderColor: 'border-[#ccff00]/30',
    route: '/image-converter',
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    if (activeCategoryFilter) {
      setSelectedCategory(activeCategoryFilter);
    }
  }, [activeCategoryFilter]);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  const categories = [
    'All',
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
    switch (iconName) {
      case 'Combine': return <Combine className="w-8 h-8" />;
      case 'Scissors': return <Scissors className="w-8 h-8" />;
      case 'Minimize2': return <Minimize2 className="w-8 h-8" />;
      case 'FileText': return <FileText className="w-8 h-8" />;
      case 'Presentation': return <Presentation className="w-8 h-8" />;
      case 'Table': return <Table className="w-8 h-8" />;
      case 'ImageIcon': return <ImageIcon className="w-8 h-8" />;
      case 'Globe': return <Globe className="w-8 h-8" />;
      case 'Code': return <Code className="w-8 h-8" />;
      case 'Music': return <Music className="w-8 h-8" />;
      case 'Video': return <Video className="w-8 h-8" />;
      default: return <Zap className="w-8 h-8" />;
    }
  };

  return (
    <div className="space-y-12 pb-24 bg-transparent min-h-screen text-slate-100 relative font-sans">

      {/* Handcrafted Mesh Light Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#ff385c]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#00f2fe]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Syne Editorial Hero Title with Ninja Mascot */}
      <div ref={heroRef} className="text-center space-y-4 pt-10 sm:pt-14 max-w-5xl mx-auto px-4 relative z-10">
        <div className="flex justify-center mb-2">
          <img
            src="/logo.png"
            alt="Ninja File Converter"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter drop-shadow-[0_10px_25px_rgba(0,242,254,0.4)] hover:scale-105 transition-transform"
          />
        </div>

        <h1 className="font-syne text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] craft-title-gradient">
          CONVERT ANY FILE INSTANTLY
        </h1>


        <p className="font-heading text-slate-400 text-base sm:text-xl max-w-2xl mx-auto font-medium">
          Fast, local-first digital file converter. Convert documents, images, audio, video, code, and spreadsheets with zero telemetry.
        </p>
      </div>


      {/* Main Conversion Workflow Area */}
      <div className="px-4 max-w-6xl mx-auto relative z-10">
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

      {/* Category Filter Pills & Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Handcrafted Category Pill Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none font-heading">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#ff385c] text-white shadow-lg shadow-[#ff385c]/30'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Quick Tool Search Bar */}
          <div className="relative w-full sm:w-72 font-sans">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search all tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#12141d] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-[#ff385c] shadow-inner placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* All Converter Tool Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleToolCardClick(tool)}
              className="craft-card group cursor-pointer p-6 flex flex-col justify-between h-full bg-[#12141d]/90 border border-white/10 rounded-2xl hover:border-[#ff385c]/50 hover:shadow-2xl transition-all duration-300 active:scale-[0.98]"
            >
              <div className="space-y-4">
                {/* Custom Color Badge Box */}
                <div
                  className={`w-14 h-14 rounded-2xl ${tool.bgLight} ${tool.textColor} ${tool.borderColor} border flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}
                >
                  {renderIcon(tool.iconName)}
                </div>

                <div>
                  <h3 className="font-heading font-extrabold text-white text-xl tracking-tight group-hover:text-[#ff385c] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed font-sans font-medium">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <span>{tool.category}</span>
                <span className="text-[#ff385c] group-hover:translate-x-1 transition-transform">Use Tool →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};





