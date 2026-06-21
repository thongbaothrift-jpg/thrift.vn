"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { getNewArrivalsCount } from '@/lib/api';

type SiteTextsMap = Record<string, string>;
export type Announcement = { id: string; text: string; icon: string; isActive: boolean };

interface SiteTextsContextValue {
  texts: SiteTextsMap;
  get: (key: string, fallback?: string) => string;
  isLoading: boolean;
  refetch: () => void;
}

const SiteTextsContext = createContext<SiteTextsContextValue>({
  texts: {},
  get: (key: string, fallback = '') => fallback,
  isLoading: true,
  refetch: () => {},
});

export function SiteTextsProvider({ children }: { children: ReactNode }) {
  const [texts, setTexts] = useState<SiteTextsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchTexts = async () => {
    try {
      const res = await fetch('/api/site-texts');
      if (res.ok) {
        const data = await res.json();
        setTexts(data);
      }
    } catch {
      // Silently fail — fallback to hardcoded text
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  const get = (key: string, fallback: string = ''): string => {
    const val = texts[key];
    if (!val && val !== '') return fallback;
    return val;
  };

  return (
    <SiteTextsContext.Provider value={{ texts, get, isLoading, refetch: fetchTexts }}>
      {children}
    </SiteTextsContext.Provider>
  );
}

export function useSiteTexts() {
  return useContext(SiteTextsContext);
}

export function useAnnouncements(): { announcements: Announcement[]; isLoading: boolean } {
  const { texts, isLoading } = useSiteTexts();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    getNewArrivalsCount().then(setNewCount).catch(() => setNewCount(0));
  }, []);

  const announcements = useMemo<Announcement[]>(() => {
    return [1, 2, 3, 4].map((i) => {
      const raw = texts[`announcement.${i}`];
      if (!raw) return null;
      return {
        id: `ann-${i}`,
        text: raw.replace('{count}', String(newCount)),
        icon: '★',
        isActive: true,
      };
    }).filter((a): a is Announcement => a !== null);
  }, [texts, newCount]);

  return { announcements, isLoading };
}
