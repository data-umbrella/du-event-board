import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom doesn't implement scrollTo; App uses it in a useEffect.
window.scrollTo = vi.fn();
