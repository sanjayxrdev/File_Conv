import React, { useState } from 'react';
import {
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  Trash,
  ArrowClockwise,
  DotsSixVertical,
  Check,
} from '@phosphor-icons/react';

export interface PdfPageItem {
  id: string;
  originalIndex: number;
  dataUrl?: string;
  rotation?: number; // 0, 90, 180, 270
}

interface PdfPageThumbnailGridProps {
  pages: PdfPageItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onMoveLeft?: (index: number) => void;
  onMoveRight?: (index: number) => void;
  onMoveToStart?: (index: number) => void;
  onMoveToEnd?: (index: number) => void;
  onRotate?: (index: number) => void;
  onDelete?: (index: number) => void;
  onReorder?: (newPages: PdfPageItem[]) => void;
  showControls?: boolean;
  selectable?: boolean;
}

export const PdfPageThumbnailGrid: React.FC<PdfPageThumbnailGridProps> = ({
  pages,
  selectedIds = [],
  onToggleSelect,
  onMoveLeft,
  onMoveRight,
  onMoveToStart,
  onMoveToEnd,
  onRotate,
  onDelete,
  onReorder,
  showControls = true,
  selectable = true,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !onReorder) return;

    const updated = [...pages];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    onReorder(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {pages.map((page, index) => {
        const isSelected = selectedIds.includes(page.id);
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={page.id}
            draggable={!!onReorder}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => selectable && onToggleSelect && onToggleSelect(page.id)}
            className={`group relative bg-surface-card border rounded-card-lg p-3 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-ink-primary ring-2 ring-ink-primary/20 bg-surface-raised'
                : 'border-surface-border hover:border-ink-primary/30 hover:bg-surface-card/80'
            } ${isDragging ? 'opacity-40 scale-95' : ''} ${isDragOver ? 'border-dashed border-2 border-ink-primary' : ''}`}
          >
            {/* Drag Handle & Selection Checkbox Header */}
            <div className="w-full flex items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-1">
                {onReorder && (
                  <span className="p-1 text-ink-faint group-hover:text-ink-muted cursor-grab active:cursor-grabbing">
                    <DotsSixVertical className="w-4 h-4" weight="bold" />
                  </span>
                )}
                <span className="font-mono text-xs font-semibold text-ink-primary bg-surface-raised px-2 py-0.5 rounded border border-surface-border">
                  Page {index + 1}
                </span>
                {page.originalIndex !== index && (
                  <span className="font-mono text-[10px] text-ink-faint">
                    (orig. {page.originalIndex + 1})
                  </span>
                )}
              </div>

              {selectable && (
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-ink-primary border-ink-primary text-surface-canvas' : 'border-surface-border bg-surface-card'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" weight="bold" />}
                </div>
              )}
            </div>

            {/* Thumbnail Canvas / Image */}
            <div className="relative w-full aspect-[3/4] bg-[#F4F3EF] rounded border border-surface-border flex items-center justify-center overflow-hidden my-1">
              {page.dataUrl ? (
                <img
                  src={page.dataUrl}
                  alt={`Page ${index + 1}`}
                  className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-300"
                  style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-ink-faint font-mono text-xs">
                  <span>PDF Page</span>
                  <span className="text-sm font-semibold text-ink-muted">{index + 1}</span>
                </div>
              )}

              {/* Rotation Badge */}
              {page.rotation && page.rotation !== 0 ? (
                <div className="absolute top-2 right-2 bg-ink-primary text-surface-canvas text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs font-bold">
                  {page.rotation}°
                </div>
              ) : null}
            </div>

            {/* Action Buttons Toolbar */}
            {showControls && (
              <div
                className="w-full flex items-center justify-between border-t border-surface-border pt-2 mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Movement Controls */}
                <div className="flex items-center gap-0.5">
                  {onMoveToStart && (
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveToStart(index)}
                      className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-raised disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move to Beginning"
                    >
                      <CaretDoubleLeft className="w-3.5 h-3.5" weight="bold" />
                    </button>
                  )}
                  {onMoveLeft && (
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveLeft(index)}
                      className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-raised disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Left"
                    >
                      <CaretLeft className="w-3.5 h-3.5" weight="bold" />
                    </button>
                  )}
                  {onMoveRight && (
                    <button
                      type="button"
                      disabled={index === pages.length - 1}
                      onClick={() => onMoveRight(index)}
                      className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-raised disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Right"
                    >
                      <CaretRight className="w-3.5 h-3.5" weight="bold" />
                    </button>
                  )}
                  {onMoveToEnd && (
                    <button
                      type="button"
                      disabled={index === pages.length - 1}
                      onClick={() => onMoveToEnd(index)}
                      className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-raised disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move to End"
                    >
                      <CaretDoubleRight className="w-3.5 h-3.5" weight="bold" />
                    </button>
                  )}
                </div>

                {/* Rotate & Delete */}
                <div className="flex items-center gap-0.5">
                  {onRotate && (
                    <button
                      type="button"
                      onClick={() => onRotate(index)}
                      className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-raised"
                      title="Rotate 90° Clockwise"
                    >
                      <ArrowClockwise className="w-3.5 h-3.5" weight="bold" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(index)}
                      className="p-1 rounded text-accent-red hover:text-red-700 hover:bg-red-50"
                      title="Delete Page"
                    >
                      <Trash className="w-3.5 h-3.5" weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
