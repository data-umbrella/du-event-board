#!/usr/bin/env python3
"""
title: Validate event metadata from data/events.yaml.
summary: |-
  Reads the YAML event data file and validates each event entry
  against the required schema before JSON generation.
"""

import json
import sys
from pathlib import Path

import jsonschema
import yaml

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
EVENTS_FILE = PROJECT_ROOT / "data" / "events.yaml"
SCHEMA_FILE = PROJECT_ROOT / "data" / "event_schema.json"


def main() -> None:
    """
    title: Validate all events in data/events.yaml against the JSON schema.
    """
    if not EVENTS_FILE.exists():
        print(f"❌ Could not find events file at: {EVENTS_FILE}")
        sys.exit(1)

    if not SCHEMA_FILE.exists():
        print(f"❌ Could not find schema file at: {SCHEMA_FILE}")
        sys.exit(1)

    with open(EVENTS_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema = json.load(f)

    if isinstance(data, dict) and "events" in data:
        events = data["events"]
    else:
        print("❌ data/events.yaml must contain an 'events' key")
        sys.exit(1)

    all_errors = []
    for i, event in enumerate(events):
        try:
            jsonschema.validate(instance=event, schema=schema)
        except jsonschema.ValidationError as e:
            event_id = event.get("id", f"index {i}")
            all_errors.append(f"Event id={event_id!r}: {e.message}")

    if all_errors:
        print("\n" + "═" * 60)
        print("❌  EVENT METADATA VALIDATION FAILED")
        print("═" * 60)
        for err in all_errors:
            print(f"  • {err}")
        print("═" * 60 + "\n")
        sys.exit(1)

    print(f"✅  All {len(events)} event(s) passed schema validation.")


if __name__ == "__main__":
    main()
