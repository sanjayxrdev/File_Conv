import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiWatermarkPdf, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { Stamp, ArrowLeft, Image as ImageIcon, TextAa, GridFour, CheckCircle } from '@phosphor-icons/react';

export const WatermarkPdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Watermark state
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [opacity, setOpacity] = useState<number>(30);
  const [rotation, setRotation] = useState<number>(45);
  const [tile, setTile] = useState<boolean>(false);
  const [colorHex, setColorHex] = useState<string>('#888888');
  const [fontSize, setFontSize] = useState<number>(48);

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
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const img = e.target.files?.[0];
    if (img) setWatermarkImage(img);
  };

  const handleClear = () => {
    setFile(null);
    setTotalPages(0);
    setWatermarkImage(null);
    setResultJob(null);
    setError(null);
  };

  const handleProcessWatermark = async () => {
    if (!file) return;
    if (watermarkType === 'text' && !watermarkText.trim()) {
      setError('Please enter watermark text.');
      return;
    }
    if (watermarkType === 'image' && !watermarkImage) {
      setError('Please select a watermark image.');
      return;
    }

    setIsProcessing(true);
    setProgressMsg('Applying watermark overlay to document...');
    setError(null);

    try {
      const init = await apiWatermarkPdf(
        file,
        watermarkType === 'text' ? watermarkText : undefined,
        watermarkType === 'image' ? watermarkImage || undefined : undefined,
        opacity / 100.0,
        rotation,
        tile,
        colorHex,
        fontSize
      );

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setResultJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: `${file.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            setError(status.error || 'Watermarking failed.');
          } else if (status.message) {
            setProgressMsg(status.message);
          }
        } catch (err: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(err.message || 'Failed to check status.');
        }
      }, 1000);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to start watermarking.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/#tools-directory')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Document Protection & Branding
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink-primary flex items-center gap-3">
          <Stamp className="w-7 h-7 text-amber-500" weight="bold" />
          Watermark PDF Document
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Apply customized text or logo watermarks across PDF pages with precise control over opacity, angle, and tile patterns.
        </p>
      </div>

      {!file ? (
        <PdfUploader
          onFileSelect={handleFileSelect}
          isLoading={isLoadingFile}
          label="Drop your PDF here to watermark"
          description="Supports all standard PDFs"
        />
      ) : resultJob ? (
        <div className="space-y-4">
          <PdfDownloadResult
            downloadUrl={resultJob.downloadUrl}
            downloadFilename={resultJob.filename}
            onReset={handleClear}
            title="Watermark Applied Successfully!"
          />
        </div>
      ) : (
        <div className="space-y-6 bg-surface-card border border-surface-border p-6 rounded-card shadow-sm">
          {/* File summary */}
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-canvas border border-surface-border text-xs">
            <span className="font-semibold text-ink-primary truncate max-w-xs">{file.name}</span>
            <div className="flex items-center gap-4 text-ink-muted">
              <span>{totalPages} Pages</span>
              <button onClick={handleClear} className="text-red-500 hover:text-red-600 font-medium">
                Change File
              </button>
            </div>
          </div>

          {/* Watermark Type Selector */}
          <div className="flex gap-2 border-b border-surface-border pb-3">
            <button
              type="button"
              onClick={() => setWatermarkType('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-card text-xs font-bold transition-all ${
                watermarkType === 'text'
                  ? 'bg-ink-primary text-surface-canvas'
                  : 'bg-surface-canvas text-ink-muted hover:text-ink-primary'
              }`}
            >
              <TextAa className="w-4 h-4" weight="bold" />
              <span>Text Watermark</span>
            </button>
            <button
              type="button"
              onClick={() => setWatermarkType('image')}
              className={`flex items-center gap-2 px-4 py-2 rounded-card text-xs font-bold transition-all ${
                watermarkType === 'image'
                  ? 'bg-ink-primary text-surface-canvas'
                  : 'bg-surface-canvas text-ink-muted hover:text-ink-primary'
              }`}
            >
              <ImageIcon className="w-4 h-4" weight="bold" />
              <span>Logo / Image Watermark</span>
            </button>
          </div>

          {/* Watermark Inputs */}
          {watermarkType === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                  className="w-full px-3 py-2 text-sm bg-surface-canvas border border-surface-border rounded-card text-ink-primary focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Font Size ({fontSize} pt)
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="96"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-8 h-8 rounded border border-surface-border cursor-pointer"
                    />
                    <span className="text-xs font-mono text-ink-muted">{colorHex}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Upload Watermark Logo (PNG/JPG)
              </label>
              <label className="cursor-pointer inline-flex items-center gap-2 py-2 px-4 rounded-card bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary hover:border-ink-muted transition-all">
                <ImageIcon className="w-4 h-4 text-purple-500" weight="bold" />
                <span>{watermarkImage ? watermarkImage.name : 'Choose Image File'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            </div>
          )}

          {/* Sliders & Pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-surface-border">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Opacity ({opacity}%)
              </label>
              <input
                type="range"
                min="5"
                max="90"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Rotation Angle ({rotation}°)
              </label>
              <input
                type="range"
                min="-90"
                max="90"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={tile}
                  onChange={(e) => setTile(e.target.checked)}
                  className="w-4 h-4 rounded text-ink-primary"
                />
                <span className="font-semibold text-ink-primary">Tile Grid Repeat</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-card bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Action */}
          <button
            type="button"
            onClick={handleProcessWatermark}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-card bg-ink-primary text-surface-canvas font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-canvas border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Applying watermark...'}</span>
              </>
            ) : (
              <>
                <Stamp className="w-4 h-4" weight="bold" />
                <span>Apply Watermark to PDF</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
