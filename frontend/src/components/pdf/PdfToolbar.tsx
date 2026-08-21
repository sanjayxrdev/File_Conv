import React from 'react';
import { ArrowCounterClockwise, ArrowClockwise, Trash } from '@phosphor-icons/react';

interface PdfToolbarProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  selectedCount?: number;
  onRotateSelected?: () => void;
  onDeleteSelected?: () => void;
  onReset?: () => void;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  selectedCount = 0,
  onRotateSelected,
  onDeleteSelected,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-card border border-surface-border rounded-card p-2.5 font-sans text-xs">
      <div className="flex items-center gap-1">
        {onUndo && (
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="px-2.5 py-1.5 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary disabled:opacity-40 disabled:hover:bg-surface-raised font-medium flex items-center gap-1 transition-colors"
            title="Undo last change"
          >
            <ArrowCounterClockwise className="w-3.5 h-3.5" weight="bold" />
            <span>Undo</span>
          </button>
        )}

        {onRedo && (
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="px-2.5 py-1.5 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary disabled:opacity-40 disabled:hover:bg-surface-raised font-medium flex items-center gap-1 transition-colors"
            title="Redo change"
          >
            <ArrowClockwise className="w-3.5 h-3.5" weight="bold" />
            <span>Redo</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {selectedCount > 0 && onRotateSelected && (
          <button
            type="button"
            onClick={onRotateSelected}
            className="px-2.5 py-1.5 rounded-card bg-surface-raised hover:bg-surface-border text-ink-primary font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowClockwise className="w-3.5 h-3.5" weight="bold" />
            <span>Rotate Selected ({selectedCount})</span>
          </button>
        )}

        {selectedCount > 0 && onDeleteSelected && (
          <button
            type="button"
            onClick={onDeleteSelected}
            className="px-2.5 py-1.5 rounded-card bg-red-50 hover:bg-red-100 text-red-700 font-medium flex items-center gap-1 transition-colors"
          >
            <Trash className="w-3.5 h-3.5" weight="bold" />
            <span>Delete Selected ({selectedCount})</span>
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-card text-ink-muted hover:text-ink-primary hover:bg-surface-raised transition-colors"
          >
            Reset All
          </button>
        )}
      </div>
    </div>
  );
};
