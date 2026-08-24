import React, { useState, useRef, useEffect } from 'react';
import { File as FileIcon, ArrowRight, Trash, Lightning } from '@phosphor-icons/react';
import { FormatsRegistryResponse, TargetFormatInfo } from '../types';
import { FormatSelector } from './FormatSelector';
import gsap from 'gsap';

interface ConversionCardProps {
  file: File;
  registry: FormatsRegistryResponse | null;
  onConvert: (targetExt: string, options: Record<string, any>) => void;
  onClear: () => void;
  isSubmitting: boolean;
  defaultTargetFormat?: string;
  restrictPdfToDocx?: boolean;
}

export const ConversionCard: React.FC<ConversionCardProps> = ({
  file,
  registry,
  onConvert,
  onClear,
  isSubmitting,
  defaultTargetFormat,
  restrictPdfToDocx = false,
}) => {
  const sourceExt = file?.name ? file.name.split('.').pop()?.toLowerCase() || '' : '';
  const sourceInfo = registry?.formats ? registry.formats[sourceExt] : undefined;

  let rawTargets: TargetFormatInfo[] = sourceInfo?.targets ? [...sourceInfo.targets] : [];
  
  // Resilient fallback targets if registry is loading or format is unrecognized
  if (rawTargets.length === 0) {
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'pdf'].includes(sourceExt)) {
      rawTargets = [
        { target_ext: 'md', label: 'Structured Markdown (OCR)', engine: 'ocr', category: 'text', is_lossy: false, options: [] },
        { target_ext: 'txt', label: 'Extracted Text (OCR)', engine: 'ocr', category: 'text', is_lossy: false, options: [] },
        { target_ext: 'json', label: 'Docling Document JSON AST', engine: 'ocr', category: 'text', is_lossy: false, options: [] },
        { target_ext: 'docx', label: 'Word Document', engine: 'ocr', category: 'document', is_lossy: false, options: [] },
        { target_ext: 'pdf', label: 'PDF Document', engine: 'image', category: 'document', is_lossy: false, options: [] },
      ];
    } else if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'html', 'htm'].includes(sourceExt)) {
      rawTargets = [
        { target_ext: 'pdf', label: 'PDF Document', engine: 'document', category: 'document', is_lossy: false, options: [] },
        { target_ext: 'md', label: 'Markdown File', engine: 'document', category: 'text', is_lossy: false, options: [] },
        { target_ext: 'txt', label: 'Plain Text', engine: 'document', category: 'text', is_lossy: false, options: [] },
      ];
    } else if (['mp4', 'avi', 'mkv', 'webm', 'mov'].includes(sourceExt)) {
      rawTargets = [
        { target_ext: 'mp4', label: 'MP4 Video', engine: 'ffmpeg', category: 'video', is_lossy: true, options: [] },
        { target_ext: 'mp3', label: 'MP3 Audio (Extract)', engine: 'ffmpeg', category: 'audio', is_lossy: true, options: [] },
        { target_ext: 'wav', label: 'WAV Audio (Extract)', engine: 'ffmpeg', category: 'audio', is_lossy: false, options: [] },
      ];
    } else if (['mp3', 'wav', 'flac', 'ogg', 'opus', 'aac'].includes(sourceExt)) {
      rawTargets = [
        { target_ext: 'mp3', label: 'MP3 Audio', engine: 'ffmpeg', category: 'audio', is_lossy: true, options: [] },
        { target_ext: 'wav', label: 'WAV Audio', engine: 'ffmpeg', category: 'audio', is_lossy: false, options: [] },
        { target_ext: 'flac', label: 'FLAC Audio', engine: 'ffmpeg', category: 'audio', is_lossy: false, options: [] },
      ];
    }
  }

  if (restrictPdfToDocx) {
    if (sourceExt === 'pdf') {
      const docxOnly = rawTargets.filter(t => t.target_ext === 'docx' || t.target_ext === 'doc');
      if (docxOnly.length > 0) {
        rawTargets = docxOnly;
      }
    } else if (sourceExt === 'docx' || sourceExt === 'doc') {
      const pdfOnly = rawTargets.filter(t => t.target_ext === 'pdf');
      if (pdfOnly.length > 0) {
        rawTargets = pdfOnly;
      }
    }
  }
  const targets = rawTargets;

  const initialTarget = defaultTargetFormat && targets.some(t => t.target_ext === defaultTargetFormat)
    ? defaultTargetFormat
    : (targets.length > 0 ? targets[0].target_ext : '');

  const [selectedTarget, setSelectedTarget] = useState<string>(initialTarget);
  const [options, setOptions] = useState<Record<string, any>>({});

  useEffect(() => {
    if (initialTarget) {
      setSelectedTarget(initialTarget);
    }
  }, [file?.name, defaultTargetFormat, targets.length]);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 16,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    }, cardRef);
    return () => ctx.revert();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleConvertClick = () => {
    if (selectedTarget) {
      onConvert(selectedTarget, options);
    }
  };

  return (
    <div ref={cardRef} className="w-full max-w-2xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-6 sm:p-8 space-y-6 font-sans shadow-xs">
      {/* File Info Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-border">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-12 h-12 rounded-card bg-surface-raised border border-surface-border text-ink-primary flex items-center justify-center shrink-0">
            <FileIcon className="w-6 h-6" weight="bold" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-sans font-semibold text-ink-primary truncate text-base">{file?.name || 'Uploaded File'}</h4>
            <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
              <span>{file?.size ? formatSize(file.size) : '0 KB'}</span>
              <span className="text-ink-faint">&middot;</span>
              <kbd className="uppercase text-[10px]">{sourceExt || 'FILE'}</kbd>
              <span className="text-ink-faint">&middot;</span>
              <span className="capitalize">{sourceInfo?.category || 'file'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="p-2.5 rounded-card text-ink-muted hover:text-accent-red-text hover:bg-accent-red transition-colors"
          title="Remove file"
        >
          <Trash className="w-4 h-4" weight="bold" />
        </button>
      </div>

      {/* Target Format Selector */}
      {targets.length > 0 ? (
        <FormatSelector
          targets={targets}
          selectedTarget={selectedTarget}
          onSelectTarget={setSelectedTarget}
          options={options}
          onOptionsChange={setOptions}
        />
      ) : (
        <div className="text-center py-4 text-accent-red-text text-sm font-medium">
          No target conversions available for .{sourceExt}
        </div>
      )}

      {/* Active Target Format Banner */}
      {selectedTarget && (
        <div className="p-3.5 rounded-card bg-surface-raised border border-surface-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-ink-muted font-sans text-[11px] font-medium">Target Route:</span>
            <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-ink-primary font-bold uppercase text-[11px]">
              .{sourceExt}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-muted" weight="bold" />
            <span className="px-2.5 py-0.5 rounded bg-ink-primary text-surface-canvas font-bold uppercase text-[11px]">
              .{selectedTarget}
            </span>
          </div>
          <div className="text-ink-muted text-[11px] font-medium truncate max-w-[210px] hidden sm:block">
            Outputs: &ldquo;{(file?.name || 'output').replace(/\.[^/.]+$/, "")}.{selectedTarget}&rdquo;
          </div>
        </div>
      )}

      {/* Submit Conversion Action */}
      <div className="pt-1">
        <button
          onClick={handleConvertClick}
          disabled={!selectedTarget || isSubmitting}
          className="w-full py-3 px-6 rounded-card bg-ink-primary text-surface-canvas font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-surface-canvas/30 border-t-surface-canvas rounded-full animate-spin" />
          ) : (
            <>
              <Lightning className="w-4 h-4 text-surface-canvas" weight="fill" />
              <span>Convert File to .{selectedTarget.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4 text-surface-canvas" weight="bold" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
