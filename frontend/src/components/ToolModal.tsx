import React from 'react';
import { X, Lightning, WarningCircle, ArrowRight } from '@phosphor-icons/react';
import { FileDropzone } from './FileDropzone';
import { MergeDropzone } from './MergeDropzone';
import { FormatsRegistryResponse } from '../types';

export interface ToolConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  accentBg: string;
  accentText: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
      <div className="bg-surface-card border border-surface-border rounded-card-lg w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-card ${tool.accentBg} ${tool.accentText} flex items-center justify-center font-bold text-lg`}>
              {tool.title.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-primary tracking-tight">{tool.title}</h2>
              <p className="text-xs text-ink-muted">{tool.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-card bg-surface-raised hover:bg-surface-border flex items-center justify-center text-ink-muted transition-colors"
          >
            <X className="w-4 h-4" weight="bold" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
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
              customSubtitle={`Drag and drop files to convert directly to ${tool.targetFormat?.toUpperCase() || 'target format'}.`}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
          <span className="font-medium">100% free, local processing</span>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
