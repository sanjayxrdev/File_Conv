import React from 'react';
import { TargetFormatInfo, FormatOption } from '../types';
import { Sliders } from 'lucide-react';

interface FormatSelectorProps {
  targets: TargetFormatInfo[];
  selectedTarget: string;
  onSelectTarget: (targetExt: string) => void;
  options: Record<string, any>;
  onOptionsChange: (options: Record<string, any>) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  targets,
  selectedTarget,
  onSelectTarget,
  options,
  onOptionsChange,
}) => {
  const currentTargetObj = targets.find((t) => t.target_ext === selectedTarget) || targets[0];

  const handleOptionUpdate = (optName: string, value: any) => {
    onOptionsChange({ ...options, [optName]: value });
  };

  return (
    <div className="w-full space-y-4">
      {/* Target Format Selector Grid */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Convert To Format
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {targets.map((t) => {
            const isSelected = t.target_ext === selectedTarget;
            return (
              <button
                key={t.target_ext}
                onClick={() => onSelectTarget(t.target_ext)}
                type="button"
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-500/10'
                    : 'border-slate-800 bg-dark-card hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold text-sm uppercase">{t.target_ext}</div>
                <div className="text-[11px] text-slate-400 truncate">{t.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Context-Sensitive Options */}
      {currentTargetObj && currentTargetObj.options && currentTargetObj.options.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Conversion Options ({currentTargetObj.target_ext.toUpperCase()})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentTargetObj.options.map((opt: FormatOption) => (
              <div key={opt.name}>
                <label className="block text-xs text-slate-400 mb-1">{opt.label}</label>
                {opt.type === 'select' && (
                  <select
                    value={options[opt.name] ?? opt.default}
                    onChange={(e) => handleOptionUpdate(opt.name, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
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
