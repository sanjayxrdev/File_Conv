import React, { useEffect, useRef, useState } from 'react';
import { FormatsRegistryResponse } from '../types';
import { Cpu, Search, Sparkles } from 'lucide-react';
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
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }, [registry, searchQuery, selectedCategory]);

  if (!registry) {
    return (
      <div className="text-center py-20 text-slate-500">
        <div className="w-8 h-8 mx-auto border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
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
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 bg-[#f8f9fa]">
      {/* Header Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Format Support Matrix</span>
        </div>

        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Supported Conversion Matrix
        </h2>

        <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
          FILE CONV strictly enforces supported format routes to guarantee 100% valid conversion outputs.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formats (e.g., pdf, pptx, py)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-medium transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
            className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-red-100 text-red-600 border border-red-200 text-xs font-mono font-bold uppercase">
                  .{sourceExt}
                </span>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">{sourceInfo.label}</span>
              </div>
              <span className="text-[11px] text-slate-600 uppercase font-mono px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold">
                {sourceInfo.category}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Valid Target Routes:
              </div>
              <div className="flex flex-wrap gap-2">
                {sourceInfo.targets.map((t) => (
                  <div
                    key={t.target_ext}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 hover:border-slate-300 transition-colors"
                  >
                    <span className="font-mono font-extrabold text-red-600 uppercase">.{t.target_ext}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 flex items-center gap-1.5 font-mono text-[11px] font-medium">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" />
                      {t.engine}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            No formats found matching your search query.
          </div>
        )}
      </div>
    </div>
  );
};

