export type CategoryType = 'video' | 'audio' | 'image' | 'document' | 'text' | 'code';

export interface FormatOption {
  name: string;
  label: string;
  type: 'select' | 'number' | 'boolean' | 'text';
  default: any;
  options?: string[];
  min?: number;
  max?: number;
}

export interface TargetFormatInfo {
  target_ext: string;
  label: string;
  engine: string;
  category: CategoryType;
  is_lossy: boolean;
  options: FormatOption[];
}

export interface SourceFormatInfo {
  ext: string;
  label: string;
  category: CategoryType;
  mime_types: string[];
  targets: TargetFormatInfo[];
}

export interface FormatsRegistryResponse {
  categories: CategoryType[];
  formats: Record<string, SourceFormatInfo>;
}

export interface ConversionJobResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  source_format: string;
  target_format: string;
  original_filename: string;
  download_url?: string;
  error?: string;
  output_size_bytes?: number;
}
