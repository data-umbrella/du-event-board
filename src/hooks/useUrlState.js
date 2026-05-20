import { useState, useEffect } from "react";

export function useUrlState(key, initialValue, options = {}) {
  const { history = "replace" } = options;

  const readValueFromUrl = () => {
    if (typeof window === "undefined") return initialValue;
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || initialValue;
  };

  const [value, setValue] = useState(() => {
    return readValueFromUrl();
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      const nextValue = readValueFromUrl();
      setValue((prev) => (prev === nextValue ? prev : nextValue));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [key, initialValue]);

  useEffect(() => {
    if (typeof window === "undefined") return;

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

    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (newPath === currentPath) return;

    if (history === "push") {
      window.history.pushState(null, "", newPath);
    } else {
      window.history.replaceState(null, "", newPath);
    }
  }, [key, value, initialValue, history]);

  return [value, setValue];
}
