import React, { useState } from 'react';
import { X, Lock, Envelope, User, Lightning, ShieldCheck, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, loginDemo, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name.');
          return;
        }
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    try {
      await loginDemo();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-in font-sans">
      <div
        className="w-full max-w-md bg-surface-card border border-surface-border rounded-card-lg p-6 sm:p-8 shadow-lg relative space-y-6 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-card text-ink-muted hover:text-ink-primary hover:bg-surface-raised transition-all"
        >
          <X className="w-4 h-4" weight="bold" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="w-12 h-12 mx-auto rounded-card bg-surface-raised border border-surface-border flex items-center justify-center text-ink-primary mb-3">
            <Lock className="w-6 h-6" weight="bold" />
          </div>
          <h2 className="font-sans font-bold text-2xl text-ink-primary">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            {mode === 'login'
              ? 'Access your conversion history and synchronized cloud backups.'
              : 'Save history across devices and unlock unrestricted conversions.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-surface-raised rounded-card border border-surface-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded text-center transition-all ${
              mode === 'login'
                ? 'bg-surface-card text-ink-primary shadow-xs'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded text-center transition-all ${
              mode === 'register'
                ? 'bg-surface-card text-ink-primary shadow-xs'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-card bg-accent-red border border-accent-red-text/20 text-accent-red-text text-xs font-medium flex items-center gap-2.5">
            <WarningCircle className="w-4 h-4 shrink-0" weight="bold" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-secondary">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Alex Rivers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-raised border border-surface-border rounded-card pl-10 pr-3.5 py-2.5 text-xs text-ink-primary placeholder:text-ink-faint focus:border-ink-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Email Address</label>
            <div className="relative">
              <Envelope className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-raised border border-surface-border rounded-card pl-10 pr-3.5 py-2.5 text-xs text-ink-primary placeholder:text-ink-faint focus:border-ink-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-raised border border-surface-border rounded-card pl-10 pr-3.5 py-2.5 text-xs text-ink-primary placeholder:text-ink-faint focus:border-ink-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-card bg-ink-primary text-surface-canvas text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-surface-canvas/30 border-t-surface-canvas rounded-full animate-spin" />
            ) : (
              <span>{mode === 'login' ? 'Sign In to Account' : 'Complete Registration'}</span>
            )}
          </button>
        </form>

        {/* 1-Click Demo Login */}
        <div className="pt-2 border-t border-surface-border text-center space-y-2">
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-card bg-accent-purple text-accent-purple-text border border-accent-purple-text/20 text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Lightning className="w-3.5 h-3.5" weight="fill" />
            <span>1-Click Instant Demo Login</span>
          </button>
          <p className="text-[11px] text-ink-muted">
            Guest sessions automatically persist locally without sign-in.
          </p>
        </div>
      </div>
    </div>
  );
};
