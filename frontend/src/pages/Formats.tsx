import React, { useEffect, useRef, useState } from 'react';
import { FormatsRegistryResponse } from '../types';
import { MagnifyingGlass, Cpu, Stack } from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FormatsProps {
  registry: FormatsRegistryResponse | null;
}

export const Formats: React.FC<FormatsProps> = ({ registry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const headerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(headerRef.current!.querySelector('.badge'), {
        y: -10,
        opacity: 0,
        duration: 0.4,
      })
      .from(headerRef.current!.querySelector('h1'), {
        y: 20,
        opacity: 0,
        duration: 0.5,
      }, "-=0.2")
      .from(headerRef.current!.querySelector('p'), {
        y: 15,
        opacity: 0,
        duration: 0.4,
      }, "-=0.3");
    }, headerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!filterRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(filterRef.current, {
        scrollTrigger: {
          trigger: filterRef.current,
          start: "top 85%",
          once: true,
        },
        y: 12,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }, filterRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const items = containerRef.current!.children;
      if (items.length > 0) {
        gsap.from(items, {
          scrollTrigger: {
            trigger: containerRef.current!,
            start: "top 85%",
            once: true,
          },
          y: 16,
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: "power2.out",
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [registry, searchQuery, selectedCategory]);

  if (!registry) {
    return (
      <div className="text-center py-20 text-ink-muted">
        <div className="w-6 h-6 mx-auto border-2 border-ink-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm">Loading format matrix...</span>
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
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

      {/* Header */}
      <div ref={headerRef} className="text-center space-y-3">
        <div className="badge inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised border border-surface-border text-xs font-mono text-ink-muted">
          <Stack className="w-3.5 h-3.5" weight="bold" />
          <span>Format Support Matrix</span>
        </div>

        <h1 className="font-serif text-4xl text-ink-primary">
          Supported conversion matrix
        </h1>

        <p className="text-ink-muted text-sm max-w-lg mx-auto">
          FILE CONV validates every format route against our backend conversion matrix to guarantee valid outputs.
        </p>
      </div>

      {/* Search & Category Filters */}
      <div ref={filterRef} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-card-lg bg-surface-card border border-surface-border">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" weight="bold" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formats..."
            className="w-full pl-9 pr-4 py-2 rounded-card bg-surface-raised border border-surface-border text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-ink-primary/30 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-card text-[11px] font-medium uppercase transition-all ${
                selectedCategory === cat
                  ? 'bg-ink-primary text-white'
                  : 'bg-surface-raised text-ink-muted hover:text-ink-primary border border-surface-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Format Entries */}
      <div ref={containerRef} className="space-y-3">
        {filteredEntries.map(([sourceExt, sourceInfo]) => (
          <div
            key={sourceExt}
            className="p-5 rounded-card-lg bg-surface-card border border-surface-border space-y-3 hover:border-ink-faint/50 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-3">
                <kbd className="uppercase text-[11px]">.{sourceExt}</kbd>
                <span className="font-semibold text-ink-primary text-sm tracking-tight">{sourceInfo.label}</span>
              </div>
              <span className="text-[10px] text-ink-muted uppercase font-mono px-2 py-0.5 rounded bg-surface-raised border border-surface-border">
                {sourceInfo.category}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">
                Valid target routes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sourceInfo.targets.map((t) => (
                  <div
                    key={t.target_ext}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-card bg-surface-raised border border-surface-border text-[11px]"
                  >
                    <kbd className="uppercase text-[10px]">.{t.target_ext}</kbd>
                    <span className="text-ink-faint">&middot;</span>
                    <span className="text-ink-muted flex items-center gap-1 font-mono">
                      <Cpu className="w-3 h-3" weight="bold" />
                      {t.engine}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-ink-muted text-sm">
            No formats found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
