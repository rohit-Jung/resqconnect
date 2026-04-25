import { useCallback, useState, useSyncExternalStore } from 'react';

export function useLocalStorage(key: string, initialValue?: string | null) {
  const [storedValue, setStoredValue] = useState<string | null>(() => {
    const fallback = initialValue ?? null;
    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return fallback;
    }
  });
  const isClient = typeof window !== 'undefined';

  const setValue = useCallback(
    (value: string | null | ((val: string | null) => string | null)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          if (valueToStore === null) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, valueToStore);
          }
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(null);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue, isClient] as const;
}

export function getTokenFromStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return null;
  }
}

// Subscribe to localStorage changes without setState-in-effect patterns.
export function useTokenFromStorage(key: string): string | null {
  return useSyncExternalStore(
    callback => {
      if (typeof window === 'undefined') {
        return () => {};
      }
      window.addEventListener('storage', callback);
      return () => window.removeEventListener('storage', callback);
    },
    () => getTokenFromStorage(key),
    // During SSR and hydration we treat token as unknown.
    () => null
  );
}

export function setTokenToStorage(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
    // Ensure same-tab subscribers update too (storage event only fires cross-tab).
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

export function removeTokenFromStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}
