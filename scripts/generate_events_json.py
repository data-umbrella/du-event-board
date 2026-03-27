#!/usr/bin/env python3
"""
title: Generate events.json from events.yaml.
summary: |-
  Reads the YAML event data file and produces a JSON file
  that the React frontend consumes.
"""

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
    "start_date",
    "end_date",
    "time",
    "location",
    "region",
    "state",
    "country",
    "category",
    "event_type",
    "cost",
]
ALLOWED_EVENT_TYPES = {"online", "in-person", "hybrid"}
ALLOWED_COSTS = {"free", "paid"}
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"
OUTPUT_FILE = PROJECT_ROOT / "src" / "data" / "events.json"
CACHE_FILE = PROJECT_ROOT / "data" / ".geocode_cache.json"

_geocode_cache: dict[str, Any] | None = None


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
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _geocode_cache = json.load(f)
        else:
            _geocode_cache = {}
    return _geocode_cache


def save_cache() -> None:
    """
    title: Save the geocode cache dictionary back to disk.
    """
    if _geocode_cache is not None:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
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

    # Skip network calls in CI/CD environments to keep builds fast
    # and avoid rate limits.
    if is_ci():
        print(f"  [CI] Skipping geocode for '{location_str}'")
        return None

    print(f"  [Network] Fetching coordinates for '{location_str}'...")
    query = urllib.parse.quote(location_str)
    url = (
        "https://nominatim.openstreetmap.org/search"
        f"?q={query}&format=json&limit=1"
    )

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

    parsed_dates: dict[str, datetime] = {}
    for field in ["start_date", "end_date"]:
        if field in event:
            try:
                if isinstance(event[field], datetime):
                    event[field] = event[field].strftime("%Y-%m-%d")
                parsed_dates[field] = datetime.strptime(
                    str(event[field]), "%Y-%m-%d"
                )
            except ValueError:
                errors.append(
                    f"Event #{index}: Invalid {field} format "
                    f"'{event[field]}' (expected YYYY-MM-DD)"
                )

    if (
        "start_date" in parsed_dates
        and "end_date" in parsed_dates
        and parsed_dates["end_date"] < parsed_dates["start_date"]
    ):
        errors.append(
            f"Event #{index}: end_date must be on or after start_date"
        )

    if "time" in event:
        try:
            if not isinstance(event["time"], str):
                event["time"] = event["time"].strftime("%H:%M")
            datetime.strptime(event["time"], "%H:%M")
        except ValueError:
            errors.append(
                f"Event #{index}: Invalid time format "
                f"'{event['time']}' (expected HH:MM)"
            )

    if (
        "event_type" in event
        and event["event_type"] not in ALLOWED_EVENT_TYPES
    ):
        errors.append(
            f"Event #{index}: Invalid event_type '{event['event_type']}'"
        )

    if "cost" in event and event["cost"] not in ALLOWED_COSTS:
        errors.append(f"Event #{index}: Invalid cost '{event['cost']}'")

    if "organizer_logo" in event and event["organizer_logo"]:
        parsed_logo = urllib.parse.urlparse(event["organizer_logo"])
        is_local_asset = event["organizer_logo"].startswith("/")
        is_remote_asset = parsed_logo.scheme in {"http", "https"}
        if not is_local_asset and not is_remote_asset:
            errors.append(
                f"Event #{index}: organizer_logo must be an absolute URL "
                f"or root-relative asset path"
            )

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
                    final_output.append(f"    lat: {event_data['lat']}\n")
                    final_output.append(f"    lng: {event_data['lng']}\n")

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
    all_errors = []

    for i, event in enumerate(events, start=1):
        errors = validate_event(event, i)
        all_errors.extend(errors)

        event["date"] = event["start_date"]

        if not errors and "lat" not in event:
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
            "Surgically updating source file with new "
            f"coordinates: {INPUT_FILE}"
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
