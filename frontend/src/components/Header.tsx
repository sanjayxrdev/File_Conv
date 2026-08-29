import React, { useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowsLeftRight,
  GridFour,
  GitMerge,
  FileText,
  Scan,
  ClockCounterClockwise,
  Sun,
  Moon
} from '@phosphor-icons/react';
import gsap from 'gsap';
import { useHistory } from '../context/HistoryContext';
import { useTheme } from '../context/ThemeContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);

  const { history, openDrawer } = useHistory();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  const navLinks = [
    {
      label: 'OCR Studio',
      path: '/ocr-converter',
      icon: <Scan className="w-3.5 h-3.5" weight="bold" />,
      badge: 'AI Core',
    },
    {
      label: 'PDF Tools',
      path: '/pdf/rearrange',
      icon: <FileText className="w-3.5 h-3.5" weight="bold" />,
    },
    {
      label: 'Merge',
      path: '/merge-converter',
      icon: <GitMerge className="w-3.5 h-3.5" weight="bold" />,
    },
    {
      label: 'Formats',
      path: '/formats',
      icon: <GridFour className="w-3.5 h-3.5" weight="bold" />,
    },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-surface-canvas/90 backdrop-blur-md border-b border-surface-border transition-colors font-sans"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-card bg-ink-primary text-surface-canvas flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
            <ArrowsLeftRight className="w-4 h-4" weight="bold" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-ink-primary">
            FILE CONV
          </span>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-xs font-semibold transition-all duration-150 relative ${
                  isActive
                    ? 'text-ink-primary bg-surface-raised border border-surface-border shadow-2xs'
                    : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions (Theme Toggle & History Drawer) */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Icon Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-card bg-surface-raised border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-card transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" weight="bold" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" weight="bold" />
            )}
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={openDrawer}
            className="relative p-2 rounded-card bg-surface-raised border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-card transition-all"
            title="Conversion History"
          >
            <ClockCounterClockwise className="w-4 h-4" weight="bold" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-700 text-white text-[9px] font-bold flex items-center justify-center">
                {history.length > 9 ? '9+' : history.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
