import { useState, useRef, useEffect, useCallback } from 'react';
import { startConversion, getJobStatus, getDownloadUrl } from '../services/api';
import { ConversionJobResponse } from '../types';
import { useHistory } from '../context/HistoryContext';

const ACTIVE_JOB_KEY = 'fileconv_active_job_id';

export function useConversion() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobState, setJobState] = useState<ConversionJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addHistoryItem } = useHistory();
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
    sessionStorage.removeItem(ACTIVE_JOB_KEY);
    setSelectedFile(null);
    setJobState(null);
    setError(null);
    setIsSubmitting(false);
  };

  const pollJobStatus = useCallback((jobId: string) => {
    clearPollTimer();
    pollTimerRef.current = setInterval(async () => {
      try {
        const statusResp = await getJobStatus(jobId);
        setJobState(statusResp);

        if (statusResp.status === 'completed' || statusResp.status === 'failed') {
          clearPollTimer();
          setIsSubmitting(false);
          sessionStorage.removeItem(ACTIVE_JOB_KEY);

          if (statusResp.status === 'completed') {
            addHistoryItem({
              job_id: statusResp.job_id,
              original_filename: statusResp.original_filename,
              source_format: statusResp.source_format,
              target_format: statusResp.target_format,
              status: 'completed',
              download_url: statusResp.download_url,
              output_size_bytes: statusResp.output_size_bytes,
            });
          } else if (statusResp.status === 'failed') {
            setError(statusResp.error || 'Conversion failed.');
          }
        }
      } catch (e: any) {
        clearPollTimer();
        setIsSubmitting(false);
        setError(e.message || 'Status check failed.');
      }
    }, 500);
  }, [addHistoryItem]);

  // Session Recovery: Re-hydrate active or recent in-flight job on page refresh
  useEffect(() => {
    const savedJobId = sessionStorage.getItem(ACTIVE_JOB_KEY);
    if (savedJobId && !jobState) {
      setIsSubmitting(true);
      getJobStatus(savedJobId)
        .then((statusResp) => {
          setJobState(statusResp);
          if (statusResp.status === 'queued' || statusResp.status === 'processing') {
            pollJobStatus(savedJobId);
          } else {
            setIsSubmitting(false);
            sessionStorage.removeItem(ACTIVE_JOB_KEY);
          }
        })
        .catch(() => {
          sessionStorage.removeItem(ACTIVE_JOB_KEY);
          setIsSubmitting(false);
        });
    }

    return () => {
      clearPollTimer();
    };
  }, [pollJobStatus]);

  const startJob = async (targetFormat: string, options?: Record<string, any>) => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const initResp = await startConversion(selectedFile, targetFormat, options);
      const jobId = initResp.job_id;
      sessionStorage.setItem(ACTIVE_JOB_KEY, jobId);
      pollJobStatus(jobId);
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
