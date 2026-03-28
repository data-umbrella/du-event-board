import { describe, it, expect } from "vitest";
import { parseTime, escapeICSText, generateICS } from "../utils/icsGenerator";

// ─── event fixture ────────────────────────────────────────────────────
const sampleEvent = {
  id: "1",
  title: "Python Meetup, São Paulo",
  description: "A community meetup; all are welcome\\n Come join us!",
  date: "2026-06-15",
  time: "18:00",
  location: "Tech Hub; Av. Paulista, São Paulo",
  url: "https://example.com/python-meetup",
};

// parseTime: 12-hour AM/PM formats ────────────────────────────────────
describe("parseTime — 12-hour AM/PM", () => {
  it("parses a morning time correctly", () => {
    expect(parseTime("9:30 AM")).toEqual({ hours: 9, minutes: 30 });
  });

  it("parses an afternoon time correctly", () => {
    expect(parseTime("2:45 PM")).toEqual({ hours: 14, minutes: 45 });
  });

  it("parses a case-insensitive meridiem", () => {
    expect(parseTime("6:00 pm")).toEqual({ hours: 18, minutes: 0 });
  });
});

// parseTime: 24-hour formats ──────────────────────────────────────────
describe("parseTime — 24-hour", () => {
  it("parses a standard 24-hour time", () => {
    expect(parseTime("18:00")).toEqual({ hours: 18, minutes: 0 });
  });

  it("parses a zero-padded 24-hour time", () => {
    expect(parseTime("09:05")).toEqual({ hours: 9, minutes: 5 });
  });
});

// ─── 3. parseTime: edge cases — midnight and noon ───────────────────────────
describe("parseTime — edge cases", () => {
  it("handles midnight (12:00 AM) as hour 0", () => {
    expect(parseTime("12:00 AM")).toEqual({ hours: 0, minutes: 0 });
  });

  it("handles 12:30 AM as 00:30", () => {
    expect(parseTime("12:30 AM")).toEqual({ hours: 0, minutes: 30 });
  });

  it("handles noon (12:00 PM) as hour 12", () => {
    expect(parseTime("12:00 PM")).toEqual({ hours: 12, minutes: 0 });
  });

  it("handles 00:00 (24-hour midnight) as hour 0", () => {
    expect(parseTime("00:00")).toEqual({ hours: 0, minutes: 0 });
  });
});

// ─── 4. escapeICSText: special character escaping ───────────────────────────
describe("escapeICSText — special characters", () => {
  it("escapes commas", () => {
    expect(escapeICSText("Hello, world")).toBe("Hello\\, world");
  });

  it("escapes semicolons", () => {
    expect(escapeICSText("Step 1; Step 2")).toBe("Step 1\\; Step 2");
  });

  it("escapes backslashes", () => {
    expect(escapeICSText("C:\\Users\\file")).toBe("C:\\\\Users\\\\file");
  });

  it("escapes newlines (\\n)", () => {
    expect(escapeICSText("line one\nline two")).toBe("line one\\nline two");
  });

  it("escapes carriage-return newlines (\\r\\n)", () => {
    expect(escapeICSText("line one\r\nline two")).toBe("line one\\nline two");
  });

  it("escapes all special characters together", () => {
    const input = "A,B;C\\D\nE";
    expect(escapeICSText(input)).toBe("A\\,B\\;C\\\\D\\nE");
  });

  it("returns empty string for empty input", () => {
    expect(escapeICSText("")).toBe("");
  });
});

// ─── 5. generateICS: DTSTART / DTEND correctness ────────────────────────────
describe("generateICS — DTSTART and DTEND", () => {
  it("contains the correct DTSTART token", () => {
    const ics = generateICS(sampleEvent);
    expect(ics).toContain("DTSTART:20260615T180000");
  });

  it("contains the correct DTEND for a 1-hour duration (default)", () => {
    const ics = generateICS(sampleEvent);
    expect(ics).toContain("DTEND:20260615T190000");
  });
});

// ─── 6. generateICS: custom duration ────────────────────────────────────────
describe("generateICS — custom duration", () => {
  it("respects a 2-hour custom duration", () => {
    const ics = generateICS(sampleEvent, 2);
    expect(ics).toContain("DTSTART:20260615T180000");
    expect(ics).toContain("DTEND:20260615T200000");
  });

  it("respects a 0.5-hour (30-minute) duration", () => {
    const ics = generateICS(sampleEvent, 0.5);
    expect(ics).toContain("DTEND:20260615T183000");
  });
});

// ─── 7. generateICS: CRLF line endings ──────────────────────────────────────
describe("generateICS — CRLF line endings", () => {
  it("uses \\r\\n between every line", () => {
    const ics = generateICS(sampleEvent);
    // Split on CRLF — every segment should be a non-empty ICS property or block marker
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    // All lines except the trailing empty one must be non-empty
    lines.slice(0, -1).forEach((line) => {
      expect(line.length).toBeGreaterThan(0);
    });
  });

  it("does NOT use bare \\n line endings", () => {
    const ics = generateICS(sampleEvent);
    // Replace all CRLF first, then check no bare LF remains
    const withoutCRLF = ics.replace(/\r\n/g, "");
    expect(withoutCRLF).not.toContain("\n");
  });
});

// ─── 8. generateICS: SUMMARY escaping ───────────────────────────────────────
describe("generateICS — SUMMARY escaping", () => {
  it("escapes special characters in SUMMARY", () => {
    const event = {
      ...sampleEvent,
      title: "Workshop, Intro; to Python\\Rust",
    };
    const ics = generateICS(event);
    expect(ics).toContain("SUMMARY:Workshop\\, Intro\\; to Python\\\\Rust");
  });

  it("escapes commas in the title from the sample event", () => {
    const ics = generateICS(sampleEvent);
    // "Python Meetup, São Paulo" → comma must be escaped
    expect(ics).toContain("SUMMARY:Python Meetup\\, São Paulo");
  });
});
