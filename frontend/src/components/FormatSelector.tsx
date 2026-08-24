import React, { useRef, useState, useEffect } from 'react';
import { TargetFormatInfo, FormatOption } from '../types';
import { SlidersHorizontal } from '@phosphor-icons/react';
import gsap from 'gsap';

interface FormatSelectorProps {
  targets: TargetFormatInfo[];
  selectedTarget: string;
  onSelectTarget: (targetExt: string) => void;
  options: Record<string, any>;
  onOptionsChange: (options: Record<string, any>) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  targets = [],
  selectedTarget,
  onSelectTarget,
  options,
  onOptionsChange,
}) => {
  const safeTargets = targets || [];
  const currentTargetObj = safeTargets.length > 0 ? (safeTargets.find((t) => t.target_ext === selectedTarget) || safeTargets[0]) : null;
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || !gridRef.current.children || gridRef.current.children.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(gridRef.current!.children, {
        y: 12,
        opacity: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: "power3.out",
      });
    }, gridRef);
    return () => ctx.revert();
  }, [safeTargets.length]);

  const handleOptionUpdate = (optName: string, value: any) => {
    onOptionsChange({ ...options, [optName]: value });
  };

  return (
    <div className="w-full space-y-4">
      {/* Target Format Selector Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Suggested Conversion Formats ({safeTargets.length})
          </label>
          <span className="text-[10px] text-ink-muted bg-surface-raised px-2 py-0.5 rounded-full border border-surface-border font-medium">
            Select Target Format
          </span>
        </div>
        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {safeTargets.map((t, idx) => {
            const isSelected = t.target_ext === selectedTarget;
            const isRecommended = idx === 0;
            return (
              <button
                key={t.target_ext}
                onClick={() => onSelectTarget(t.target_ext)}
                type="button"
                className={`p-3.5 rounded-card text-left border transition-all relative overflow-hidden ${
                  isSelected
                    ? "border-ink-primary bg-ink-primary text-white shadow-sm scale-[1.01]"
                    : "border-surface-border bg-surface-card hover:border-ink-faint text-ink-secondary hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs uppercase font-mono tracking-wide">{t.target_ext}</span>
                  {isRecommended && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                        isSelected ? "bg-white/20 text-white" : "bg-accent-red/20 text-accent-red-text"
                      }`}
                    >
                      Top Pick
                    </span>
                  )}
                </div>
                <div className={`text-[11px] truncate font-medium ${isSelected ? "text-white/80" : "text-ink-muted"}`}>
                  {t.label}
                </div>
                {t.category && (
                  <div className={`text-[9px] uppercase font-mono mt-1 tracking-wider ${isSelected ? "text-white/50" : "text-ink-faint"}`}>
                    &bull; {t.category}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Context-Sensitive Options */}
      {currentTargetObj && currentTargetObj.options && currentTargetObj.options.length > 0 && (
        <div className="p-4 rounded-card bg-surface-raised border border-surface-border space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5" weight="bold" />
            <span>Options ({currentTargetObj.target_ext.toUpperCase()})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentTargetObj.options.map((opt: FormatOption) => (
              <div key={opt.name}>
                <label className="block text-xs text-ink-muted mb-1">{opt.label}</label>
                {opt.type === 'select' && (
                  <select
                    value={options[opt.name] ?? opt.default}
                    onChange={(e) => handleOptionUpdate(opt.name, e.target.value)}
                    className="w-full bg-surface-card border border-surface-border rounded-card px-3 py-1.5 text-xs text-ink-primary focus:border-ink-primary/30 focus:outline-none"
                  >
                    {opt.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}

                {opt.type === 'number' && (
                  <input
                    type="number"
                    min={opt.min}
                    max={opt.max}
                    value={options[opt.name] ?? opt.default}
                    onChange={(e) => handleOptionUpdate(opt.name, Number(e.target.value))}
                    className="w-full bg-surface-card border border-surface-border rounded-card px-3 py-1.5 text-xs text-ink-primary focus:border-ink-primary/30 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
