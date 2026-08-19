import React, { useState } from 'react';
import { File, ArrowRight, Trash2, Zap } from 'lucide-react';
import { FormatsRegistryResponse } from '../types';
import { FormatSelector } from './FormatSelector';

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
    <div className="w-full max-w-2xl mx-auto rounded-3xl craft-card p-6 sm:p-8 shadow-2xl space-y-6 font-sans">
      {/* File Info Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-[#ff385c]/20 text-[#ff385c] border border-[#ff385c]/30 flex items-center justify-center shrink-0">
            <File className="w-7 h-7" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-heading font-extrabold text-white truncate text-lg">{file.name}</h4>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
              <span>{formatSize(file.size)}</span>
              <span>•</span>
              <span className="uppercase font-mono text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded border border-[#00f2fe]/20">{sourceExt}</span>
              <span>•</span>
              <span className="capitalize">{sourceInfo?.category || 'file'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="p-2.5 rounded-xl text-slate-400 hover:text-[#ff385c] hover:bg-[#ff385c]/10 transition-colors"
          title="Remove file"
        >
          <Trash2 className="w-5 h-5" />
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
        <div className="text-center py-4 text-[#ff385c] text-sm font-semibold font-heading">
          No target conversions available for .{sourceExt}
        </div>
      )}

      {/* Submit Conversion Action */}
      <div className="pt-2 font-heading">
        <button
          onClick={handleConvertClick}
          disabled={!selectedTarget || isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff385c] to-[#e02847] hover:from-[#ff4d6d] hover:to-[#ff385c] disabled:opacity-50 text-white font-extrabold text-lg tracking-wide transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#ff385c]/25 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-6 h-6 fill-white" />
              <span>Convert File Now</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};



