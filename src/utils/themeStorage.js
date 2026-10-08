export const THEME_KEY = "theme";
export const DEFAULT_THEME = "dark";

/**
 * Theme storage is optional: it is absent in sandboxed iframes, in some privacy
 * modes, and in non-browser test environments. Reading or writing must never be
 * the thing that breaks rendering, so every access is guarded.
 */
function withStorage(action, fallback) {
  try {
    const store = window.localStorage;
    return store ? action(store) : fallback;
  } catch {
    return fallback;
  }
}

export function readStoredTheme() {
  return withStorage(
    (store) => store.getItem(THEME_KEY) || DEFAULT_THEME,
    DEFAULT_THEME,
  );
}

export function persistTheme(theme) {
  withStorage((store) => store.setItem(THEME_KEY, theme), undefined);
}
