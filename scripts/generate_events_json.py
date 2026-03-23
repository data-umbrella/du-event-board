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

EVENT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": REQUIRED_FIELDS,
    "properties": {
        # Base fields
        "id": {"type": "string"},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "date": {"type": "string", "format": "date"},
        "time": {"type": "string", "format": "time"},
        "location": {"type": "string"},
        "region": {"type": "string"},
        "category": {"type": "string"},
        "url": {"type": "string", "format": "url"},
        "tags": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        # Optional fields for richer filters/views
        "event_type": {
            "type": "string",
            "enum": ["online", "in_person", "hybrid"],
        },
        "cost": {"type": "string", "enum": ["free", "paid"]},
        "start_date": {"type": "string", "format": "date"},
        "end_date": {"type": "string", "format": "date"},
        "org_logo": {"type": "string", "format": "url"},
    },
}

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

    # Validate types/enums/formats based on EVENT_SCHEMA (schema-json approach)
    props = EVENT_SCHEMA["properties"]

    def _validate_format(field: str, value: Any) -> None:
        schema = props.get(field, {})
        fmt = schema.get("format")
        if fmt == "date":
            try:
                datetime.strptime(str(value), "%Y-%m-%d")
            except ValueError:
                errors.append(
                    f"{label}: Invalid {field} '{value}' (expected YYYY-MM-DD)"
                )
        elif fmt == "time":
            try:
                datetime.strptime(str(value), "%H:%M")
            except ValueError:
                errors.append(
                    f"{label}: Invalid {field} '{value}' (expected HH:MM)"
                )
        elif fmt == "url":
            if not _is_http_url(str(value)):
                errors.append(
                    f"{label}: Invalid {field} '{value}' (expected http(s) URL)"
                )

    # tags
    if "tags" in props and "tags" in event:
        tags = event.get("tags")
        if (
            not isinstance(tags, list)
            or not tags
            or not all(isinstance(t, str) and t.strip() for t in tags)
        ):
            errors.append(
                f"{label}: 'tags' must be a non-empty list of strings"
            )

    # url + optional org_logo
    if "url" in event:
        _validate_format("url", event["url"])
    if "org_logo" in event and event.get("org_logo"):
        _validate_format("org_logo", event["org_logo"])

    # enums
    for enum_field in ("event_type", "cost"):
        if enum_field in event and event.get(enum_field):
            allowed = props[enum_field].get("enum", [])
            value = str(event[enum_field]).strip()
            if value not in allowed:
                errors.append(
                    f"{label}: Invalid {enum_field} '{value}' (allowed: {', '.join(allowed)})"
                )

    # start_date / end_date
    start_date: datetime | None = None
    end_date: datetime | None = None
    if event.get("start_date"):
        try:
            start_date = datetime.strptime(
                str(event["start_date"]), "%Y-%m-%d"
            )
        except ValueError:
            errors.append(
                f"{label}: Invalid start_date '{event['start_date']}' (expected YYYY-MM-DD)"
            )
    if event.get("end_date"):
        try:
            end_date = datetime.strptime(str(event["end_date"]), "%Y-%m-%d")
        except ValueError:
            errors.append(
                f"{label}: Invalid end_date '{event['end_date']}' (expected YYYY-MM-DD)"
            )
    if start_date and end_date and end_date < start_date:
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
