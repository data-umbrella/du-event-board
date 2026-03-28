#!/usr/bin/env python3
"""
title: Archive past events from events.yaml to data/past_events.yaml.
summary: |-
  Reads data/events.yaml, identifies events whose date has passed by more than
  30 days,
  moves them to data/past_events.yaml, and writes both files back.
  Designed to run on a weekly schedule via GitHub Actions.
"""

import sys
from datetime import date, timedelta
from pathlib import Path

import yaml  # type: ignore

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
EVENTS_FILE = PROJECT_ROOT / "data" / "events.yaml"
PAST_EVENTS_FILE = PROJECT_ROOT / "data" / "past_events.yaml"


def load_yaml_events(filepath: Path) -> list[dict]:
    """
    title: Load events from a YAML file.
    summary: >-
      Load events list from a YAML file. Returns empty list if file missing.
    parameters:
      filepath:
        type: Path
    returns:
      type: list[dict]
    """
    if not filepath.exists():
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not data:
        return []
    return list(data.get("events", []))


def write_yaml_events(filepath: Path, events: list[dict]) -> None:
    """
    title: Write events to a YAML file.
    summary: Write events list back to a YAML file under an 'events' key.
    parameters:
      filepath:
        type: Path
      events:
        type: list[dict]
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        yaml.dump(
            {"events": events},
            f,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
        )


def main() -> None:
    """
    title: Run the archive process.
    summary: Read events.yaml, split by date, write both files back.
    """
    if not EVENTS_FILE.exists():
        print(f"Error: Events file not found: {EVENTS_FILE}", file=sys.stderr)
        sys.exit(1)

    today = date.today()
    print(f"Running archive check for date: {today}")

    live_events = load_yaml_events(EVENTS_FILE)
    past_events = load_yaml_events(PAST_EVENTS_FILE)

    print(f"  Live events (before):  {len(live_events)}")
    print(f"  Past events (before):  {len(past_events)}")

    still_live = []
    newly_archived = []

    for event in live_events:
        raw_date = event.get("date", "")
        try:
            event_date = date.fromisoformat(str(raw_date))
        except ValueError:
            print(
                f"  Warning: Could not parse date '{raw_date}' "
                f"for event id={event.get('id')}. Keeping in live feed.",
                file=sys.stderr,
            )
            still_live.append(event)
            continue

        if event_date < today - timedelta(days=30):
            newly_archived.append(event)
        else:
            still_live.append(event)

    if not newly_archived:
        print("No events to archive today. Exiting cleanly.")
        sys.exit(0)

    # Merge: past_events already archived + newly archived (avoid duplicates by id)
    existing_ids = {str(e.get("id")) for e in past_events}
    for event in newly_archived:
        if str(event.get("id")) not in existing_ids:
            past_events.append(event)
            existing_ids.add(str(event.get("id")))

    # Sort past_events by date descending (most recent past first)
    past_events.sort(key=lambda e: str(e.get("date", "")), reverse=True)

    write_yaml_events(EVENTS_FILE, still_live)
    write_yaml_events(PAST_EVENTS_FILE, past_events)

    print(
        f"  Archived {len(newly_archived)} event(s): "
        f"{[e.get('id') for e in newly_archived]}"
    )
    print(f"  Live events (after):   {len(still_live)}")
    print(f"  Past events (after):   {len(past_events)}")
    print("Archive complete.")


if __name__ == "__main__":
    main()
