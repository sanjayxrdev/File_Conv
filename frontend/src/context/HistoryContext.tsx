import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { HistoryEntry } from '../types';
import { apiGetHistory, apiRecordHistory, apiDeleteHistory, apiClearHistory } from '../services/api';

interface HistoryContextType {
  history: HistoryEntry[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addHistoryItem: (entry: {
    job_id: string;
    original_filename: string;
    source_format: string;
    target_format: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    download_url?: string;
    output_size_bytes?: number;
  }) => Promise<void>;
  removeHistoryItem: (jobId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Clean up any legacy permanent localStorage history
  try {
    localStorage.removeItem('fileconv_local_history');
    localStorage.removeItem('fileconv_session_id');
  } catch {}

  const [sessionId] = useState<string>(() => {
    const existing = sessionStorage.getItem('fileconv_session_id');
    if (existing) return existing;
    const newId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('fileconv_session_id', newId);
    return newId;
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const session = sessionStorage.getItem('fileconv_session_history');
    return session ? JSON.parse(session) : [];
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refreshHistory = useCallback(async () => {
    try {
      const serverHistory = await apiGetHistory(sessionId);
      if (serverHistory && serverHistory.length > 0) {
        setHistory(serverHistory);
        sessionStorage.setItem('fileconv_session_history', JSON.stringify(serverHistory));
      }
    } catch (e) {
      console.warn('Failed syncing server history:', e);
    }
  }, [sessionId]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const addHistoryItem = async (entry: {
    job_id: string;
    original_filename: string;
    source_format: string;
    target_format: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    download_url?: string;
    output_size_bytes?: number;
  }) => {
    const newItem: HistoryEntry = {
      id: `hist_${Date.now()}`,
      job_id: entry.job_id,
      original_filename: entry.original_filename,
      source_format: entry.source_format,
      target_format: entry.target_format,
      status: entry.status,
      download_url: entry.download_url,
      output_size_bytes: entry.output_size_bytes,
      created_at: new Date().toISOString(),
      session_id: sessionId,
    };

    setHistory((prev) => {
      const filtered = prev.filter((h) => h.job_id !== entry.job_id);
      const next = [newItem, ...filtered].slice(0, 50);
      sessionStorage.setItem('fileconv_session_history', JSON.stringify(next));
      return next;
    });

    try {
      await apiRecordHistory({
        ...entry,
        session_id: sessionId,
      });
    } catch (e) {
      console.warn('Failed recording history on backend:', e);
    }
  };

  const removeHistoryItem = async (jobId: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.job_id !== jobId);
      sessionStorage.setItem('fileconv_session_history', JSON.stringify(next));
      return next;
    });

    try {
      await apiDeleteHistory(jobId, sessionId);
    } catch (e) {
      console.warn('Failed deleting history item:', e);
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    sessionStorage.removeItem('fileconv_session_history');
    try {
      await apiClearHistory(sessionId);
    } catch (e) {
      console.warn('Failed clearing history:', e);
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <HistoryContext.Provider
      value={{
        history,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addHistoryItem,
        removeHistoryItem,
        clearHistory,
        refreshHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
