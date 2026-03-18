#!/usr/bin/env python3
"""
title: Generate events.json from events.yaml.
summary: |-
  Reads the YAML event data file and produces a JSON file
  that the React frontend consumes. Converts local times to UTC.
"""

import json
import sys
import time
import urllib.request
import urllib.parse
from typing import Any
from datetime import datetime
from pathlib import Path

import yaml  # type: ignore
from zoneinfo import ZoneInfo

REQUIRED_FIELDS = [
    "id",
    "title",
    "description",
    "date",
    "time",
    "timezone",
    "location",
    "region",
    "category",
]
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"
OUTPUT_FILE = PROJECT_ROOT / "src" / "data" / "events.json"
CACHE_FILE = PROJECT_ROOT / "data" / ".geocode_cache.json"

_geocode_cache = None


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


def validate_event(event: dict[str, Any], index: int) -> list[str]:
    """
    title: Validate a single event entry.
    parameters:
      event:
        type: dict[str, Any]
      index:
        type: int
    returns:
      type: list[str]
    """
    errors = []

    for field in REQUIRED_FIELDS:
        if field not in event or not event[field]:
            errors.append(f"Event #{index}: Missing required field '{field}'")

    # Validate date format
    if "date" in event:
        try:
            datetime.strptime(event["date"], "%Y-%m-%d")
        except ValueError:
            errors.append(
                f"Event #{index}: Invalid date format '{event['date']}' (expected YYYY-MM-DD)"
            )

    # Validate time format
    if "time" in event:
        try:
            datetime.strptime(event["time"], "%H:%M")
        except ValueError:
            errors.append(
                f"Event #{index}: Invalid time format '{event['time']}' (expected HH:MM)"
            )

    # Validate timezone
    if "timezone" in event:
        try:
            ZoneInfo(event["timezone"])
        except Exception:
            errors.append(
                f"Event #{index}: Invalid timezone '{event['timezone']}' (expected IANA format like 'America/Sao_Paulo')"
            )

    return errors


def convert_to_utc(event: dict[str, Any], index: int) -> tuple[str, str]:
    """
    title: Convert local date/time to UTC ISO string.
    parameters:
      event:
        type: dict[str, Any]
      index:
        type: int
    returns:
      type: tuple[str, str]
      description: tuple of (startsAtUtc, error_message) or ("", error_message)
    """
    try:
        date_str = event["date"]
        time_str = event["time"]
        tz_str = event["timezone"]

        local_dt = datetime.strptime(
            f"{date_str} {time_str}", "%Y-%m-%d %H:%M"
        )

        tz = ZoneInfo(tz_str)
        local_aware = local_dt.replace(tzinfo=tz)

        utc_dt = local_aware.astimezone(ZoneInfo("UTC"))

        return utc_dt.isoformat().replace("+00:00", "Z"), ""
    except Exception as e:
        return "", f"Event #{index}: Failed to convert time to UTC: {str(e)}"


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

    # Validate all events
    all_errors = []
    for i, event in enumerate(events, start=1):
        errors = validate_event(event, i)
        all_errors.extend(errors)

        # Geocode if we have a location and no coordinates
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

    if all_errors:
        print("Validation errors:", file=sys.stderr)
        for error in all_errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    print("All events validated successfully")

    save_cache()
    # Convert to UTC and generate output
    output_events = []
    conversion_errors = []
    for i, event in enumerate(events, start=1):
        utc_str, error = convert_to_utc(event, i)
        if error:
            conversion_errors.append(error)
        else:
            event_copy = event.copy()
            event_copy["startsAtUtc"] = utc_str
            output_events.append(event_copy)

    if conversion_errors:
        print("Conversion errors:", file=sys.stderr)
        for error in conversion_errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Write JSON output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_events, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Generated: {OUTPUT_FILE}")
    print(f"Total events: {len(output_events)}")


if __name__ == "__main__":
    main()
