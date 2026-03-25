import { useState, useEffect } from "react";

export function useUrlState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || initialValue;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (value && value !== initialValue) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const newSearch = params.toString();
    const newPath = newSearch
      ? `${window.location.pathname}?${newSearch}`
      : window.location.pathname;

    window.history.replaceState(null, "", newPath);
  }, [key, value, initialValue]);

  return [value, setValue];
}
