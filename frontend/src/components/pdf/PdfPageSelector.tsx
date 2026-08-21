import React from 'react';
import { CheckSquare, Square, Hash } from '@phosphor-icons/react';

interface PdfPageSelectorProps {
  totalPages: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
}

export const PdfPageSelector: React.FC<PdfPageSelectorProps> = ({
  totalPages,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onSelectOdd,
  onSelectEven,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card border border-surface-border rounded-card p-3 font-sans text-xs">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-ink-primary">
          {selectedCount} of {totalPages} pages selected
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={onSelectAll}
          className="px-2.5 py-1 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary font-medium flex items-center gap-1 transition-colors"
        >
          <CheckSquare className="w-3.5 h-3.5" weight="bold" />
          <span>Select All</span>
        </button>

        <button
          type="button"
          onClick={onDeselectAll}
          className="px-2.5 py-1 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary font-medium flex items-center gap-1 transition-colors"
        >
          <Square className="w-3.5 h-3.5" weight="bold" />
          <span>Deselect All</span>
        </button>

        <button
          type="button"
          onClick={onSelectOdd}
          className="px-2.5 py-1 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary font-medium flex items-center gap-1 transition-colors"
        >
          <Hash className="w-3.5 h-3.5" weight="bold" />
          <span>Odd Pages</span>
        </button>

        <button
          type="button"
          onClick={onSelectEven}
          className="px-2.5 py-1 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary font-medium flex items-center gap-1 transition-colors"
        >
          <Hash className="w-3.5 h-3.5" weight="bold" />
          <span>Even Pages</span>
        </button>
      </div>
    </div>
  );
};
