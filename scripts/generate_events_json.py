#!/usr/bin/env python3
"""
title: Generate events.json from events.yaml.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import yaml

REQUIRED_FIELDS = [
    "id",
    "title",
    "description",
    "date",
    "time",
    "location",
    "region",
    "category",
    "url",
    "tags",
]

OPTIONAL_ENUM_FIELDS: dict[str, set[str]] = {
    # Future-facing fields used by richer filters and views.
    "event_type": {"online", "in_person", "hybrid"},
    "cost": {"free", "paid"},
}

OPTIONAL_DATE_FIELDS = {"start_date", "end_date"}
OPTIONAL_URL_FIELDS = {"org_logo"}

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"
OUTPUT_FILE = PROJECT_ROOT / "src" / "data" / "events.json"


def _is_http_url(value: str) -> bool:
    """
    title: Return True if value looks like an http(s) URL.
    parameters:
      value:
        type: str
    returns:
      type: bool
    """
    try:
        p = urlparse(value)
        return p.scheme in {"http", "https"} and bool(p.netloc)
    except Exception:
        return False


def validate_event(
    event: dict[str, Any], index: int, seen_ids: set[str]
) -> list[str]:
    """
    title: Validate a single event entry.
    parameters:
      event:
        type: dict[str, Any]
      index:
        type: int
      seen_ids:
        type: set[str]
    returns:
      type: list[str]
    """
    errors: list[str] = []

    label = f"Event #{index}"
    if isinstance(event, dict):
        if event.get("id"):
            label = f"Event id={event.get('id')}"
        elif event.get("title"):
            label = f"Event '{event.get('title')}'"

    for field in REQUIRED_FIELDS:
        if field not in event or not event[field]:
            errors.append(f"{label}: Missing required field '{field}'")

    # Validate id uniqueness
    if event.get("id"):
        event_id = str(event["id"])
        if event_id in seen_ids:
            errors.append(f"{label}: Duplicate id '{event_id}'")
        else:
            seen_ids.add(event_id)

    # Validate date format
    if event.get("date"):
        try:
            datetime.strptime(str(event["date"]), "%Y-%m-%d")
        except ValueError:
            errors.append(
                f"{label}: Invalid date format '{event['date']}' (expected YYYY-MM-DD)"
            )

    # Validate time format
    if event.get("time"):
        try:
            datetime.strptime(str(event["time"]), "%H:%M")
        except ValueError:
            errors.append(
                f"{label}: Invalid time format '{event['time']}' (expected HH:MM)"
            )

    # Validate tags
    if "tags" in event and event.get("tags") is not None:
        tags = event["tags"]
        if (
            not isinstance(tags, list)
            or not tags
            or not all(isinstance(t, str) and t.strip() for t in tags)
        ):
            errors.append(
                f"{label}: 'tags' must be a non-empty list of strings"
            )

    # Validate URL fields
    if event.get("url"):
        if not _is_http_url(str(event["url"])):
            errors.append(
                f"{label}: Invalid url '{event['url']}' (expected http(s) URL)"
            )

    for k in OPTIONAL_URL_FIELDS:
        if k in event and event.get(k):
            if not _is_http_url(str(event[k])):
                errors.append(
                    f"{label}: Invalid {k} '{event[k]}' (expected http(s) URL)"
                )

    # Validate optional enum fields
    for k, allowed in OPTIONAL_ENUM_FIELDS.items():
        if k in event and event.get(k):
            value = str(event[k]).strip()
            if value not in allowed:
                errors.append(
                    f"{label}: Invalid {k} '{value}' (allowed: {', '.join(sorted(allowed))})"
                )

    # Validate optional date fields
    parsed_dates: dict[str, datetime] = {}
    for k in OPTIONAL_DATE_FIELDS:
        if k in event and event.get(k):
            try:
                parsed_dates[k] = datetime.strptime(str(event[k]), "%Y-%m-%d")
            except ValueError:
                errors.append(
                    f"{label}: Invalid {k} '{event[k]}' (expected YYYY-MM-DD)"
                )

    if "start_date" in parsed_dates and "end_date" in parsed_dates:
        if parsed_dates["end_date"] < parsed_dates["start_date"]:
            errors.append(f"{label}: end_date must be >= start_date")

    return errors


def main() -> None:
    """
    title: Read YAML, validate, and generate JSON.
    """
    if not INPUT_FILE.exists():
        print(f"Error: Input file not found: {INPUT_FILE}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading events from: {INPUT_FILE}")

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not data or "events" not in data:
        print("Error: YAML file must contain an 'events' key", file=sys.stderr)
        sys.exit(1)

    events = data["events"]
    print(f"Found {len(events)} events")

    all_errors: list[str] = []
    seen_ids: set[str] = set()
    for i, event in enumerate(events, start=1):
        if not isinstance(event, dict):
            all_errors.append(
                f"Event #{i}: Expected object, got {type(event).__name__}"
            )
            continue
        all_errors.extend(validate_event(event, i, seen_ids))

    if all_errors:
        print("Validation errors:", file=sys.stderr)
        for error in all_errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Generated: {OUTPUT_FILE}")
    print(f"Total events: {len(events)}")


if __name__ == "__main__":
    main()
