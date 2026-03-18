#!/usr/bin/env python3
"""
title: Validate event metadata from data/events.yaml.
summary: |-
  Reads the YAML event data file and validates each event entry
  against the required schema before JSON generation.
"""

import re
import sys
from pathlib import Path
import yaml

# ── Required fields and their expected types ──────────────────────────────────
REQUIRED_FIELDS = {
    "id": str,
    "title": str,
    "description": str,
    "date": str,  # "YYYY-MM-DD"
    "time": str,  # "HH:MM"
    "location": str,
    "region": str,
    "category": str,
    "url": str,
}

OPTIONAL_FIELDS = {
    "tags": list,
}

VALID_CATEGORIES = {
    "Technology",
    "Data Science",
    "Machine Learning",
    "Python",
    "R",
    "Open Source",
    "Community",
    "Workshop",
    "Conference",
    "Meetup",
    "Webinar",
    "Other",
}

DATE_FORMAT_EXAMPLE = "YYYY-MM-DD  (e.g. 2026-06-01)"
TIME_FORMAT_EXAMPLE = "HH:MM       (e.g. 18:00)"
URL_FORMAT_EXAMPLE = "https://... (e.g. https://example.com/event)"


DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_PATTERN = re.compile(r"^\d{2}:\d{2}$")
URL_PATTERN = re.compile(r"^https?://")


def validate_event(event: dict, index: int) -> list:
    """
    title: Validate a single event entry.
    parameters:
      event:
        type: dict
      index:
        type: int
    returns:
      type: list
    """
    errors = []
    entry_id = event.get("id", f"[index {index}]")
    prefix = f"Event id={entry_id!r}"

    # 1. Check required fields exist and are correct type
    for field, expected_type in REQUIRED_FIELDS.items():
        if field not in event:
            errors.append(f"{prefix} → missing required field: '{field}'")
        elif not isinstance(event[field], expected_type):
            errors.append(
                f"{prefix} → field '{field}' must be a {expected_type.__name__}, "
                f"got {type(event[field]).__name__!r}"
            )

    # 2. Format checks (only if fields are present)
    if "date" in event and isinstance(event["date"], str):
        if not DATE_PATTERN.match(event["date"]):
            errors.append(
                f"{prefix} → 'date' has invalid format {event['date']!r}\n"
                f"           Expected: {DATE_FORMAT_EXAMPLE}"
            )

    if "time" in event and isinstance(event["time"], str):
        if not TIME_PATTERN.match(event["time"]):
            errors.append(
                f"{prefix} → 'time' has invalid format {event['time']!r}\n"
                f"           Expected: {TIME_FORMAT_EXAMPLE}"
            )

    if "url" in event and isinstance(event["url"], str):
        if not URL_PATTERN.match(event["url"]):
            errors.append(
                f"{prefix} → 'url' must start with http:// or https://\n"
                f"           Got:      {event['url']!r}\n"
                f"           Expected: {URL_FORMAT_EXAMPLE}"
            )

    # 3. Optional: tags must be a list of strings
    if "tags" in event:
        if not isinstance(event["tags"], list):
            errors.append(
                f"{prefix} → 'tags' must be a list, got {type(event['tags']).__name__!r}"
            )
        else:
            for i, tag in enumerate(event["tags"]):
                if not isinstance(tag, str):
                    errors.append(
                        f"{prefix} → 'tags[{i}]' must be a string, got {type(tag).__name__!r}"
                    )

    return errors


def main() -> None:
    """
    title: Validate all events in data/events.yaml.
    """
    events_path = Path(__file__).parent.parent / "data" / "events.yaml"

    if not events_path.exists():
        print(f"❌ Could not find events file at: {events_path}")
        sys.exit(1)

    with open(events_path, "r") as f:
        events = yaml.safe_load(f)

    if isinstance(events, dict) and "events" in events:
        events = events["events"]

    if not isinstance(events, list):
        print(
            "❌ data/events.yaml must contain a list under an 'events:' key or at the top level."
        )
        sys.exit(1)

    all_errors = []
    for i, event in enumerate(events):
        all_errors.extend(validate_event(event, i))

    if all_errors:
        print("\n" + "═" * 60)
        print("❌  EVENT METADATA VALIDATION FAILED")
        print("═" * 60)
        print(f"Found {len(all_errors)} error(s) in data/events.yaml:\n")
        for err in all_errors:
            print(f"  • {err}\n")
        print("─" * 60)
        print("Fix the errors above before opening a Pull Request.")
        print("See README.md for the required event format.")
        print("═" * 60 + "\n")
        sys.exit(1)
    else:
        print(f"✅  All {len(events)} event(s) passed schema validation.")


if __name__ == "__main__":
    main()
