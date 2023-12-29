import { useEffect, useMemo, useState } from "react";

export function useSubscription<T>(
  defaultValue: T,
  type: "sync" | "local",
  key: string
) {
  const [value, setValue] = useState(defaultValue);
  const res = useMemo(() => value, [value]);
  // useDebug(value);
  useEffect(() => {
    chrome.storage[type].get(key).then((result) => {
      // console.log(key, result);
      setValue(result[key] || defaultValue);
      chrome.storage[type].onChanged.addListener((changes) => {
        // console.log(key, changes);
        if (changes[key]) setValue(changes[key].newValue || defaultValue);
      });
    });
  }, []);
  return res;
}
