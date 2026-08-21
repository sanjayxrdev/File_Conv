import React from 'react';
import { WarningCircle, ArrowCounterClockwise } from '@phosphor-icons/react';

interface PdfErrorStateProps {
  title?: string;
  error?: string | null;
  onRetry?: () => void;
  onReset?: () => void;
}

export const PdfErrorState: React.FC<PdfErrorStateProps> = ({
  title = 'Processing Error',
  error = 'An unexpected error occurred during PDF processing.',
  onRetry,
  onReset,
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-card-lg p-6 text-center space-y-4 font-sans">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
        <WarningCircle className="w-7 h-7" weight="bold" />
      </div>

      <div>
        <h3 className="font-serif text-xl text-red-900 font-normal">{title}</h3>
        <p className="text-red-700 text-xs sm:text-sm mt-1 max-w-md mx-auto leading-relaxed">
          {error}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-card bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
          >
            Try Again
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-card bg-surface-card border border-surface-border text-ink-primary text-xs font-semibold hover:bg-surface-raised transition-colors flex items-center gap-1.5"
          >
            <ArrowCounterClockwise className="w-3.5 h-3.5" weight="bold" />
            <span>Choose Another File</span>
          </button>
        )}
      </div>
    </div>
  );
};
