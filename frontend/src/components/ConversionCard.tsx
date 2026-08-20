import React, { useState, useRef, useEffect } from 'react';
import { File, ArrowRight, Trash, Lightning } from '@phosphor-icons/react';
import { FormatsRegistryResponse } from '../types';
import { FormatSelector } from './FormatSelector';
import gsap from 'gsap';

interface ConversionCardProps {
  file: File;
  registry: FormatsRegistryResponse;
  onConvert: (targetExt: string, options: Record<string, any>) => void;
  onClear: () => void;
  isSubmitting: boolean;
  defaultTargetFormat?: string;
}

export const ConversionCard: React.FC<ConversionCardProps> = ({
  file,
  registry,
  onConvert,
  onClear,
  isSubmitting,
  defaultTargetFormat,
}) => {
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';
  const sourceInfo = registry.formats[sourceExt];

  const targets = sourceInfo ? sourceInfo.targets : [];
  const initialTarget = defaultTargetFormat && targets.some(t => t.target_ext === defaultTargetFormat)
    ? defaultTargetFormat
    : (targets.length > 0 ? targets[0].target_ext : '');

  const [selectedTarget, setSelectedTarget] = useState<string>(initialTarget);
  const [options, setOptions] = useState<Record<string, any>>({});

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
    <div ref={cardRef} className="w-full max-w-2xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-6 sm:p-8 space-y-6 font-sans">
      {/* File Info Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-border">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-12 h-12 rounded-card bg-accent-red text-accent-red-text border border-accent-red-text/10 flex items-center justify-center shrink-0">
            <File className="w-6 h-6" weight="bold" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-sans font-semibold text-ink-primary truncate text-base">{file.name}</h4>
            <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
              <span>{formatSize(file.size)}</span>
              <span className="text-ink-faint">&middot;</span>
              <kbd className="uppercase text-[10px]">{sourceExt}</kbd>
              <span className="text-ink-faint">&middot;</span>
              <span className="capitalize">{sourceInfo?.category || 'file'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="p-2 rounded-card text-ink-faint hover:text-accent-red-text hover:bg-accent-red transition-colors"
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

      {/* Submit Conversion Action */}
      <div className="pt-1">
        <button
          onClick={handleConvertClick}
          disabled={!selectedTarget || isSubmitting}
          className="w-full py-3.5 px-6 rounded-card bg-ink-primary text-white font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 hover:bg-[#333333] active:scale-[0.99] disabled:opacity-40"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Lightning className="w-4 h-4" weight="fill" />
              <span>Convert File</span>
              <ArrowRight className="w-4 h-4" weight="bold" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
