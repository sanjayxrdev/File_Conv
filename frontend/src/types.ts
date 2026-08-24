export type CategoryType = 'video' | 'audio' | 'image' | 'document' | 'text' | 'ocr';

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

export interface OcrTableData {
  index: number;
  headers: string[];
  rows: string[][];
  num_rows: number;
  num_cols: number;
  csv: string;
  markdown: string;
}

export interface OcrMetadata {
  num_pages: number;
  num_tables: number;
  num_headings: number;
  headings: string[];
  word_count: number;
  char_count: number;
  reading_time_mins: number;
}

export interface OcrAnalysisResult {
  filename: string;
  markdown: string;
  text: string;
  html: string;
  tables: OcrTableData[];
  ast: Record<string, any>;
  metadata: OcrMetadata;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  total_conversions: number;
  plan: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface HistoryEntry {
  id: string;
  job_id: string;
  original_filename: string;
  source_format: string;
  target_format: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  output_size_bytes?: number;
  created_at: string;
  user_id?: string;
  session_id?: string;
}
