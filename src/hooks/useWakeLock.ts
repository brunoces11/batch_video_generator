import { useState, useCallback, useRef, useEffect } from 'react';

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

export function useWakeLock(): WakeLockState {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const shouldBeActiveRef = useRef(false);

  const isSupported = 'wakeLock' in navigator;

  const acquireLock = useCallback(async () => {
    if (!isSupported) {
      setError('Wake Lock API not supported in this browser');
      return;
    }

    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      setError(null);

      sentinelRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acquire wake lock');
      setIsActive(false);
    }
  }, [isSupported]);

  const request = useCallback(async () => {
    shouldBeActiveRef.current = true;
    await acquireLock();
  }, [acquireLock]);

  const release = useCallback(async () => {
    shouldBeActiveRef.current = false;
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // already released
      }
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldBeActiveRef.current) {
        acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [acquireLock]);

  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  return { isSupported, isActive, error, request, release };
}
