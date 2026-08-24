import React from 'react';
import {
  X,
  ClockCounterClockwise,
  DownloadSimple,
  Trash,
  File,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock
} from '@phosphor-icons/react';
import { useHistory } from '../context/HistoryContext';

export const HistoryDrawer: React.FC = () => {
  const { history, isDrawerOpen, closeDrawer, removeHistoryItem, clearHistory } = useHistory();

  if (!isDrawerOpen) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs animate-fade-in font-sans"
      onClick={closeDrawer}
    >
      <div
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-surface-card border-l border-surface-border shadow-xl flex flex-col justify-between animate-slide-left">
          {/* Header */}
          <div className="p-6 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-card bg-surface-raised border border-surface-border flex items-center justify-center text-ink-primary">
                <ClockCounterClockwise className="w-4 h-4" weight="bold" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink-primary">Conversion History</h3>
                <p className="text-[11px] text-ink-muted">
                  {history.length} {history.length === 1 ? 'record' : 'records'} in session
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="px-2.5 py-1 rounded text-[11px] font-medium text-ink-muted hover:text-accent-red-text hover:bg-accent-red transition-all"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-card text-ink-muted hover:text-ink-primary hover:bg-surface-raised transition-all"
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>
          </div>

          {/* Body: Items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-20 space-y-3 text-ink-muted">
                <ClockCounterClockwise className="w-10 h-10 mx-auto opacity-30 text-ink-muted" weight="bold" />
                <p className="text-xs font-semibold text-ink-primary">No conversion history yet</p>
                <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                  Files you convert or process will appear here and persist across page refreshes.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id || item.job_id}
                  className="p-3.5 rounded-card bg-surface-raised border border-surface-border space-y-2.5 hover:border-ink-faint transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded bg-surface-card border border-surface-border flex items-center justify-center shrink-0 text-ink-primary">
                        <File className="w-3.5 h-3.5" weight="bold" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-xs text-ink-primary truncate max-w-[200px]">
                          {item.original_filename}
                        </h4>
                        <div className="text-[10px] text-ink-muted flex items-center gap-1.5 mt-0.5">
                          <span>{formatTime(item.created_at)}</span>
                          {item.output_size_bytes ? (
                            <>
                              <span>&middot;</span>
                              <span>{formatSize(item.output_size_bytes)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeHistoryItem(item.job_id)}
                      className="p-1 rounded text-ink-muted hover:text-accent-red-text transition-colors"
                      title="Remove from history"
                    >
                      <Trash className="w-3.5 h-3.5" weight="bold" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-surface-border text-[11px]">
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="uppercase text-ink-muted">.{item.source_format}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-ink-faint" />
                      <span className="uppercase font-bold text-ink-primary">.{item.target_format}</span>
                    </div>

                    {item.status === 'completed' && item.download_url ? (
                      <a
                        href={item.download_url}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ink-primary text-surface-canvas font-semibold text-[10px] hover:opacity-90 transition-all"
                      >
                        <DownloadSimple className="w-3 h-3" weight="bold" />
                        <span>Download</span>
                      </a>
                    ) : item.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-accent-red-text font-medium">
                        <XCircle className="w-3 h-3" weight="bold" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 font-medium">
                        <Clock className="w-3 h-3 animate-spin" weight="bold" />
                        <span>Processing</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-border text-center text-[11px] text-ink-muted">
            <span>Local-first storage &bull; Zero telemetry tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
