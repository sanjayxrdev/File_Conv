import { useState, useRef, useCallback } from 'react';
import { startConversion, getJobStatus, getDownloadUrl } from '../services/api';
import { ConversionJobResponse } from '../types';

export function useConversion() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobState, setJobState] = useState<ConversionJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<any>(null);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleSelectFile = (file: File) => {
    setSelectedFile(file);
    setJobState(null);
    setError(null);
  };

  const handleClear = () => {
    clearPollTimer();
    setSelectedFile(null);
    setJobState(null);
    setError(null);
  };

  const startJob = async (targetFormat: string, options?: Record<string, any>) => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const initResp = await startConversion(selectedFile, targetFormat, options);
      const jobId = initResp.job_id;

      // Start status polling interval
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusResp = await getJobStatus(jobId);
          setJobState(statusResp);

          if (statusResp.status === 'completed' || statusResp.status === 'failed') {
            clearPollTimer();
            setIsSubmitting(false);
            if (statusResp.status === 'failed') {
              setError(statusResp.error || 'Conversion failed.');
            }
          }
        } catch (e: any) {
          clearPollTimer();
          setIsSubmitting(false);
          setError(e.message || 'Status check failed.');
        }
      }, 500);

    } catch (e: any) {
      setIsSubmitting(false);
      setError(e.message || 'Could not start conversion.');
    }
  };

  return {
    selectedFile,
    jobState,
    isSubmitting,
    error,
    handleSelectFile,
    handleClear,
    startJob,
  };
}
