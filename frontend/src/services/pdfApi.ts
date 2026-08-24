import { ConversionJobResponse } from '../types';
export { getJobStatus, getDownloadUrl } from './api';

const API_BASE = '/api';

export interface PdfThumbnailInfo {
  page_index: number;
  page_number: number;
  width: number;
  height: number;
  rotation: number;
  data_url: string;
}

export interface PdfMetadataResponse {
  total_pages: number;
  is_encrypted: boolean;
  job_id: string;
  pages: Array<{
    index: number;
    page_number: number;
    width: number;
    height: number;
    rotation: number;
  }>;
  thumbnails: PdfThumbnailInfo[];
}

export interface CompareResultResponse {
  summary: {
    total_pages_compared: number;
    changed_pages: number;
    added_pages: number;
    removed_pages: number;
    total_changes: number;
  };
  pages: Array<{
    page_number: number;
    status: 'identical' | 'changed' | 'added' | 'removed' | 'completely_different';
    diff_count: number;
    text_a: string;
    text_b: string;
    thumb_a?: string | null;
    thumb_b?: string | null;
    diff_thumb?: string | null;
    diff_summary: string;
    added_lines?: string[];
    removed_lines?: string[];
  }>;
}

export async function fetchPdfInfo(file: File): Promise<PdfMetadataResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/pdf/info`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || errData.error?.message || 'Failed to read PDF document.');
  }

  return res.json();
}

export async function apiRearrangePdf(file: File, pageOrder: number[]): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('page_order', JSON.stringify(pageOrder));

  const res = await fetch(`${API_BASE}/pdf/rearrange`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to rearrange PDF pages.');
  }

  return res.json();
}

export async function apiSplitPdf(
  file: File,
  splitMode: string,
  ranges?: number[][],
  everyN?: number
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('split_mode', splitMode);
  if (ranges) {
    formData.append('ranges', JSON.stringify(ranges));
  }
  if (everyN !== undefined) {
    formData.append('every_n', everyN.toString());
  }

  const res = await fetch(`${API_BASE}/pdf/split`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to split PDF document.');
  }

  return res.json();
}

export async function apiExtractPdfPages(file: File, pageIndices: number[]): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('page_indices', JSON.stringify(pageIndices));

  const res = await fetch(`${API_BASE}/pdf/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to extract PDF pages.');
  }

  return res.json();
}

export async function apiRotatePdfPages(
  file: File,
  rotations: Record<number, number>,
  defaultRotation: number = 0
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('rotations', JSON.stringify(rotations));
  formData.append('default_rotation', defaultRotation.toString());

  const res = await fetch(`${API_BASE}/pdf/rotate`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to rotate PDF pages.');
  }

  return res.json();
}

export async function apiAddPageNumbers(file: File, options: Record<string, any>): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options));

  const res = await fetch(`${API_BASE}/pdf/add-page-numbers`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to add page numbers.');
  }

  return res.json();
}

export async function apiProtectPdf(
  file: File,
  openPassword: string,
  ownerPassword?: string,
  permissions?: { allowPrinting: boolean; allowCopying: boolean; allowModifying: boolean }
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('open_password', openPassword);
  if (ownerPassword) formData.append('owner_password', ownerPassword);
  if (permissions) {
    formData.append('allow_printing', permissions.allowPrinting ? 'true' : 'false');
    formData.append('allow_copying', permissions.allowCopying ? 'true' : 'false');
    formData.append('allow_modifying', permissions.allowModifying ? 'true' : 'false');
  }

  const res = await fetch(`${API_BASE}/pdf/protect`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to protect PDF document.');
  }

  return res.json();
}

export async function apiComparePdfs(fileA: File, fileB: File): Promise<CompareResultResponse> {
  const formData = new FormData();
  formData.append('file_a', fileA);
  formData.append('file_b', fileB);

  const res = await fetch(`${API_BASE}/pdf/compare`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to compare PDFs.');
  }

  return res.json();
}

export async function apiTransparentSignature(
  file: File,
  tolerance: number = 30,
  targetColor: string = '#FFFFFF'
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tolerance', tolerance.toString());
  formData.append('target_color', targetColor);

  const res = await fetch(`${API_BASE}/pdf/transparent-signature`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to remove background from signature.');
  }

  return res.json();
}

export async function apiStampSignature(
  pdfFile: File,
  signatureFile: File,
  pageIndex: number,
  xPct: number,
  yPct: number,
  widthPct: number,
  heightPct: number
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('signature_file', signatureFile);
  formData.append('page_index', pageIndex.toString());
  formData.append('x_pct', xPct.toString());
  formData.append('y_pct', yPct.toString());
  formData.append('width_pct', widthPct.toString());
  formData.append('height_pct', heightPct.toString());

  const res = await fetch(`${API_BASE}/pdf/stamp-signature`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to stamp signature onto PDF.');
  }

  return res.json();
}

export async function apiRenamePdf(file: File, newFilename: string): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('new_filename', newFilename);

  const res = await fetch(`${API_BASE}/pdf/rename`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to rename PDF document.');
  }

  return res.json();
}

export async function apiExportPdfPagesAsImages(
  file: File,
  targetFormat: string = 'jpg',
  dpi: number = 150
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_format', targetFormat);
  formData.append('dpi', dpi.toString());

  const res = await fetch(`${API_BASE}/pdf/export-images`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to export PDF pages to images.');
  }

  return res.json();
}
