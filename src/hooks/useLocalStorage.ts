import { useState, useEffect } from 'react';

// ==============================|| HOOKS - LOCAL STORAGE ||============================== //

export default function useLocalStorage<T>(key: string, defaultValue: T): [T, (newValue: T | ((curr: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue === null ? defaultValue : JSON.parse(storedValue);
  });

  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.storageArea === localStorage && e.key === key) {
        setValue(e.newValue ? JSON.parse(e.newValue) : e.newValue);
      }
    };
    window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('storage', listener);
    };
  }, [key, defaultValue]);

  const setValueInLocalStorage = (newValue: T | ((curr: T) => T)) => {
    setValue((currentValue: T) => {
      const result = typeof newValue === 'function' ? (newValue as (curr: T) => T)(currentValue) : newValue;
      localStorage.setItem(key, JSON.stringify(result));
      return result;
    });
  };

  return [value, setValueInLocalStorage];
}
