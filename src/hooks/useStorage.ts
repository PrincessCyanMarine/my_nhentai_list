import { useEffect, useState } from "react";

export const useSessionStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(defaultValue);
  useEffect(() => {
    let saved = sessionStorage.getItem(key);
    if (saved) setValue(JSON.parse(saved));
  }, []);
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [value]);
  return [value, setValue] as const;
};
