import React, { useState, useEffect } from 'react';
import { parsePageRangeString } from '../../utils/pdfPageRangeParser';
import { WarningCircle, CheckCircle } from '@phosphor-icons/react';

interface PageRangeInputProps {
  totalPages: number;
  value: string;
  onChange: (value: string, validIndices: number[], isValid: boolean) => void;
  placeholder?: string;
  label?: string;
  description?: string;
}

export const PageRangeInput: React.FC<PageRangeInputProps> = ({
  totalPages,
  value,
  onChange,
  placeholder = 'e.g. 1-5, 8, 10-12',
  label = 'Enter Page Ranges',
  description = 'Separate individual pages with commas, or ranges with hyphens.',
}) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(0);

  useEffect(() => {
    if (!value || !value.trim()) {
      setError(null);
      setSelectedCount(0);
      onChange(value, [], false);
      return;
    }

    const res = parsePageRangeString(value, totalPages);
    if (!res.valid) {
      setError(res.error || 'Invalid page range.');
      setSelectedCount(0);
      onChange(value, [], false);
    } else {
      setError(null);
      setSelectedCount(res.indices.length);
      onChange(value, res.indices, true);
    }
  }, [value, totalPages]);

  return (
    <div className="space-y-1.5 font-sans">
      {label && <label className="block text-xs font-semibold text-ink-primary">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, [], false)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-card bg-surface-card border text-ink-primary text-xs font-mono focus:outline-none transition-colors ${
          error
            ? 'border-red-400 focus:border-red-600'
            : 'border-surface-border focus:border-ink-primary'
        }`}
      />
      {description && <p className="text-[11px] text-ink-muted leading-tight">{description}</p>}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-sans mt-1">
          <WarningCircle className="w-3.5 h-3.5 shrink-0" weight="bold" />
          <span>{error}</span>
        </div>
      )}

      {!error && selectedCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 font-sans mt-1">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" weight="bold" />
          <span>
            {selectedCount} {selectedCount === 1 ? 'page' : 'pages'} selected
          </span>
        </div>
      )}
    </div>
  );
};
