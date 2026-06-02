#!/usr/bin/env python3
import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path
import yaml  # type: ignore
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"
CACHE_FILE = PROJECT_ROOT / "data" / ".geocode_cache.json"

LABEL_TO_KEY = {
    "Event Name": "title",
    "Start Date": "date",
    "Start Time": "start_time",
    "End Date": "end_date",
    "End Time": "end_time",
    "Event Type": "category",
    "Featured": "featured",
    "Tags": "tags",
    "Event Description (200 char max)": "description",
    "Organization Name": "organization_name",
    "Organization URL": "organization_url",
    "LinkedIn URL": "url_linkedin",
    "Twitter URL": "url_twitter",
    "Other URL": "url_other",
    "Acronym": "acronym",
    "Paid or Free": "paid_or_free",
    "Event URL": "url",
    "Image URL": "image_url",
    "Location": "location",
    "Region": "region",
    "In Person": "in_person",
    "Virtual": "virtual",
    "Language": "language",
}

REQUIRED_KEYS = [
    "title",
    "date",
    "tags",
    "description",
    "url",
    "location",
    "region",
    "language",
]


def parse_issue_body(body: str) -> dict[str, str]:
    """
    title: Parse GitHub Issue Form Markdown body and extract fields.
    parameters:
      body:
        type: str
    returns:
      type: dict[str, str]
    """
    pattern = r"###\s+(.+?)\n+(.*?)(?=\n+###|\Z)"
    matches = re.findall(pattern, body, re.DOTALL)

    parsed = {}
    for label, val in matches:
        label = label.strip()
        val = val.strip()
        if val == "_No response_" or not val:
            val = ""
        parsed[label] = val
    return parsed


def geocode_location_forced(
    location_str: str, cache: dict[str, list[float]]
) -> tuple[float, float] | None:
    """
    title: Geocode a location using Nominatim API and updates the cache.
    parameters:
      location_str:
        type: str
      cache:
        type: dict[str, list[float]]
    returns:
      type: tuple[float, float] | None
    """
    if not location_str or location_str.lower() == "online":
        return None

    if location_str in cache:
        return (cache[location_str][0], cache[location_str][1])

    print(f"  [Network] Fetching coordinates for '{location_str}'...")
    query = urllib.parse.quote(location_str)
    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1"

    req = urllib.request.Request(
        url, headers={"User-Agent": "DU-Event-Board-App/1.0"}
    )
    try:
        time.sleep(1.2)  # Respect OpenStreetMap Nominatim usage policy
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data and len(data) > 0:
                coords = [float(data[0]["lat"]), float(data[0]["lon"])]
                cache[location_str] = coords
                return (coords[0], coords[1])
    except Exception as e:
        print(
            f"Warning: Geocoding failed for '{location_str}': {e}",
            file=sys.stderr,
        )
    return None


def format_event_yaml(event: dict[str, Any]) -> str:
    """
    title: >-
      Format the event dictionary to match the events.yaml formatting style.
    parameters:
      event:
        type: dict[str, Any]
    returns:
      type: str
    """
    lines = []
    lines.append(f"  - id: {json.dumps(event['id'])}")

    if "lat" in event and event["lat"] is not None:
        lines.append(f"    lat: {event['lat']}")
        lines.append(f"    lng: {event['lng']}")

    for key in [
        "title",
        "description",
        "date",
        "location",
        "region",
        "category",
    ]:
        val = event.get(key, "")
        lines.append(f"    {key}: {json.dumps(val, ensure_ascii=False)}")

    if "tags" in event and event["tags"]:
        lines.append("    tags:")
        for tag in event["tags"]:
            lines.append(f"      - {tag}")

    optional_keys = [
        "time",
        "start_time",
        "end_time",
        "end_date",
        "featured",
        "organization_name",
        "organization_url",
        "url_linkedin",
        "url_twitter",
        "url_other",
        "acronym",
        "paid_or_free",
        "url",
        "image_url",
        "in_person",
        "virtual",
    ]
    for key in optional_keys:
        if key in event and event[key] is not None and event[key] != "":
            val = event[key]
            if isinstance(val, int):
                lines.append(f"    {key}: {val}")
            else:
                lines.append(
                    f"    {key}: {json.dumps(val, ensure_ascii=False)}"
                )

    if "language" in event and event["language"]:
        lines.append("    language:")
        for lang in event["language"]:
            lines.append(f"      - {lang}")

    return "\n".join(lines) + "\n"


