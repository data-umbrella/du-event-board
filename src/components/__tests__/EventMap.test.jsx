import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EventMap from "../EventMap";

describe("EventMap Component", () => {
  it("renders the empty state when no events have coordinates", () => {
    const eventsWithoutCoords = [
      { id: "1", title: "Online Event", location: "Online" },
    ];
    render(
      <EventMap
        events={eventsWithoutCoords}
        theme="light"
        onSelectEvent={() => {}}
      />,
    );
    expect(screen.getByText("No locations found")).toBeInTheDocument();
  });
});
