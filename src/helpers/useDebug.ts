import { useEffect } from "react";

export const useDebug =
  process.env.NODE_ENV === "development"
    ? <T>(value: T) => useEffect(() => console.log(value), [value])
    : () => void 0;
