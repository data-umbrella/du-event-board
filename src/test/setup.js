import "@testing-library/jest-dom";

// Some runners can provide a partial localStorage object (without clear).
// Normalize it so tests behave the same in npm test and pre-commit hooks.
if (
  typeof globalThis.localStorage === "undefined" ||
  typeof globalThis.localStorage.clear !== "function"
) {
  let storage = {};

  const localStorageMock = {
    getItem: (key) => (key in storage ? storage[key] : null),
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}