def main() -> None:
    """
    title: >-
      Main function to parse and validate issue input, geocode location, and
      append to events.yaml.
    """
    body = os.environ.get("ISSUE_BODY", "").strip()
    if not body:
        print(
            "Error: ISSUE_BODY environment variable is empty or not set.",
            file=sys.stderr,
        )
        sys.exit(1)

    parsed_fields = parse_issue_body(body)

    # Map fields
    event: dict[str, Any] = {}
    for label, val in parsed_fields.items():
        if label in LABEL_TO_KEY:
            key = LABEL_TO_KEY[label]
            event[key] = val

    # Validations
    errors = []

    # Check required fields
    for key in REQUIRED_KEYS:
        if not event.get(key):
            # Find the label for user-friendly messaging
            label = [lbl for lbl, k in LABEL_TO_KEY.items() if k == key][0]
            errors.append(f"Missing required field: **{label}**")

    # Validate/format date fields
    for date_key in ["date", "end_date"]:
        date_val = event.get(date_key)
        if date_val:
            try:
                datetime.strptime(date_val, "%Y-%m-%d")
            except ValueError:
                label = [
                    lbl for lbl, k in LABEL_TO_KEY.items() if k == date_key
                ][0]
                errors.append(
                    f"Invalid format for **{label}**: '{date_val}' (expected YYYY-MM-DD)"
                )

    # Validate/format time fields
    for time_key in ["time", "start_time", "end_time"]:
        time_val = event.get(time_key)
        if time_val:
            try:
                datetime.strptime(time_val, "%H:%M")
            except ValueError:
                label = [
                    lbl for lbl, k in LABEL_TO_KEY.items() if k == time_key
                ][0]
                errors.append(
                    f"Invalid format for **{label}**: '{time_val}' (expected HH:MM)"
                )

    # Validate description length
    desc = event.get("description", "")
    if desc and len(desc) > 200:
        errors.append(
            f"Event Description length ({len(desc)} characters) exceeds the 200 characters limit."
        )

    # Validate featured
    feat = event.get("featured", "No")
    if not feat or feat == "No":
        event["featured"] = 0
    elif feat == "Yes":
        event["featured"] = 1
    else:
        try:
            event["featured"] = int(feat)
            if event["featured"] not in [0, 1]:
                errors.append("Featured must be either 'No' or 'Yes'.")
        except ValueError:
            errors.append(
                f"Featured must be either 'No' or 'Yes', found: '{feat}'."
            )

    # If errors, write error report and exit
    if errors:
        error_msg = "### ❌ Event Validation Failed\n\nPlease correct the following errors:\n\n"
        for error in errors:
            error_msg += f"- {error}\n"

        with open("error_message.md", "w") as f:
            f.write(error_msg)

        print("Validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    # Process lists (tags, language)
    event["tags"] = [
        t.strip() for t in event.get("tags", "").split(",") if t.strip()
    ]
    event["language"] = [
        lang.strip()
        for lang in event.get("language", "").split(",")
        if lang.strip()
    ]

    # Generate sequential ID
    if not INPUT_FILE.exists():
        print(
            f"Error: YAML file does not exist: {INPUT_FILE}", file=sys.stderr
        )
        sys.exit(1)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    events_list = data.get("events", [])
    existing_ids = []
    for e in events_list:
        try:
            existing_ids.append(int(e["id"]))
        except ValueError:
            pass

    next_id = str(max(existing_ids) + 1) if existing_ids else "1"
    event["id"] = next_id

    # Load cache and Geocode location
    cache = {}
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r") as f:
                cache = json.load(f)
        except Exception as e:
            print(
                f"Warning: Failed to load geocode cache: {e}", file=sys.stderr
            )

    coords = geocode_location_forced(event["location"], cache)
    if not coords and event["region"]:
        coords = geocode_location_forced(event["region"], cache)

    if coords:
        event["lat"], event["lng"] = coords
    else:
        event["lat"], event["lng"] = None, None

    # Save updated cache
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save geocode cache: {e}", file=sys.stderr)

    # Format event as YAML string and append to file
    yaml_block = format_event_yaml(event)

    # Read the file to ensure we append nicely (with a newline prefix if needed)
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Append to events.yaml
    if not content.endswith("\n"):
        yaml_block = "\n" + yaml_block
    else:
        # Check if we need an extra blank line before appending
        # Let's add a blank line for readability, matching other events
        yaml_block = "\n" + yaml_block

    with open(INPUT_FILE, "a", encoding="utf-8") as f:
        f.write(yaml_block)

    print(f"Successfully added event: {event['title']} (ID: {event['id']})")

    # Write event name to GITHUB_OUTPUT
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"event_name={event['title']}\n")


if __name__ == "__main__":
    main()
