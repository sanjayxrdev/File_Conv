import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  Scan,
  FileText,
  GitMerge,
  GridFour,
  ArrowsClockwise,
  ArrowRight,
  Sparkle,
  X,
  FileCode
} from '@phosphor-icons/react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: React.ReactNode;
  shortcut?: string;
}

export const QuickCommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    {
      id: 'ocr',
      title: 'Docling OCR Studio (AI Layout & Tables)',
      category: 'AI Document Intelligence',
      path: '/ocr-converter',
      icon: <Scan className="w-4 h-4 text-purple-500" weight="bold" />,
      shortcut: 'OCR',
    },
    {
      id: 'pdf-rearrange',
      title: 'PDF Rearrange Pages (Visual Canvas)',
      category: 'PDF Studio',
      path: '/pdf/rearrange',
      icon: <FileText className="w-4 h-4 text-blue-500" weight="bold" />,
    },
    {
      id: 'pdf-split',
      title: 'PDF Splitter (Extract Ranges & Pages)',
      category: 'PDF Studio',
      path: '/pdf/split',
      icon: <FileText className="w-4 h-4 text-blue-500" weight="bold" />,
    },
    {
      id: 'pdf-compare',
      title: 'PDF Side-by-Side Visual Compare',
      category: 'PDF Studio',
      path: '/pdf/compare',
      icon: <FileText className="w-4 h-4 text-blue-500" weight="bold" />,
    },
    {
      id: 'pdf-protect',
      title: 'PDF Protect & Password Encryption',
      category: 'PDF Studio',
      path: '/pdf/protect',
      icon: <FileText className="w-4 h-4 text-blue-500" weight="bold" />,
    },
    {
      id: 'pdf-sign',
      title: 'PDF Transparent Signature Stamper',
      category: 'PDF Studio',
      path: '/pdf/transparent-signature',
      icon: <FileText className="w-4 h-4 text-blue-500" weight="bold" />,
    },
    {
      id: 'merge',
      title: 'Merge Files (PDF, PPTX, DOCX, Images)',
      category: 'File Utilities',
      path: '/merge-converter',
      icon: <GitMerge className="w-4 h-4 text-emerald-500" weight="bold" />,
    },
    {
      id: 'formats',
      title: 'Matrix Directory & 100+ Format Registry',
      category: 'Discovery',
      path: '/formats',
      icon: <GridFour className="w-4 h-4 text-amber-500" weight="bold" />,
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    navigate(item.path);
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-card-lg bg-surface-card border border-surface-border shadow-2xl overflow-hidden animate-scale-up">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-border bg-surface-card">
          <MagnifyingGlass className="w-4 h-4 text-ink-muted shrink-0" weight="bold" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools, conversions, PDF utilities... (Ctrl+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            className="w-full bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" weight="bold" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted font-mono">
              No matching tools found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-card text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-ink-primary text-surface-canvas shadow-xs'
                      : 'hover:bg-surface-raised text-ink-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-card border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-surface-card border-surface-border'
                          : 'bg-surface-raised border-surface-border'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div
                        className={`font-semibold ${
                          isSelected ? 'text-surface-canvas' : 'text-ink-primary'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isSelected ? 'opacity-70 text-surface-canvas' : 'text-ink-muted'
                        }`}
                      >
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                          isSelected
                            ? 'bg-surface-card text-ink-primary'
                            : 'bg-surface-raised border border-surface-border text-ink-muted'
                        }`}
                      >
                        {item.shortcut}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" weight="bold" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts tip */}
        <div className="flex items-center justify-between px-4 py-2 bg-surface-raised border-t border-surface-border text-[11px] font-mono text-ink-muted">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Jump</span>
            <span>ESC Close</span>
          </div>
          <span>Local Engine 100% Active</span>
        </div>
      </div>
    </div>
  );
};
