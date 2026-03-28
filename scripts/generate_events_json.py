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
import urllib.request
import urllib.parse
from typing import Any
from datetime import datetime
from pathlib import Path

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
]
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
            if isinstance(event["date"], datetime):
                event["date"] = event["date"].strftime("%Y-%m-%d")
            datetime.strptime(str(event["date"]), "%Y-%m-%d")
        except ValueError:
            errors.append(
                f"Event #{index}: Invalid date format '{event['date']}' (expected YYYY-MM-DD)"
            )

    # Validate time format
    if "time" in event:
        try:
            # Handle time objects if PyYAML parsed them
            if not isinstance(event["time"], str):
                event["time"] = event["time"].strftime("%H:%M")
            datetime.strptime(event["time"], "%H:%M")
        except ValueError:
            errors.append(
                f"Event #{index}: Invalid time format '{event['time']}' (expected HH:MM)"
            )

    # Optional featured / featured_rank (curated strip in the UI)
    if "featured" in event:
        if not isinstance(event["featured"], bool):
            errors.append(
                f"Event #{index}: 'featured' must be a boolean (YAML true/false), "
                f"got {type(event['featured']).__name__}"
            )
    is_featured = event.get("featured") is True
    if "featured_rank" in event:
        if not is_featured:
            errors.append(
                f"Event #{index}: 'featured_rank' is only allowed when 'featured' is true"
            )
        else:
            rank_val = event["featured_rank"]
            if isinstance(rank_val, bool) or not isinstance(rank_val, int):
                errors.append(
                    f"Event #{index}: 'featured_rank' must be an integer, "
                    f"got {type(rank_val).__name__}"
                )
            elif rank_val < 0:
                errors.append(
                    f"Event #{index}: 'featured_rank' must be >= 0, got {rank_val!r}"
                )

    return errors


def normalize_featured_fields(event: dict[str, Any]) -> None:
    """
    title: Keep JSON output consistent for optional featured fields.
    summary: >-
      Featured events get explicit rank (default 0). Non-featured entries
      omit both keys so the frontend can use `featured === true` checks.
    """
    if event.get("featured") is True:
        rank = event.get("featured_rank", 0)
        event["featured"] = True
        event["featured_rank"] = int(rank)
    else:
        event.pop("featured", None)
        event.pop("featured_rank", None)


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

    # Track which events we've already updated in this pass
    updated_ids = {str(e["id"]) for e in events_with_coords if "lat" in e}

    i = 0
    while i < len(lines):
        line = lines[i]
        final_output.append(line)

        # Look for the start of an event: "  - id: \"X\"" or "  - id: 'X'"
        if line.strip().startswith("- id:"):
            # Extract the ID
            event_id = line.strip().split(":", 1)[1].strip().strip("'\"")

            if event_id in updated_ids:
                # Find the event data
                event_data = next(
                    e for e in events_with_coords if str(e["id"]) == event_id
                )

                # Check if it already has coordinates in the text block
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
                    # Insert before the block ends or before an empty line
                    # Determine indentation (match the 'id' key's indentation)
                    id_indent = line[: line.find("- id:")]
                    property_indent = id_indent + "    "

                    # Wait, if id_indent is "  ", then id is at 4, title is at 4.
                    # So property_indent should be id_indent + "  " to reach 4 spaces.
                    # Actually, let's just use "    " directly as it matches the file.
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

    # Track if we updated any events with new coordinates
    new_coords_found = False

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
                new_coords_found = True

    if all_errors:
        print("Validation errors:", file=sys.stderr)
        for error in all_errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    for event in events:
        normalize_featured_fields(event)

    print("All events validated successfully")

    # If we found new coordinates locally, save them back to the source YAML surgically
    if new_coords_found and not is_ci():
        print(
            f"Surgically updating source file with new coordinates: {INPUT_FILE}"
        )
        update_yaml_surgically(events)
        print("  Done.")

    save_cache()

    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Write JSON output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Generated: {OUTPUT_FILE}")
    print(f"Total events: {len(events)}")


if __name__ == "__main__":
    main()
