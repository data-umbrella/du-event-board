#!/usr/bin/env python3
"""
title: Add event from Google Forms submission.
summary: |-
  Processes the incoming webhook payload from Google Forms, maps and normalizes
  the fields, geocodes the coordinates, and appends the event to events.yaml.
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any
import yaml

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"
CACHE_FILE = PROJECT_ROOT / "data" / ".geocode_cache.json"

# Key mapping from Google Form questions / Sheet headers to internal YAML keys
FIELD_MAPPING = {
    "title": ["Event Name", "event_name", "title"],
    "date": ["Start Date and Time", "start_date", "date"],
    "end_date": ["End Date and Time", "end_date"],
    "category": [
        "Event Type (e.g., Conference, Workshop, Webinar)",
        "event_type",
        "category",
    ],
    "featured": ["Is this a Featured Event?", "featured"],
    "tags": ["Relevant Tags", "tags"],
    "description": [
        "Event Description (Maximum 200 characters - A brief, compelling summary)",
        "event_description (200 char)",
        "description",
    ],
    "organization_name": ["Hosting Organization Name", "organization_name"],
    "acronym": ["Organization Acronym (if applicable)", "acronym"],
    "organization_url": [
        "Official Organization Website URL",
        "organization_url",
    ],
    "url_linkedin": [
        "LinkedIn Profile URL for Organization (Optional)",
        "url_linkedin",
    ],
    "url_twitter": [
        "Twitter/X Profile URL for Organization (Optional)",
        "url_twitter",
    ],
    "url_other": ["Other Social Media/Contact URL (Optional)", "url_other"],
    "paid_or_free": ["Is the Event Paid or Free?", "paid_or_free"],
    "url": ["Official Event Registration/Information URL", "event_url", "url"],
    "image_url": [
        "High-Resolution Event Image/Logo URL (Must be publicly accessible)",
        "image_url",
    ],
    "location": ["Physical Location (If In-Person: Full Address)", "location"],
    "city": ["city"],
    "state-province": ["state-province", "state/province"],
    "country": ["country"],
    "region": [
        "Geographic Region (e.g., North America, Europe, APAC, Global)",
        "region",
    ],
    "language": ["Primary Language of the Event", "language"],
}


def clean_boolean(val: Any) -> bool:
    """
    title: Normalize any truthy value to a boolean.
    parameters:
      val:
        type: Any
    returns:
      type: bool
    """
    if isinstance(val, bool):
        return val
    val_str = str(val).strip().lower()
    return any(
        keyword in val_str
        for keyword in ("true", "yes", "1", "y", "t", "x", "checked")
    )


def clean_tags(val: Any) -> list[str]:
    """
    title: Clean and split tag values into a list of strings.
    parameters:
      val:
        type: Any
    returns:
      type: list[str]
    """
    if not val:
        return []
    if isinstance(val, list):
        return [str(t).strip() for t in val if t]
    # Comma-separated or space-separated list
    return [t.strip() for t in str(val).replace(",", " ").split() if t.strip()]


def parse_date_time(dt_str: str) -> tuple[str, str]:
    """
    title: Parse date and time from Google Forms formats.
    parameters:
      dt_str:
        type: str
    returns:
      type: tuple[str, str]
    """
    dt_str = dt_str.strip()
    if not dt_str:
        return "", ""

    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
        "%Y/%m/%d",
    ]

    # Try direct datetime parsing
    for fmt in formats:
        try:
            dt = datetime.strptime(dt_str, fmt)
            time_val = dt.strftime("%H:%M") if "H" in fmt or "M" in fmt else ""
            return dt.strftime("%Y-%m-%d"), time_val
        except ValueError:
            continue

    # Fallback regex searching for date patterns
    date_match = re.search(
        r"(\d{4}[-/]\d{2}[-/]\d{2})|(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", dt_str
    )
    time_match = re.search(r"(\d{1,2}:\d{2}(?::\d{2})?)", dt_str)

    date_val = ""
    time_val = ""

    if date_match:
        raw_date = date_match.group(0).replace("/", "-")
        for fmt in [
            "%Y-%m-%d",
            "%m-%d-%Y",
            "%d-%m-%Y",
            "%m-%d-%y",
            "%d-%m-%y",
        ]:
            try:
                dt = datetime.strptime(raw_date, fmt)
                date_val = dt.strftime("%Y-%m-%d")
                break
            except ValueError:
                continue

    if time_match:
        time_val = time_match.group(0)
        parts = time_val.split(":")
        time_val = f"{int(parts[0]):02d}:{int(parts[1]):02d}"

    return date_val, time_val


def get_cache() -> dict[str, Any]:
    """
    title: Retrieve geocoding cache.
    returns:
      type: dict[str, Any]
    """
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r") as f:
                res: dict[str, Any] = json.load(f)
                return res
        except Exception:
            return {}
    return {}


def save_cache(cache: dict[str, Any]) -> None:
    """
    title: Save geocoding cache back to disk.
    parameters:
      cache:
        type: dict[str, Any]
    """
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save geocode cache: {e}")


def geocode_location(location_str: str) -> tuple[float, float] | None:
    """
    title: Resolve location string into coordinates.
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

    print(f"Fetching coordinates for '{location_str}'...")
    query = urllib.parse.quote(location_str)
    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1"

    req = urllib.request.Request(
        url, headers={"User-Agent": "DU-Event-Board-App/1.0"}
    )
    try:
        time.sleep(1.1)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data and len(data) > 0:
                coords = (float(data[0]["lat"]), float(data[0]["lon"]))
                cache[location_str] = coords
                save_cache(cache)
                return coords
    except Exception as e:
        print(
            f"Warning: Geocoding failed for '{location_str}': {e}",
            file=sys.stderr,
        )
    return None


