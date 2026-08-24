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

export async function analyzeDocumentOcr(file: File): Promise<import('../types').OcrAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/ocr/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || errorData.error?.message || 'Failed to analyze document with Docling OCR.';
    throw new Error(message);
  }

  const data = await res.json();
  return data.data;
}

// ---------------- AUTH & SESSION API ----------------

export async function apiLogin(email: string, password: string): Promise<import('../types').AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
  }

  return res.json();
}

export async function apiRegister(email: string, password: string, name: string): Promise<import('../types').AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed.');
  }

  return res.json();
}

export async function apiGetMe(token: string): Promise<import('../types').UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user profile.');
  }

  return res.json();
}

export async function apiGetHistory(sessionId?: string, token?: string | null): Promise<import('../types').HistoryEntry[]> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
  const res = await fetch(`${API_BASE}/auth/history${query}`, { headers });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function apiRecordHistory(entry: Partial<import('../types').HistoryEntry>, token?: string | null): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/auth/history`, {
    method: 'POST',
    headers,
    body: JSON.stringify(entry),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function apiDeleteHistory(jobId: string, sessionId?: string, token?: string | null): Promise<boolean> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
  const res = await fetch(`${API_BASE}/auth/history/${jobId}${query}`, {
    method: 'DELETE',
    headers,
  });

  return res.ok;
}

export async function apiClearHistory(sessionId?: string, token?: string | null): Promise<boolean> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
  const res = await fetch(`${API_BASE}/auth/history${query}`, {
    method: 'DELETE',
    headers,
  });

  return res.ok;
}
