import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PdfUploader } from '../../components/pdf/PdfUploader';
import { PdfDownloadResult } from '../../components/pdf/PdfDownloadResult';
import { fetchPdfInfo, apiProtectPdf, getJobStatus, getDownloadUrl } from '../../services/pdfApi';
import { Lock, Eye, EyeSlash, ShieldCheck, WarningCircle, ArrowLeft } from '@phosphor-icons/react';

export const ProtectPdfPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Passwords
  const [openPassword, setOpenPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Permissions
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(true);
  const [allowModifying, setAllowModifying] = useState<boolean>(false);

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
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const calculateStrength = (pw: string): { score: number; label: string; color: string } => {
    if (!pw) return { score: 0, label: 'None', color: 'bg-surface-border' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = calculateStrength(openPassword);

  const handleClear = () => {
    setFile(null);
    setTotalPages(0);
    setOpenPassword('');
    setConfirmPassword('');
    setResultJob(null);
    setError(null);
  };

  const handleProcessProtect = async () => {
    if (!file) return;
    if (!openPassword) {
      setError('Please enter a password.');
      return;
    }
    if (openPassword !== confirmPassword) {
      setError('Password and Confirmation Password do not match.');
      return;
    }

    setIsProcessing(true);
    setProgressMsg('Encrypting PDF document...');
    setError(null);

    try {
      const init = await apiProtectPdf(file, openPassword, openPassword, {
        allowPrinting,
        allowCopying,
        allowModifying,
      });

      // Clear password state immediately for security
      setOpenPassword('');
      setConfirmPassword('');

      const pollTimer = setInterval(async () => {
        try {
          const status = await getJobStatus(init.job_id);
          setProgressMsg(status.message || 'Encrypting...');

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
            setError(status.error || 'Protection failed.');
          }
        } catch (e: any) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);
    } catch (e: any) {
      setIsProcessing(false);
      setError(e.message || 'Failed to protect PDF.');
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
            <Lock className="w-8 h-8 text-accent-red-text" weight="bold" />
            Protect PDF
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-0.5">
            Encrypt your PDF document with AES-256 password protection and granular usage permissions.
          </p>
        </div>
      </div>

      {!file ? (
        <PdfUploader
          label="Upload PDF to Protect"
          description="Drag and drop your PDF here to apply password encryption."
          onFileSelect={handleFileSelect}
          error={error}
        />
      ) : resultJob ? (
        <PdfDownloadResult
          title="PDF Encryption Complete!"
          message="Your document has been encrypted with AES-256 password protection."
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
              Preparing document security controls...
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-surface-card border border-surface-border rounded-card-lg p-6 space-y-6">
              <h3 className="font-serif text-xl text-ink-primary font-normal border-b border-surface-border pb-3 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-accent-red-text" weight="bold" />
                Security Settings
              </h3>

              {/* Password Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-primary">Set Open Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter strong password..."
                      value={openPassword}
                      onChange={(e) => setOpenPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono focus:outline-none focus:border-ink-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                    >
                      {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {openPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                        <span>Strength:</span>
                        <span className="font-semibold">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${strength.color}`}
                          style={{ width: `${(strength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-primary">Confirm Open Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-mono focus:outline-none focus:border-ink-primary"
                  />
                  {confirmPassword && openPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-600 font-sans">Passwords do not match.</p>
                  )}
                </div>
              </div>

              {/* Granular Permission Restrictions */}
              <div className="space-y-3 pt-2 border-t border-surface-border">
                <label className="block text-xs font-semibold text-ink-primary">Document Usage Permissions</label>
                <div className="space-y-2 text-xs font-sans">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPrinting}
                      onChange={(e) => setAllowPrinting(e.target.checked)}
                      className="rounded border-surface-border text-ink-primary focus:ring-ink-primary"
                    />
                    <span>Allow high-resolution printing</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowCopying}
                      onChange={(e) => setAllowCopying(e.target.checked)}
                      className="rounded border-surface-border text-ink-primary focus:ring-ink-primary"
                    />
                    <span>Allow copying text and content</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowModifying}
                      onChange={(e) => setAllowModifying(e.target.checked)}
                      className="rounded border-surface-border text-ink-primary focus:ring-ink-primary"
                    />
                    <span>Allow editing or modifying PDF structure</span>
                  </label>
                </div>
              </div>

              {/* Security Warning Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-card flex items-start gap-2 text-xs text-amber-800 font-sans">
                <WarningCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" weight="bold" />
                <span>
                  <strong>Important:</strong> Please store your password safely. Passwords cannot be recovered or reset if forgotten.
                </span>
              </div>

              {/* Submit */}
              <button
                type="button"
                disabled={isProcessing || !openPassword || openPassword !== confirmPassword}
                onClick={handleProcessProtect}
                className="w-full py-3 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                <Lock className="w-4 h-4" weight="bold" />
                <span>{isProcessing ? progressMsg || 'Encrypting PDF...' : 'Protect PDF Document'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
