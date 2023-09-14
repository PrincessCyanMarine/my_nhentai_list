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

export const useSyncedDefault = <T>(key: string, defaultValue: T) => {
  const [_value, _setValue] = useState<T>(defaultValue);
  const [_defaultValue, _setDefaultValue] = useState<T>(defaultValue);
  const [_loaded, _setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(key, (res) => {
      _setDefaultValue(res?.[key] || defaultValue);
      _setLoaded(true);
    });
  }, []);
  useEffect(() => {
    console.log();
    _setValue(_defaultValue);
    chrome.storage.sync.set({ [key]: _defaultValue });
  }, [_defaultValue]);

  return {
    _value,
    _setDefaultValue,
    _setValue,
    _defaultValue,
    _loaded,
    _setLoaded,
  } as const;
};
