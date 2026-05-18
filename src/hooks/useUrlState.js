import { useState, useEffect } from "react";

export function useUrlState(key, initialValue) {
  const isArray = Array.isArray(initialValue);

  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;

    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get(key);

    if (!paramValue) return initialValue;

    if (isArray) {
      return paramValue.split(",");
    }

    return paramValue;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (isArray) {
      if (value.length > 0) {
        params.set(key, value.join(","));
      } else {
        params.delete(key);
      }
    } else {
      if (value && value !== initialValue) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const newSearch = params.toString();
    const newPath = newSearch
      ? `${window.location.pathname}?${newSearch}`
      : window.location.pathname;

    window.history.replaceState(null, "", newPath);
  }, [key, value, initialValue, isArray]);

  return [value, setValue];
}
