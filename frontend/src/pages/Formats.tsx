import React, { useEffect, useRef, useState } from 'react';
import { FormatsRegistryResponse } from '../types';
import { Cpu, Search, Sparkles, Filter } from 'lucide-react';
import gsap from 'gsap';

interface FormatsProps {
  registry: FormatsRegistryResponse | null;
}

export const Formats: React.FC<FormatsProps> = ({ registry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && registry) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [registry, searchQuery, selectedCategory]);

  if (!registry) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        Loading supported conversion matrix...
      </div>
    );
  }

  const categories = ['all', ...registry.categories];
  const formatEntries = Object.entries(registry.formats);

  const filteredEntries = formatEntries.filter(([sourceExt, sourceInfo]) => {
    const matchesSearch =
      sourceExt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sourceInfo.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sourceInfo.targets.some((t) => t.target_ext.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || sourceInfo.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Single Source of Truth Matrix</span>
        </div>

        <h2 className="text-4xl font-black text-white tracking-tight">
          Supported Conversion Matrix
        </h2>

        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          FILE CONV strictly enforces supported format routes to guarantee 100% valid conversion outputs without silent corruptions.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formats (e.g., pdf, pptx, py)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Format Entries Cards Grid */}
      <div ref={containerRef} className="space-y-4">
        {filteredEntries.map(([sourceExt, sourceInfo]) => (
          <div
            key={sourceExt}
            className="p-6 rounded-3xl glass-card border border-white/5 space-y-4 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold uppercase">
                  .{sourceExt}
                </span>
                <span className="font-bold text-white text-lg tracking-tight">{sourceInfo.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 uppercase font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-semibold">
                {sourceInfo.category}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Valid Target Routes:
              </div>
              <div className="flex flex-wrap gap-2">
                {sourceInfo.targets.map((t) => (
                  <div
                    key={t.target_ext}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition-colors"
                  >
                    <span className="font-mono font-bold text-blue-400 uppercase">.{t.target_ext}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      {t.engine}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No formats found matching your search query.
          </div>
        )}
      </div>
    </div>
  );
};
