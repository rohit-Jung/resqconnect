import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage(key: string, initialValue?: string | null) {
  const [storedValue, setStoredValue] = useState<string | null>(
    initialValue ?? null
  );
  const [isClient, setIsClient] = useState(false);

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

  const getValue = useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      const item = window.localStorage.getItem(key);
      return item;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  }, [key]);

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

  useEffect(() => {
    setIsClient(true);
    const value = getValue();
    if (value !== null) {
      setStoredValue(value);
    }
  }, [getValue]);

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

export function setTokenToStorage(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
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
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}