def format_yaml_field(key: str, val: Any, indent: int = 4) -> str:
    """
    title: Format a key-value pair to YAML format.
    parameters:
      key:
        type: str
      val:
        type: Any
      indent:
        type: int
    returns:
      type: str
    """
    dumped = yaml.safe_dump(
        {key: val}, default_flow_style=False, allow_unicode=True
    ).strip()
    lines = dumped.splitlines()
    formatted_lines = []
    for line in lines:
        if line.startswith("- "):
            formatted_lines.append(" " * (indent + 2) + line)
        else:
            formatted_lines.append(" " * indent + line)
    return "\n".join(formatted_lines)


def main() -> None:
    """
    title: Execute the Google Forms to PR workflow.
    """
    payload_str = None
    if len(sys.argv) > 1:
        payload_file = Path(sys.argv[1])
        if payload_file.exists():
            payload_str = payload_file.read_text(encoding="utf-8")
    else:
        payload_str = os.environ.get("EVENT_PAYLOAD")

    if not payload_str:
        print("Error: No event payload provided.", file=sys.stderr)
        sys.exit(1)

    try:
        raw_payload = json.loads(payload_str)
    except Exception as e:
        print(f"Error parsing payload JSON: {e}", file=sys.stderr)
        sys.exit(1)

    print("Received event payload:", json.dumps(raw_payload, indent=2))

    normalized_raw = {k.strip().lower(): v for k, v in raw_payload.items()}

    event_data: dict[str, Any] = {}
    for target_key, source_alternatives in FIELD_MAPPING.items():
        found_val: Any = ""
        for alt in source_alternatives:
            alt_norm = alt.strip().lower()
            if alt_norm in normalized_raw:
                found_val = normalized_raw[alt_norm]
                break

        if target_key == "featured":
            event_data[target_key] = clean_boolean(found_val)
        elif target_key == "tags":
            event_data[target_key] = clean_tags(found_val)
        else:
            event_data[target_key] = str(found_val).strip()

    date_val, time_val = parse_date_time(str(event_data.get("date", "")))
    event_data["date"] = date_val
    event_data["time"] = time_val

    end_date_val, end_time_val = parse_date_time(
        str(event_data.get("end_date", ""))
    )
    event_data["end_date"] = end_date_val
    if end_time_val:
        event_data["end_time"] = end_time_val

    location_type = str(normalized_raw.get("location type", "")).lower()
    in_person_val = False
    virtual_val = False
    if "in-person" in location_type or "in person" in location_type:
        in_person_val = True
    if "virtual" in location_type or "online" in location_type:
        virtual_val = True

    if "in_person" in normalized_raw:
        in_person_val = clean_boolean(normalized_raw["in_person"])
    if "virtual" in normalized_raw:
        virtual_val = clean_boolean(normalized_raw["virtual"])

    event_data["in_person"] = in_person_val
    event_data["virtual"] = virtual_val

    paid_or_free_val = str(event_data.get("paid_or_free", "")).lower()
    if "free" in paid_or_free_val:
        event_data["paid_or_free"] = "free"
    elif "paid" in paid_or_free_val:
        event_data["paid_or_free"] = "paid"

    # Required validation
    if not event_data.get("title"):
        print("Error: Event Name/Title is required.", file=sys.stderr)
        sys.exit(1)
    if not event_data.get("date"):
        print("Error: Start Date is required.", file=sys.stderr)
        sys.exit(1)

    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found.", file=sys.stderr)
        sys.exit(1)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        current_data = yaml.safe_load(f) or {"events": []}

    events = current_data.get("events", [])

    new_title = str(event_data["title"]).lower()
    new_date = str(event_data["date"])
    duplicate_ids = []
    for event in events:
        if (
            str(event.get("title", "")).lower() == new_title
            and str(event.get("date", "")) == new_date
        ):
            dup_id = event.get("id")
            if dup_id:
                duplicate_ids.append(str(dup_id))
            print(
                f"Warning: Event '{event_data['title']}' on {new_date} might be a duplicate of existing event (ID: {dup_id}).",
                file=sys.stderr,
            )

    if "GITHUB_OUTPUT" in os.environ and duplicate_ids:
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
            note = f"⚠️ **Note:** This event might be a duplicate of existing event(s) with ID(s): {', '.join(duplicate_ids)}"
            f.write(f"duplicate_note={note}\n")

    import random
    from datetime import timezone

    existing_ids = {
        str(ev.get("id")) for ev in events if ev.get("id") is not None
    }

    date_part = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    random_part = f"{random.randint(1000, 9999)}"
    next_id = date_part + random_part
    while next_id in existing_ids:
        random_part = f"{random.randint(1000, 9999)}"
        next_id = date_part + random_part

    event_data["id"] = next_id

    coords = None
    if (
        event_data.get("location")
        and str(event_data["location"]).lower() != "online"
    ):
        coords = geocode_location(str(event_data["location"]))
    if (
        not coords
        and event_data.get("region")
        and str(event_data["region"]).lower() != "online"
    ):
        coords = geocode_location(str(event_data["region"]))

    if coords:
        event_data["lat"] = coords[0]
        event_data["lng"] = coords[1]
    else:
        event_data["lat"] = ""
        event_data["lng"] = ""

    key_order = [
        "id",
        "lat",
        "lng",
        "title",
        "description",
        "date",
        "time",
        "location",
        "region",
        "category",
        "url",
        "tags",
        "end_date",
        "featured",
        "organization_name",
        "organization_url",
        "url_linkedin",
        "url_twitter",
        "url_other",
        "acronym",
        "paid_or_free",
        "image_url",
        "in_person",
        "virtual",
        "language",
    ]

    yaml_lines = []
    first_key = key_order[0]
    first_val = event_data.get(first_key, "")
    yaml_lines.append(f'  - {first_key}: "{first_val}"')

    for key in key_order[1:]:
        val = event_data.get(key)
        if val == "" or val is None or val == []:
            if key in [
                "lat",
                "lng",
                "end_date",
                "organization_name",
                "organization_url",
                "url_linkedin",
                "url_twitter",
                "url_other",
                "acronym",
                "paid_or_free",
                "image_url",
                "in_person",
                "virtual",
                "language",
            ]:
                continue
        yaml_lines.append(format_yaml_field(key, val, indent=4))

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        yaml_content = f.read()

    if not yaml_content.endswith("\n"):
        yaml_content += "\n"

    new_event_yaml = "\n" + "\n".join(yaml_lines) + "\n"
    with open(INPUT_FILE, "w", encoding="utf-8") as f:
        f.write(yaml_content + new_event_yaml)

    print(f"Successfully added event ID {next_id} to events.yaml")

    print("Re-generating events.json...")
    try:
        import subprocess

        result = subprocess.run(
            [
                sys.executable,
                str(PROJECT_ROOT / "scripts" / "generate_events_json.py"),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error running generate_events_json.py: {e}", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
