import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/lib/loading-config';

interface ProgressBarAPI {
  start: () => void;
  done: () => void;
  reset: () => void;
  progress: number;
  isActive: boolean;
}

const ProgressBarContext = createContext<ProgressBarAPI | null>(null);

export function useProgressBar(): ProgressBarAPI {
  const ctx = useContext(ProgressBarContext);
  if (!ctx) throw new Error('useProgressBar must be used within ProgressBarProvider');
  return ctx;
}

export function ProgressBarProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const counterRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (completingTimeoutRef.current) {
      clearTimeout(completingTimeoutRef.current);
      completingTimeoutRef.current = null;
    }
  }, []);

  const startSimulation = useCallback(() => {
    clearTimers();

    if (prefersReducedMotion()) {
      setProgress(20);
      return;
    }

    setProgress(10);
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        let increment: number;
        if (prev < 30) increment = Math.random() * 5 + 3;
        else if (prev < 60) increment = Math.random() * 3 + 1;
        else if (prev < 80) increment = Math.random() * 1.5 + 0.5;
        else increment = Math.random() * 0.4 + 0.1;
        return Math.min(prev + increment, 90);
      });
    }, 300);
  }, [clearTimers]);

  const start = useCallback(() => {
    counterRef.current += 1;
    if (counterRef.current === 1) {
      setIsActive(true);
      startSimulation();
    }
  }, [startSimulation]);

  const done = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current === 0) {
      clearTimers();
      setProgress(100);
      completingTimeoutRef.current = setTimeout(() => {
        setIsActive(false);
        setProgress(0);
      }, 400);
    }
  }, [clearTimers]);

  const reset = useCallback(() => {
    counterRef.current = 0;
    clearTimers();
    setIsActive(false);
    setProgress(0);
  }, [clearTimers]);

  return (
    <ProgressBarContext.Provider value={{ start, done, reset, progress, isActive }}>
      {children}
    </ProgressBarContext.Provider>
  );
}
