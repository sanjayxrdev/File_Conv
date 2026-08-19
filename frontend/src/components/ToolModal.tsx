import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { FileDropzone } from './FileDropzone';
import { MergeDropzone } from './MergeDropzone';
import { FormatsRegistryResponse } from '../types';

export interface ToolConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  targetFormat?: string;
  mode?: 'convert' | 'merge';
}

interface ToolModalProps {
  tool: ToolConfig | null;
  registry: FormatsRegistryResponse | null;
  onClose: () => void;
  onSelectSingleFile: (file: File, targetFormat?: string) => void;
  onSelectMultipleFiles: (files: File[], targetFormat?: string) => void;
  onMergeSubmit: (files: File[], mergeType: string) => void;
}

export const ToolModal: React.FC<ToolModalProps> = ({
  tool,
  registry,
  onClose,
  onSelectSingleFile,
  onSelectMultipleFiles,
  onMergeSubmit,
}) => {
  if (!tool) return null;

  const isMerge = tool.mode === 'merge';

  const handleFilesChosen = (files: File[]) => {
    if (isMerge) {
      // Merge mode
      const mergeType = tool.id === 'merge-pdf' ? 'pdf' : (tool.id === 'merge-pptx' ? 'pptx' : 'docx');
      onMergeSubmit(files, mergeType);
    } else {
      if (files.length === 1) {
        onSelectSingleFile(files[0], tool.targetFormat);
      } else {
        onSelectMultipleFiles(files, tool.targetFormat);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${tool.bgLight} ${tool.textColor} flex items-center justify-center font-bold text-lg`}>
              {tool.title.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{tool.title}</h2>
              <p className="text-xs text-slate-500">{tool.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          {isMerge ? (
            <MergeDropzone
              onMergeSubmit={(files, type) => {
                onMergeSubmit(files, type);
              }}
            />
          ) : (
            <FileDropzone
              registry={registry}
              onFilesSelect={handleFilesChosen}
              customTitle={`Upload files for ${tool.title}`}
              customSubtitle={`Drag & drop files to convert directly to ${tool.targetFormat?.toUpperCase() || 'target format'}.`}
            />
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">100% Free & Local Processing</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
