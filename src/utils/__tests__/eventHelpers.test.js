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

  describe("multi-day events", () => {
    it('returns "none" when today is more than 3 days before start', () => {
      expect(getEventStatus("2025-10-20", "2025-10-22")).toBe("none");
    });

    it('returns "upcoming" when today is 1-3 days before start', () => {
      expect(getEventStatus("2025-10-17", "2025-10-19")).toBe("upcoming"); // 2 days out
      expect(getEventStatus("2025-10-16", "2025-10-18")).toBe("upcoming"); // 1 day out
      expect(getEventStatus("2025-10-18", "2025-10-20")).toBe("upcoming"); // 3 days out
    });

    it('returns "live" when today is the start date', () => {
      expect(getEventStatus("2025-10-15", "2025-10-17")).toBe("live");
    });

    it('returns "live" when today is a middle day of a multi-day event', () => {
      // Starts yesterday, ends tomorrow: today is in the middle
      expect(getEventStatus("2025-10-14", "2025-10-16")).toBe("live");
    });

    it('returns "live" when today is the end date of a multi-day event', () => {
      // Starts yesterday, ends today (e.g. PyOhio 2026-07-25 to 2026-07-26 on 2026-07-26)
      expect(getEventStatus("2025-10-14", "2025-10-15")).toBe("live");
    });

    it('returns "ended" when today is the day after the end date', () => {
      expect(getEventStatus("2025-10-12", "2025-10-14")).toBe("ended");
    });
  });

  describe("single-day and edge cases", () => {
    it('treats null or empty string end_date as single-day event', () => {
      expect(getEventStatus("2025-10-15", null)).toBe("live");
      expect(getEventStatus("2025-10-15", "")).toBe("live");
      expect(getEventStatus("2025-10-14", null)).toBe("ended");
      expect(getEventStatus("2025-10-14", "")).toBe("ended");
    });

    it('returns "none" for missing or empty start date even if end_date is provided', () => {
      expect(getEventStatus(null, "2025-10-15")).toBe("none");
      expect(getEventStatus("", "2025-10-15")).toBe("none");
    });
  });
});
