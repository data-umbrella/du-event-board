import { describe, it, expect, afterEach } from "vitest";
import {
  DEFAULT_THEME,
  THEME_KEY,
  persistTheme,
  readStoredTheme,
} from "../themeStorage";

const originalDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

function installStorage(storage) {
  Object.defineProperty(window, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  return storage;
}

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(window, "localStorage", originalDescriptor);
  } else {
    delete window.localStorage;
  }
});

describe("readStoredTheme", () => {
  it("returns the persisted theme", () => {
    installStorage(memoryStorage({ [THEME_KEY]: "light" }));
    expect(readStoredTheme()).toBe("light");
  });

  it("falls back to dark when nothing is stored", () => {
    installStorage(memoryStorage());
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("returns dark when localStorage is undefined", () => {
    installStorage(undefined);
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("returns dark when getItem throws", () => {
    installStorage({
      getItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("returns dark when reading localStorage throws on access", () => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("SecurityError");
      },
      configurable: true,
    });
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });
});

describe("persistTheme", () => {
  it("writes the theme", () => {
    const store = installStorage(memoryStorage());
    persistTheme("light");
    expect(store.getItem(THEME_KEY)).toBe("light");
  });

  it("does not throw when localStorage is undefined", () => {
    installStorage(undefined);
    expect(() => persistTheme("light")).not.toThrow();
  });

  it("does not throw when writing throws", () => {
    installStorage({
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(() => persistTheme("light")).not.toThrow();
  });
});
