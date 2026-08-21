import { FormatsRegistryResponse, ConversionJobResponse } from '../types';

const API_BASE = '/api';

export async function fetchSupportedFormats(): Promise<FormatsRegistryResponse> {
  const res = await fetch(`${API_BASE}/formats`);
  if (!res.ok) {
    throw new Error('Failed to load supported formats matrix.');
  }
  return res.json();
}

export async function startConversion(
  file: File,
  targetFormat: string,
  options?: Record<string, any>
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_format', targetFormat);
  if (options && Object.keys(options).length > 0) {
    formData.append('options', JSON.stringify(options));
  }

  const res = await fetch(`${API_BASE}/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail?.message || errorData.error?.message || 'Failed to start conversion job.';
    throw new Error(message);
  }

  return res.json();
}

export async function startBatchConversion(
  files: File[],
  targetFormat: string,
  options?: Record<string, any>
): Promise<{ batch_id: string; total_files: number; job_ids: string[] }> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('target_format', targetFormat);
  if (options && Object.keys(options).length > 0) {
    formData.append('options', JSON.stringify(options));
  }

  const res = await fetch(`${API_BASE}/convert-batch`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail?.message || errorData.error?.message || 'Failed to start batch conversion.';
    throw new Error(message);
  }

  return res.json();
}

export async function getBatchStatus(batchId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/convert-batch/${batchId}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve batch status.');
  }
  return res.json();
}

export async function startMerge(
  files: File[],
  mergeType: string
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('merge_type', mergeType);

  const res = await fetch(`${API_BASE}/merge`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail?.message || errorData.error?.message || 'Failed to start merge job.';
    throw new Error(message);
  }

  return res.json();
}

export async function getJobStatus(jobId: string): Promise<ConversionJobResponse> {
  const res = await fetch(`${API_BASE}/convert/${jobId}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve job status.');
  }
  return res.json();
}

export function getDownloadUrl(jobId: string, customFilename?: string): string {
  if (customFilename) {
    return `${API_BASE}/download/${jobId}?custom_filename=${encodeURIComponent(customFilename)}`;
  }
  return `${API_BASE}/download/${jobId}`;
}
