#!/usr/bin/env python3
"""
title: Generate events.json from events.yaml.
summary: |-
  Reads the YAML event data file and produces a JSON file
  that the React frontend consumes.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml  # type: ignore

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

# Schema-like definition (mirrors JSON Schema shapes; validated in code below).
EVENT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": REQUIRED_FIELDS,
    "properties": {
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

OPTIONAL_ENUM_FIELDS: dict[str, set[str]] = {
    "event_type": {"online", "in_person", "hybrid"},
    "cost": {"free", "paid"},
}

OPTIONAL_DATE_FIELDS = {"start_date", "end_date"}
OPTIONAL_URL_FIELDS = {"org_logo"}

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"
OUTPUT_FILE = PROJECT_ROOT / "src" / "data" / "events.json"
CACHE_FILE = PROJECT_ROOT / "data" / ".geocode_cache.json"

_geocode_cache = None


def is_ci() -> bool:
    """
    title: Check if the script is running in a CI/CD environment.
    returns:
      type: bool
    """
    return any(
        os.environ.get(env)
        for env in ["GITHUB_ACTIONS", "NETLIFY", "CI", "VERCEL"]
    )


def get_cache() -> dict[str, Any]:
    """
    title: Retrieve the geocode cache dictionary from disk.
    returns:
      type: dict[str, Any]
    """
    global _geocode_cache
    if _geocode_cache is None:
        if CACHE_FILE.exists():
            with open(CACHE_FILE, "r") as f:
                _geocode_cache = json.load(f)
        else:
            _geocode_cache = {}
    return _geocode_cache


def save_cache() -> None:
    """
    title: Save the geocode cache dictionary back to disk.
    """
    if _geocode_cache is not None:
        with open(CACHE_FILE, "w") as f:
            json.dump(_geocode_cache, f, indent=2)


def geocode_location(location_str: str) -> tuple[float, float] | None:
    """
    title: Uses Nominatim API to get lat/long for a location string.
    parameters:
      location_str:
        type: str
    returns:
      type: tuple[float, float] | None
    """
    if not location_str or location_str.lower() == "online":
        return None

    cache = get_cache()
    if location_str in cache:
        return (cache[location_str][0], cache[location_str][1])

    # Skip network calls in CI/CD environments to keep builds fast and avoid rate limits
    if is_ci():
        print(f"  [CI] Skipping geocode for '{location_str}'")
        return None

    print(f"  [Network] Fetching coordinates for '{location_str}'...")
    query = urllib.parse.quote(location_str)
    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1"

    req = urllib.request.Request(
        url, headers={"User-Agent": "DU-Event-Board-App/1.0"}
    )
    try:
        time.sleep(1.1)  # Respect OpenStreetMap Nominatim usage policy
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data and len(data) > 0:
                coords = (float(data[0]["lat"]), float(data[0]["lon"]))
                cache[location_str] = coords
                return coords
    except Exception as e:
        print(
            f"Warning: Geocoding failed for '{location_str}': {e}",
            file=sys.stderr,
        )
    return None


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
        p = urllib.parse.urlparse(value)
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
    props: dict[str, Any] = EVENT_SCHEMA.get("properties", {})

    label = f"Event #{index}"
    if event.get("id"):
        label = f"Event id={event.get('id')}"
    elif event.get("title"):
        label = f"Event '{event.get('title')}'"

    for field in REQUIRED_FIELDS:
        if field not in event or not event[field]:
            errors.append(f"{label}: Missing required field '{field}'")

    if event.get("id"):
        event_id = str(event["id"])
        if event_id in seen_ids:
            errors.append(f"{label}: Duplicate id '{event_id}'")
        else:
            seen_ids.add(event_id)

    if event.get("date"):
        try:
            if isinstance(event["date"], datetime):
                event["date"] = event["date"].strftime("%Y-%m-%d")
            datetime.strptime(str(event["date"]), "%Y-%m-%d")
        except ValueError:
            errors.append(
                f"{label}: Invalid date format '{event['date']}' (expected YYYY-MM-DD)"
            )

    if event.get("time"):
        try:
            if not isinstance(event["time"], str):
                event["time"] = event["time"].strftime("%H:%M")
            datetime.strptime(str(event["time"]), "%H:%M")
        except ValueError:
            errors.append(
                f"{label}: Invalid time format '{event['time']}' (expected HH:MM)"
            )

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

    if "tags" in event and event.get("tags") is not None:
        tags = event["tags"]
        tag_schema = props.get("tags", {})
        min_items = tag_schema.get("minItems", 1)
        if (
            not isinstance(tags, list)
            or len(tags) < min_items
            or not all(isinstance(t, str) and t.strip() for t in tags)
        ):
            errors.append(
                f"{label}: 'tags' must be a non-empty list of strings"
            )

    if event.get("url"):
        _validate_format("url", event["url"])

    for k in OPTIONAL_URL_FIELDS:
        if k in event and event.get(k):
            _validate_format(k, event[k])

    for k, allowed in OPTIONAL_ENUM_FIELDS.items():
        if k in event and event.get(k):
            value = str(event[k]).strip()
            if value not in allowed:
                errors.append(
                    f"{label}: Invalid {k} '{value}' (allowed: {', '.join(sorted(allowed))})"
                )

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


def update_yaml_surgically(events_with_coords: list[dict[str, Any]]) -> None:
    """
    title: >-
      Updates events.yaml by inserting lat/lng lines into the existing text.
    parameters:
      events_with_coords:
        type: list[dict[str, Any]]
    """
    if not INPUT_FILE.exists():
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        original_content = f.read()

    lines = original_content.splitlines(keepends=True)
    final_output = []

    updated_ids = {str(e["id"]) for e in events_with_coords if "lat" in e}

    i = 0
    while i < len(lines):
        line = lines[i]
        final_output.append(line)

        if line.strip().startswith("- id:"):
            event_id = line.strip().split(":", 1)[1].strip().strip("'\"")

            if event_id in updated_ids:
                event_data = next(
                    e for e in events_with_coords if str(e["id"]) == event_id
                )

                block_end = i + 1
                has_lat = False
                while block_end < len(lines):
                    line_content = lines[block_end].strip()
                    if not line_content or line_content.startswith("- id:"):
                        break
                    if line_content.startswith("lat:"):
                        has_lat = True
                    block_end += 1

                if not has_lat:
                    property_indent = "    "

                    final_output.append(
                        f"{property_indent}lat: {event_data['lat']}\n"
                    )
                    final_output.append(
                        f"{property_indent}lng: {event_data['lng']}\n"
                    )

        i += 1

    with open(INPUT_FILE, "w", encoding="utf-8") as f:
        f.writelines(final_output)


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

    new_coords_found = False
    all_errors: list[str] = []
    seen_ids: set[str] = set()

    for i, event in enumerate(events, start=1):
        if not isinstance(event, dict):
            all_errors.append(
                f"Event #{i}: Expected object, got {type(event).__name__}"
            )
            continue
        all_errors.extend(validate_event(event, i, seen_ids))

        if not all_errors and "lat" not in event:
            coords = None
            if (
                "location" in event
                and event["location"]
                and event["location"].lower() != "online"
            ):
                coords = geocode_location(event["location"])

            if (
                not coords
                and "region" in event
                and event["region"]
                and event["region"].lower() != "online"
            ):
                coords = geocode_location(event["region"])

            if coords:
                event["lat"], event["lng"] = coords
                new_coords_found = True

    if all_errors:
        print("Validation errors:", file=sys.stderr)
        for error in all_errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    print("All events validated successfully")

    if new_coords_found and not is_ci():
        print(
            f"Surgically updating source file with new coordinates: {INPUT_FILE}"
        )
        update_yaml_surgically(events)
        print("  Done.")

    save_cache()

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Generated: {OUTPUT_FILE}")
    print(f"Total events: {len(events)}")


if __name__ == "__main__":
    main()
