#!/usr/bin/env python3
"""
title: Delete pending submission when PR is closed without merging.
summary: |-
  Parses the event details from events.yaml in the PR branch and sends a delete
  request to the Google Sheet Web App to remove the row from Form Responses 1.
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
import yaml

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"


def main() -> None:
    """
    title: Main function.
    """
    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found.", file=sys.stderr)
        sys.exit(1)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        pr_data = yaml.safe_load(f) or {"events": []}
    pr_events = pr_data.get("events", [])

    # Try to load origin/main events.yaml to find the newly added event
    import subprocess

    main_ids = set()
    try:
        # Fetch origin/main first
        subprocess.run(
            ["git", "fetch", "origin", "main"],
            check=True,
            capture_output=True,
        )
        main_yaml_bytes = subprocess.run(
            ["git", "show", "origin/main:data/events.yaml"],
            check=True,
            capture_output=True,
        ).stdout
        main_data = yaml.safe_load(main_yaml_bytes) or {"events": []}
        main_events = main_data.get("events", [])
        main_ids = {str(e.get("id", "")) for e in main_events if e.get("id")}
    except Exception as e:
        print(
            f"Warning: Could not fetch/load origin/main:data/events.yaml: {e}",
            file=sys.stderr,
        )

    added_events = []
    for event in pr_events:
        e_id = str(event.get("id", ""))
        if e_id and e_id not in main_ids:
            added_events.append(event)

    # Fallback to the last event in events.yaml of the branch
    if not added_events and pr_events:
        added_events.append(pr_events[-1])

    if not added_events:
        print("No added event found to delete.")
        sys.exit(0)

    event_to_delete = added_events[0]
    title = event_to_delete.get("title", "")
    date = event_to_delete.get("date", "")

    if not title or not date:
        print(
            "Could not determine event title or start date from events.yaml.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(
        f"Requesting removal of pending submission: '{title}' on date {date}..."
    )

    webapp_url = os.environ.get("GOOGLE_SHEET_WEBAPP_URL")
    secret_token = os.environ.get("GOOGLE_SHEET_SECRET_TOKEN")

    if not webapp_url or not secret_token:
        print(
            "Error: GOOGLE_SHEET_WEBAPP_URL and GOOGLE_SHEET_SECRET_TOKEN are required.",
            file=sys.stderr,
        )
        sys.exit(1)

    parsed_url = urllib.parse.urlparse(webapp_url)

    def make_request(action: str) -> None:
        """
        title: Make a request to the Google Sheet Web App.
        parameters:
          action:
            type: str
        """
        query_params = urllib.parse.parse_qs(parsed_url.query)
        query_params["action"] = [action]
        query_params["token"] = [secret_token]
        new_query = urllib.parse.urlencode(query_params, doseq=True)
        req_url = urllib.parse.urlunparse(
            (
                parsed_url.scheme,
                parsed_url.netloc,
                parsed_url.path,
                parsed_url.params,
                new_query,
                parsed_url.fragment,
            )
        )

        payload = {"event_name": title, "start_date": date}
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            req_url,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "GitHubActions-Sync",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req) as response:
                res_body = json.loads(response.read().decode())
                if isinstance(res_body, dict) and "error" in res_body:
                    print(
                        f"Error from Web App ({action}): {res_body['error']}",
                        file=sys.stderr,
                    )
                else:
                    print(f"Successfully requested {action} for: '{title}'")
        except Exception as e:
            print(
                f"Failed to call Google Sheet Web App ({action}): {e}",
                file=sys.stderr,
            )

    # Always attempt to remove from Form Responses 1 queue
    make_request("delete_pending")

    # If the PR was closed WITHOUT merging (rejected), ALSO delete it from event-listing
    # to ensure it doesn't get synced again.
    pr_is_merged = os.environ.get("PR_IS_MERGED", "false").lower() == "true"
    if not pr_is_merged:
        print(
            "PR was rejected (closed without merging). Requesting deletion from event-listing as well..."
        )
        make_request("delete_event")


if __name__ == "__main__":
    main()
