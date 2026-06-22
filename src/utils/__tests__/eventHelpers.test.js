import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getEventStatus } from "../eventHelpers";

describe("eventHelpers - getEventStatus", () => {
  beforeEach(() => {
    // Mock the system date to a fixed date: 2025-10-15
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-10-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "none" if no date is provided', () => {
    expect(getEventStatus(null)).toBe("none");
    expect(getEventStatus("")).toBe("none");
  });

  it('returns "ended" for events in the past', () => {
    expect(getEventStatus("2025-10-10")).toBe("ended");
  });

  it('returns "live" for events happening today', () => {
    expect(getEventStatus("2025-10-15")).toBe("live");
  });

  it('returns "upcoming" for events within the next 3 days', () => {
    expect(getEventStatus("2025-10-16")).toBe("upcoming"); // 1 day out
    expect(getEventStatus("2025-10-18")).toBe("upcoming"); // 3 days out
  });

  it('returns "none" for events more than 3 days in the future', () => {
    expect(getEventStatus("2025-10-19")).toBe("none"); // 4 days out
    expect(getEventStatus("2026-01-01")).toBe("none");
  });
});
