import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getEventStatus } from "./eventHelpers";

describe("getEventStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns ended for a past event", () => {
    expect(getEventStatus("2026-04-10")).toBe("ended");
  });

  it("returns live for today", () => {
    expect(getEventStatus("2026-04-15")).toBe("live");
  });

  it("returns upcoming for the next 3 days", () => {
    expect(getEventStatus("2026-04-16")).toBe("upcoming");
    expect(getEventStatus("2026-04-18")).toBe("upcoming");
  });

  it("returns live for an event spanning today", () => {
    expect(
      getEventStatus({ startDate: "2026-04-14", endDate: "2026-04-16" }),
    ).toBe("live");
  });

  it("returns none for events more than three days away", () => {
    expect(getEventStatus("2026-04-19")).toBe("none");
  });

  it("returns none when date is missing", () => {
    expect(getEventStatus(null)).toBe("none");
    expect(getEventStatus("")).toBe("none");
  });
});
