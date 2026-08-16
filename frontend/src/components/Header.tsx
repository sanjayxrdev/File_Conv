import React, { useEffect, useRef } from 'react';
import { Layers, Combine, HelpCircle, FileCheck2, Sparkles } from 'lucide-react';
import gsap from 'gsap';

interface HeaderProps {
  currentTab: 'home' | 'merge' | 'formats' | 'about';
  onNavigate: (tab: 'home' | 'merge' | 'formats' | 'about') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onNavigate }) => {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  const navItems = [
    { id: 'home', label: 'Convert Files', icon: Layers },
    { id: 'merge', label: 'Merge Files', icon: Combine },
    { id: 'formats', label: 'Matrix', icon: FileCheck2 },
    { id: 'about', label: 'About & API', icon: HelpCircle },
  ] as const;

  return (
    <header className="sticky top-0 z-50 px-4 py-4 max-w-6xl mx-auto w-full">
      <div
        ref={navRef}
        className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl border border-white/10"
      >
        {/* Brand Logo & Emblem */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <span>FILE CONV</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Local-First Conversion Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-blue-600/30 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
