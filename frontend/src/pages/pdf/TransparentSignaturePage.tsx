import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import {
  fetchPdfInfo,
  apiTransparentSignature,
  apiStampSignature,
  getJobStatus,
  getDownloadUrl,
} from '../../services/pdfApi';
import { ArrowLeft, Image as ImageIcon, DownloadSimple, Stamp, Sparkle } from '@phosphor-icons/react';

export const TransparentSignaturePage: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: Signature Upload
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [tolerance, setTolerance] = useState<number>(30);
  const [targetColor, setTargetColor] = useState<string>('#FFFFFF');
  const [sigPreviewUrl, setSigPreviewUrl] = useState<string | null>(null);

  // Step 2: PDF Stamping Workflow
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [stampPageIndex, setStampPageIndex] = useState<number>(0);
  const [xPct, setXPct] = useState<number>(10);
  const [yPct, setYPct] = useState<number>(80);
  const [widthPct, setWidthPct] = useState<number>(25);
  const [heightPct, setHeightPct] = useState<number>(12);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [transparentJob, setTransparentJob] = useState<{ downloadUrl: string; filename: string } | null>(null);
  const [signedPdfJob, setSignedPdfJob] = useState<{ downloadUrl: string; filename: string } | null>(null);

  const handleSigFileSelect = (file: File) => {
    if (sigPreviewUrl) {
      URL.revokeObjectURL(sigPreviewUrl);
    }
    setSigFile(file);
    const url = URL.createObjectURL(file);
    setSigPreviewUrl(url);
    setTransparentJob(null);
    setError(null);
  };

  const handlePdfFileSelect = async (file: File) => {
    setPdfFile(file);
    setError(null);
    try {
      const info = await fetchPdfInfo(file);
      setPdfPageCount(info.total_pages);
    } catch (e: any) {
      setError(e.message || 'Failed to read target PDF.');
    }
  };

  const handleProcessTransparent = async () => {
    if (!sigFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const init = await apiTransparentSignature(sigFile, tolerance, targetColor);

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsLoading(false);
            setTransparentJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: status.original_filename,
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsLoading(false);
            setError(status.error || 'Background removal failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsLoading(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsLoading(false);
      setError(e.message || 'Failed to remove background.');
    }
  };

  const handleStampOnPdf = async () => {
    if (!pdfFile || !sigFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const init = await apiStampSignature(
        pdfFile,
        sigFile,
        stampPageIndex,
        xPct,
        yPct,
        widthPct,
        heightPct
      );

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          if (status.status === 'completed') {
            clearInterval(pollTimer);
            setIsLoading(false);
            setSignedPdfJob({
              downloadUrl: getDownloadUrl(init.job_id),
              filename: status.original_filename,
            });
          } else if (status.status === 'failed') {
            clearInterval(pollTimer);
            setIsLoading(false);
            setError(status.error || 'Signature stamping failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsLoading(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsLoading(false);
      setError(e.message || 'Failed to stamp signature onto PDF.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-border pb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2 rounded-card bg-surface-card border border-surface-border text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
        </button>
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-accent-blue-text" weight="bold" />
            Make Signature Background Transparent
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Remove solid white background from signature images for clean placement on PDFs.
          </p>
        </div>
      </div>

      {signedPdfJob ? (
        <PdfDownloadResult
          title="PDF Signed Successfully!"
          message="Your document with transparent signature has been generated."
          originalFilename={signedPdfJob.filename}
          downloadUrl={signedPdfJob.downloadUrl}
          onReset={() => {
            setSignedPdfJob(null);
            setPdfFile(null);
          }}
        />
      ) : (
        <div className="space-y-8">
          {/* Step 1: Signature Background Removal */}
          <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 space-y-6">
            <h3 className="font-serif text-xl text-ink-primary font-normal flex items-center gap-2 border-b border-surface-border pb-3">
              <Sparkle className="w-5 h-5 text-accent-blue-text" weight="bold" />
              1. Upload Signature Image
            </h3>

            {!sigFile ? (
              <PdfUploader
                label="Upload Signature Image"
                description="Upload PNG, JPG, or WEBP image of your hand-written signature."
                acceptTypes="image/*"
                onFileSelect={handleSigFileSelect}
                error={error}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Controls */}
                  <div className="space-y-4 font-sans text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>Tolerance Sensitivity:</span>
                        <span className="font-mono text-ink-muted">{tolerance}</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={tolerance}
                        onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                        className="w-full"
                      />
                      <p className="text-[11px] text-ink-muted">
                        Increase tolerance if light background artifacts remain.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold">Background Color to Remove</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={targetColor}
                          onChange={(e) => setTargetColor(e.target.value)}
                          className="w-10 h-8 p-0.5 border rounded cursor-pointer"
                        />
                        <span className="font-mono text-ink-muted">{targetColor} (Default White)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleProcessTransparent}
                      className="w-full py-2.5 rounded-card bg-ink-primary text-white font-semibold hover:bg-[#333333] transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Sparkle className="w-4 h-4" weight="bold" />
                      <span>Make Background Transparent</span>
                    </button>

                    {transparentJob && (
                      <a
                        href={transparentJob.downloadUrl}
                        download
                        className="w-full py-2.5 rounded-card bg-surface-raised border border-surface-border text-ink-primary font-semibold hover:bg-surface-border transition-colors flex items-center justify-center gap-2"
                      >
                        <DownloadSimple className="w-4 h-4" weight="bold" />
                        <span>Download Transparent PNG</span>
                      </a>
                    )}
                  </div>

                  {/* Checkerboard Preview */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-ink-primary">
                      Checkerboard Transparency Preview
                    </label>
                    <div
                      className="relative w-full aspect-[4/3] rounded border border-surface-border flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: '#FFFFFF',
                        backgroundImage:
                          'linear-gradient(45deg, #EAEAEA 25%, transparent 25%), linear-gradient(-45deg, #EAEAEA 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EAEAEA 75%), linear-gradient(-45deg, transparent 75%, #EAEAEA 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      }}
                    >
                      {sigPreviewUrl && (
                        <img
                          src={sigPreviewUrl}
                          alt="Signature Preview"
                          className="max-h-full max-w-full object-contain p-4"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Apply Signature to PDF Workflow */}
          {sigFile && (
            <div className="bg-surface-card border border-surface-border rounded-card-lg p-6 space-y-6">
              <h3 className="font-serif text-xl text-ink-primary font-normal flex items-center gap-2 border-b border-surface-border pb-3">
                <Stamp className="w-5 h-5 text-accent-yellow-text" weight="bold" />
                2. Apply Signature to PDF (Optional)
              </h3>

              {!pdfFile ? (
                <PdfUploader
                  label="Upload Target PDF Document"
                  description="Select a PDF document onto which you want to stamp your transparent signature."
                  onFileSelect={handlePdfFileSelect}
                />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                    <div>
                      <label className="block font-semibold">Target Page</label>
                      <select
                        value={stampPageIndex}
                        onChange={(e) => setStampPageIndex(parseInt(e.target.value, 10))}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border"
                      >
                        {Array.from({ length: pdfPageCount }, (_, i) => (
                          <option key={i} value={i}>
                            Page {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold">Horizontal Position (X %)</label>
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={xPct}
                        onChange={(e) => setXPct(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold">Vertical Position (Y %)</label>
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={yPct}
                        onChange={(e) => setYPct(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold">Signature Width (%)</label>
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={widthPct}
                        onChange={(e) => setWidthPct(parseFloat(e.target.value) || 20)}
                        className="w-full px-2 py-1.5 rounded-card bg-surface-card border border-surface-border font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleStampOnPdf}
                    className="w-full py-3 rounded-card bg-ink-primary text-white text-xs font-semibold hover:bg-[#333333] transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Stamp className="w-4 h-4" weight="bold" />
                    <span>{isLoading ? 'Stamping Signature...' : 'Stamp Signature onto PDF & Export'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
