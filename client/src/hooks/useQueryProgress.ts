import { useEffect, useRef } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useProgressBar } from './useProgressBar';

export function useQueryProgress() {
  const fetchingCount = useIsFetching();
  const { start, done } = useProgressBar();
  const wasFetching = useRef(false);

  useEffect(() => {
    if (fetchingCount > 0 && !wasFetching.current) {
      start();
      wasFetching.current = true;
    } else if (fetchingCount === 0 && wasFetching.current) {
      done();
      wasFetching.current = false;
    }
  }, [fetchingCount, start, done]);
}
