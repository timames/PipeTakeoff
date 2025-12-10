import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../types';

const STORAGE_KEY = 'pipetakeoff_settings';

const defaultSettings: Settings = {
  apiKey: '',
  model: 'gpt-4o',
  customPrompt: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(defaultSettings);
  }, []);

  return { settings, updateSettings, clearSettings };
}
