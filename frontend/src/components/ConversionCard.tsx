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
}

export const ConversionCard: React.FC<ConversionCardProps> = ({
  file,
  registry,
  onConvert,
  onClear,
  isSubmitting,
}) => {
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';
  const sourceInfo = registry.formats[sourceExt];

  const targets = sourceInfo ? sourceInfo.targets : [];
  const [selectedTarget, setSelectedTarget] = useState<string>(
    targets.length > 0 ? targets[0].target_ext : ''
  );
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
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-dark-card/90 p-6 shadow-2xl space-y-6">
      {/* File Info Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <File className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-white truncate text-base">{file.name}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{formatSize(file.size)}</span>
              <span>•</span>
              <span className="uppercase font-mono font-medium text-blue-400">{sourceExt}</span>
              <span>•</span>
              <span className="capitalize">{sourceInfo?.category || 'file'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        <div className="text-center py-4 text-red-400 text-sm">
          No target conversions available for .{sourceExt}
        </div>
      )}

      {/* Submit Conversion Action */}
      <div className="pt-2">
        <button
          onClick={handleConvertClick}
          disabled={!selectedTarget || isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Convert File Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
