import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { HistoryEntry } from '../types';
import { apiGetHistory, apiRecordHistory, apiDeleteHistory, apiClearHistory } from '../services/api';
import { useAuth } from './AuthContext';

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
  const { sessionId, token, user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const local = localStorage.getItem('fileconv_local_history');
    return local ? JSON.parse(local) : [];
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refreshHistory = useCallback(async () => {
    try {
      const serverHistory = await apiGetHistory(sessionId, token);
      if (serverHistory && serverHistory.length > 0) {
        setHistory(serverHistory);
        localStorage.setItem('fileconv_local_history', JSON.stringify(serverHistory));
      }
    } catch (e) {
      console.warn('Failed syncing server history:', e);
    }
  }, [sessionId, token]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory, user?.id]);

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
      user_id: user?.id,
      session_id: sessionId,
    };

    setHistory((prev) => {
      const filtered = prev.filter((h) => h.job_id !== entry.job_id);
      const next = [newItem, ...filtered].slice(0, 50);
      localStorage.setItem('fileconv_local_history', JSON.stringify(next));
      return next;
    });

    try {
      await apiRecordHistory(
        {
          ...entry,
          session_id: sessionId,
        },
        token
      );
    } catch (e) {
      console.warn('Failed recording history on backend:', e);
    }
  };

  const removeHistoryItem = async (jobId: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.job_id !== jobId);
      localStorage.setItem('fileconv_local_history', JSON.stringify(next));
      return next;
    });

    try {
      await apiDeleteHistory(jobId, sessionId, token);
    } catch (e) {
      console.warn('Failed deleting history item:', e);
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    localStorage.removeItem('fileconv_local_history');
    try {
      await apiClearHistory(sessionId, token);
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
