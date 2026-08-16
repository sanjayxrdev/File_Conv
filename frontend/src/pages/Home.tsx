import React, { useEffect, useRef, useState } from 'react';
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
import { Video, Music, FileText, Image as ImageIcon, ShieldCheck, Code } from 'lucide-react';

interface HomeProps {
  registry: FormatsRegistryResponse | null;
}

export const Home: React.FC<HomeProps> = ({ registry }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Single File hook
  const {
    selectedFile,
    jobState,
    isSubmitting: isSingleSubmitting,
    error: singleError,
    handleSelectFile,
    handleClear: handleSingleClear,
    startJob,
  } = useConversion();

  // Multi File Batch state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchState, setBatchState] = useState<any | null>(null);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const batchPollTimerRef = useRef<any>(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
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
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <div ref={heroRef} className="text-center space-y-4 pt-8 sm:pt-12 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Local-First & Multi-File Batch Converter</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          CONVERT ANYTHING <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            SIMPLY & IN BATCH.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
          Convert 1 to N files or folders at once. Supports video, audio, image, document, text, and source code formats locally.
        </p>
      </div>

      {/* Main Conversion Workflow */}
      <div className="px-4">
        
        {/* Upload Dropzone (When nothing selected and no job in progress) */}
        {!selectedFile && selectedFiles.length === 0 && !jobState && !batchState && (
          <FileDropzone
            registry={registry}
            onFilesSelect={handleFilesSelect}
            error={singleError || batchError}
          />
        )}

        {/* Single File Card */}
        {selectedFile && (!jobState || jobState.status === 'queued') && (
          <ConversionCard
            file={selectedFile}
            registry={registry!}
            onConvert={startJob}
            onClear={handleSingleClear}
            isSubmitting={isSingleSubmitting}
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

        {/* Multi-File Batch Card */}
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

      {/* Format Category Badges Grid */}
      <div className="max-w-5xl mx-auto px-4 pt-8 border-t border-slate-800/80">
        <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-8">
          Supported Conversion Categories
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-dark-card/60 border border-slate-800 text-center space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-xs">VIDEO</h4>
            <p className="text-[11px] text-slate-400">MP4, AVI, MKV, WEBM, MOV, GIF</p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-card/60 border border-slate-800 text-center space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-xs">AUDIO</h4>
            <p className="text-[11px] text-slate-400">MP3, WAV, FLAC, OGG, OPUS, AAC</p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-card/60 border border-slate-800 text-center space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-xs">IMAGE</h4>
            <p className="text-[11px] text-slate-400">PNG, JPG, WEBP, BMP, GIF, PDF</p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-card/60 border border-slate-800 text-center space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-xs">DOCUMENTS</h4>
            <p className="text-[11px] text-slate-400">PPTX, DOCX, XLSX, HTML, PDF, MD</p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-card/60 border border-slate-800 text-center space-y-2 hover:border-slate-700 transition-colors col-span-2 sm:col-span-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-xs">TEXT & CODE</h4>
            <p className="text-[11px] text-slate-400">TXT, PY, C, IPYNB, JS, CSS, HTML, JAVA, RS, CS</p>
          </div>
        </div>
      </div>

    </div>
  );
};
