import "@testing-library/jest-dom";
import { vi } from "vitest";

// mock scroll
window.scrollTo = vi.fn();

// ✅ mock localStorage (THIS is missing)
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});
