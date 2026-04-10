import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom does not implement scrollTo; App scrolls to top on page changes.
window.scrollTo = vi.fn();
