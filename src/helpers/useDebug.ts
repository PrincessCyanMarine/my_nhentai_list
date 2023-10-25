import { useEffect } from "react";

export const useDebug = <T>(value: T) => {
  if (process.env.NODE_ENV === "development")
    useEffect(() => console.log(value), [value]);
};
