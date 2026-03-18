import "@testing-library/jest-dom";
import { beforeAll } from "vitest";

const createInMemoryStorage = () => {
  let store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store = new Map();
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
};

beforeAll(() => {
  const localStorage = window?.localStorage;
  const hasValidApi =
    localStorage &&
    typeof localStorage.getItem === "function" &&
    typeof localStorage.setItem === "function" &&
    typeof localStorage.removeItem === "function" &&
    typeof localStorage.clear === "function";

  if (!hasValidApi) {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: createInMemoryStorage(),
    });
  }
});
