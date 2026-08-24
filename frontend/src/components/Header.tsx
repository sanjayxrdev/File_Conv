import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowsLeftRight,
  GridFour,
  GitMerge,
  FileText,
  Scan,
  ClockCounterClockwise,
  User,
  SignOut,
  Sparkle,
  CaretDown,
  Sun,
  Moon
} from '@phosphor-icons/react';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme } from '../context/ThemeContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { history, openDrawer } = useHistory();
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-surface-canvas/95 backdrop-blur-md border-b border-surface-border transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-card bg-ink-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-150">
            <ArrowsLeftRight className="w-3.5 h-3.5 text-surface-canvas" weight="bold" />
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-ink-primary">
            FILE CONV
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 font-sans">
          <Link
            to="/ocr-converter"
            className={`px-3 py-1.5 rounded-card text-xs font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === '/ocr-converter'
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
            }`}
          >
            <Scan className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" weight="bold" />
            <span>OCR Studio</span>
          </Link>

          <Link
            to="/pdf/rearrange"
            className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all flex items-center gap-1.5 ${
              location.pathname.startsWith('/pdf')
                ? 'bg-ink-primary text-surface-canvas'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
            }`}
          >
            <FileText className="w-3.5 h-3.5" weight="bold" />
            <span>PDF Tools</span>
          </Link>

          <Link
            to="/merge-converter"
            className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all flex items-center gap-1.5 ${
              location.pathname === '/merge-converter'
                ? 'bg-ink-primary text-surface-canvas'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" weight="bold" />
            <span>Merge</span>
          </Link>

          <Link
            to="/formats"
            className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all flex items-center gap-1.5 ${
              location.pathname === '/formats'
                ? 'bg-ink-primary text-surface-canvas'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
            }`}
          >
            <GridFour className="w-3.5 h-3.5" weight="bold" />
            <span>Formats</span>
          </Link>
        </nav>

        {/* Right Actions */}
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

          {/* User Auth Profile / Login */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-card bg-surface-raised border border-surface-border hover:bg-surface-card transition-all text-xs text-ink-primary font-medium"
              >
                <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 flex items-center justify-center font-bold text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                <CaretDown className="w-3 h-3 text-ink-muted" weight="bold" />
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-card-lg bg-surface-card border border-surface-border shadow-md p-3 space-y-3 z-50 animate-fade-in text-xs">
                  <div className="pb-2 border-b border-surface-border">
                    <div className="font-semibold text-ink-primary truncate">{user.name}</div>
                    <div className="text-[11px] text-ink-muted truncate">{user.email}</div>
                    <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-semibold border border-purple-200 dark:border-purple-800/50">
                      <Sparkle className="w-3 h-3" weight="fill" />
                      <span>{user.plan}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-ink-secondary">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Total Conversions</span>
                      <span className="font-mono font-semibold text-ink-primary">{user.total_conversions}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Session Storage</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Active & Synced</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-border">
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-accent-red-text hover:bg-accent-red/20 text-xs font-semibold transition-all"
                    >
                      <SignOut className="w-3.5 h-3.5" weight="bold" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface-raised border border-surface-border text-xs font-semibold text-ink-primary hover:bg-surface-card transition-all"
            >
              <User className="w-3.5 h-3.5 text-ink-muted" weight="bold" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-150"
          >
            Convert
          </button>
        </div>
      </div>
    </header>
  );
};

