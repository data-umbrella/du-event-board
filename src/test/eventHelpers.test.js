import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getEventStatus } from "../utils/eventHelpers";

describe("getEventStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0)); // Apr 15, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'none' when eventDate is null", () => {
    expect(getEventStatus(null)).toBe("none");
  });

  it("returns 'none' when eventDate is undefined", () => {
    expect(getEventStatus(undefined)).toBe("none");
  });

  it("returns 'none' when eventDate is an empty string", () => {
    expect(getEventStatus("")).toBe("none");
  });

  it("returns 'live' for today's date", () => {
    expect(getEventStatus("2026-04-15")).toBe("live");
  });

  it("returns 'upcoming' for tomorrow", () => {
    expect(getEventStatus("2026-04-16")).toBe("upcoming");
  });

  it("returns 'upcoming' for a date 2 days away", () => {
    expect(getEventStatus("2026-04-17")).toBe("upcoming");
  });

  it("returns 'upcoming' for a date 3 days away", () => {
    expect(getEventStatus("2026-04-18")).toBe("upcoming");
  });

  it("returns 'none' for a date 4 days away", () => {
    expect(getEventStatus("2026-04-19")).toBe("none");
  });

  it("returns 'none' for a date far in the future", () => {
    expect(getEventStatus("2026-12-25")).toBe("none");
  });

  it("returns 'ended' for yesterday", () => {
    expect(getEventStatus("2026-04-14")).toBe("ended");
  });

  it("returns 'ended' for a date well in the past", () => {
    expect(getEventStatus("2025-01-01")).toBe("ended");
  });
});
