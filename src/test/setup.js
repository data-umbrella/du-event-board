import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

window.scrollTo = () => {};

// Mock react-leaflet globally to prevent JSDOM issues
vi.mock("react-leaflet", () => {
  return {
    MapContainer: ({ children }) =>
      React.createElement("div", { "data-testid": "map-container" }, children),
    TileLayer: () =>
      React.createElement("div", { "data-testid": "tile-layer" }),
    Marker: ({ children }) =>
      React.createElement("div", { "data-testid": "marker" }, children),
    Popup: ({ children }) =>
      React.createElement("div", { "data-testid": "popup" }, children),
    ZoomControl: () =>
      React.createElement("div", { "data-testid": "zoom-control" }),
    useMap: () => ({
      fitBounds: vi.fn(),
      locate: vi.fn(),
      removeLayer: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }),
  };
});
