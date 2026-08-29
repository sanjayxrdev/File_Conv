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

export async function apiCompressPdf(
  file: File,
  compressionLevel: string = 'recommended',
  customDpi?: number,
  customQuality?: number
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('compression_level', compressionLevel);
  if (customDpi) formData.append('custom_dpi', customDpi.toString());
  if (customQuality) formData.append('custom_quality', customQuality.toString());

  const res = await fetch(`${API_BASE}/pdf/compress`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to compress PDF.');
  }

  return res.json();
}

export async function apiAlternateMix(
  fileA: File,
  fileB: File,
  reverseB: boolean = false,
  repeatRemaining: boolean = true
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file_a', fileA);
  formData.append('file_b', fileB);
  formData.append('reverse_b', reverseB.toString());
  formData.append('repeat_remaining', repeatRemaining.toString());

  const res = await fetch(`${API_BASE}/pdf/alternate-mix`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to alternate & mix PDFs.');
  }

  return res.json();
}

export async function apiWatermarkPdf(
  file: File,
  text?: string,
  watermarkImage?: File,
  opacity: number = 0.3,
  rotation: number = 45.0,
  tile: boolean = false,
  colorHex: string = '#888888',
  fontSize: number = 40.0
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (text) formData.append('text', text);
  if (watermarkImage) formData.append('watermark_image', watermarkImage);
  formData.append('opacity', opacity.toString());
  formData.append('rotation', rotation.toString());
  formData.append('tile', tile.toString());
  formData.append('color_hex', colorHex);
  formData.append('font_size', fontSize.toString());

  const res = await fetch(`${API_BASE}/pdf/watermark`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to apply watermark.');
  }

  return res.json();
}

export async function apiBatesNumbering(
  file: File,
  prefix: string = 'CONF-',
  suffix: string = '',
  startNumber: number = 1,
  digits: number = 6,
  position: string = 'bottom-right',
  fontSize: number = 10.0,
  colorHex: string = '#000000'
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prefix', prefix);
  formData.append('suffix', suffix);
  formData.append('start_number', startNumber.toString());
  formData.append('digits', digits.toString());
  formData.append('position', position);
  formData.append('font_size', fontSize.toString());
  formData.append('color_hex', colorHex);

  const res = await fetch(`${API_BASE}/pdf/bates-numbering`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to apply Bates numbering.');
  }

  return res.json();
}

export async function apiFlattenGrayscale(
  file: File,
  makeGrayscale: boolean = true,
  flattenForms: boolean = true
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('make_grayscale', makeGrayscale.toString());
  formData.append('flatten_forms', flattenForms.toString());

  const res = await fetch(`${API_BASE}/pdf/flatten-grayscale`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to flatten/grayscale PDF.');
  }

  return res.json();
}

export async function apiCropPdf(
  file: File,
  marginTop: number = 0.0,
  marginBottom: number = 0.0,
  marginLeft: number = 0.0,
  marginRight: number = 0.0,
  unit: string = 'pt'
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('margin_top', marginTop.toString());
  formData.append('margin_bottom', marginBottom.toString());
  formData.append('margin_left', marginLeft.toString());
  formData.append('margin_right', marginRight.toString());
  formData.append('unit', unit);

  const res = await fetch(`${API_BASE}/pdf/crop`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to crop PDF margins.');
  }

  return res.json();
}

export async function apiEditMetadata(
  file: File,
  metadata: { title?: string; author?: string; subject?: string; keywords?: string; creator?: string }
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.author) formData.append('author', metadata.author);
  if (metadata.subject) formData.append('subject', metadata.subject);
  if (metadata.keywords) formData.append('keywords', metadata.keywords);
  if (metadata.creator) formData.append('creator', metadata.creator);

  const res = await fetch(`${API_BASE}/pdf/metadata`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to update PDF metadata.');
  }

  return res.json();
}

export async function apiBankStatementToExcel(file: File): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/pdf/bank-statement-to-excel`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.message || 'Failed to extract financial tables.');
  }

  return res.json();
}

