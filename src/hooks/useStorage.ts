import { useEffect, useMemo, useState } from "react";

export const useSessionStorage = <T>(key: string, defaultValue: T) => {
  const [_value, setValue] = useState<T>(defaultValue);
  const value = useMemo(() => _value, [_value]);
  useEffect(() => {
    let saved = sessionStorage.getItem(key);
    if (saved) setValue(JSON.parse(saved));
  }, []);
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(_value));
  }, [_value]);
  return [value, setValue] as const;
};

export const useSyncedDefault = <T>(key: string, defaultValue: T) => {
  const [_value, _setValue] = useState<T>(defaultValue);
  const [_defaultValue, _setDefaultValue] = useState<T>(defaultValue);
  const [_loaded, _setLoaded] = useState(false);
  const value = useMemo(() => _value, [_value]);

  useEffect(() => {
    chrome.storage.sync.get(key, (res) => {
      _setDefaultValue(res?.[key] || defaultValue);
      _setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!_loaded) return;
    console.log();
    _setValue(_defaultValue);
    chrome.storage.sync.set({ [key]: _defaultValue });
  }, [_defaultValue, _loaded]);

  return {
    _value: value,
    _setDefaultValue,
    _setValue,
    _defaultValue,
    _loaded,
    _setLoaded,
  } as const;
};
