import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useProgressBar } from './useProgressBar';

export function useRouteProgress() {
  const [location] = useLocation();
  const { start, done } = useProgressBar();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location !== prevLocation.current) {
      prevLocation.current = location;
      start();
      const timeout = setTimeout(() => done(), 500);
      return () => clearTimeout(timeout);
    }
  }, [location, start, done]);
}
