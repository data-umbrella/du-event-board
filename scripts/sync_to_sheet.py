#!/usr/bin/env python3
"""
title: Sync newly merged events to Google Sheet.
summary: |-
  Compares events from events.yaml against the Google Sheet,
  and appends any new events that do not yet exist in the sheet.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any
import yaml

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_ROOT / "data" / "events.yaml"

sys.path.append(str(SCRIPT_DIR))
from sync_from_sheet import parse_date_time  # noqa: E402


def format_boolean(val: Any) -> str:
    """
    title: Convert boolean/truthy values to Yes/No, or empty if undefined.
    parameters:
      val:
        type: Any
    returns:
      type: str
    """
    if val is None or val == "":
        return ""
    if isinstance(val, bool):
        return "Yes" if val else "No"
    val_str = str(val).strip().lower()
    if val_str == "":
        return ""
    if val_str in ("true", "yes", "1", "y", "t", "x", "checked"):
        return "Yes"
    if val_str in ("false", "no", "0", "n", "f"):
        return "No"
    return str(val)


def format_featured(val: Any) -> str:
    """
    title: Format featured value as '0' or '1' for Google Sheet.
    parameters:
      val:
        type: Any
    returns:
      type: str
    """
    if val is None or val == "":
        return "0"
    if isinstance(val, bool):
        return "1" if val else "0"
    val_str = str(val).strip().lower()
    if val_str in ("true", "yes", "1", "y", "t", "x", "checked"):
        return "1"
    return "0"


def get_derived_category(in_person: Any, virtual: Any) -> str:
    """
    title: Derive event category from in_person and virtual fields.
    parameters:
      in_person:
        type: Any
      virtual:
        type: Any
    returns:
      type: str
    """
    ip = format_boolean(in_person)
    vt = format_boolean(virtual)
    if ip == "Yes" and vt == "Yes":
        return "hybrid"
    elif ip == "Yes":
        return "in-person"
    elif vt == "Yes":
        return "online"
    return ""


def get_open_sync_prs(
    repo: str, token: str
) -> dict[tuple[str, str, str], dict[str, Any]]:
    """
    title: >-
      Fetch open sync PRs and parse their event details from PR descriptions.
    parameters:
      repo:
        type: str
      token:
        type: str
    returns:
      type: dict[tuple[str, str, str], dict[str, Any]]
    """
    url = f"https://api.github.com/repos/{repo}/pulls?state=open&per_page=100"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "GitHubActions-Sync",
        },
        method="GET",
    )
    open_prs = {}
    try:
        with urllib.request.urlopen(req) as response:
            prs = json.loads(response.read().decode("utf-8"))
            for pr in prs:
                body = pr.get("body") or ""
                branch = pr.get("head", {}).get("ref") or ""
                if not (
                    branch.startswith("sync/")
                    or branch.startswith("event-submission-")
                ):
                    continue

                # Parse event details using regex
                id_match = re.search(
                    r"-\s+\*\*Event ID\*\*:\s*`([^`]+)`", body
                )
                title_match = re.search(
                    r"-\s+\*\*Title\*\*:\s*`([^`]+)`", body
                )
                if not title_match:
                    title_match = re.search(
                        r"-\s+\*\*Event Name\*\*:\s*`([^`]+)`", body
                    )
                date_match = re.search(
                    r"-\s+\*\*Start Date\*\*:\s*`([^`]+)`", body
                )
                loc_match = re.search(
                    r"-\s+\*\*Location\*\*:\s*`([^`]+)`", body
                )

                if title_match and date_match:
                    e_id = ""
                    if id_match:
                        e_id = id_match.group(1).strip()
                    else:
                        # Fetch the branch from origin to inspect its events.yaml directly
                        try:
                            subprocess.run(
                                ["git", "fetch", "origin", branch],
                                check=True,
                                capture_output=True,
                            )
                            branch_yaml = subprocess.run(
                                [
                                    "git",
                                    "show",
                                    f"origin/{branch}:data/events.yaml",
                                ],
                                check=True,
                                capture_output=True,
                            ).stdout.decode("utf-8")
                            branch_data = yaml.safe_load(branch_yaml) or {
                                "events": []
                            }
                            branch_events = branch_data.get("events", [])
                            if branch_events:
                                e_id = str(
                                    branch_events[-1].get("id", "")
                                ).strip()
                        except Exception as err:
                            print(
                                f"Warning: Failed to fetch ID from branch {branch}: {err}",
                                file=sys.stderr,
                            )

                    e_title = title_match.group(1).strip()
                    e_date = date_match.group(1).strip()
                    e_loc = loc_match.group(1).strip() if loc_match else ""

                    key = (e_title.lower(), e_date, e_loc.lower())
                    open_prs[key] = {
                        "number": pr["number"],
                        "branch": branch,
                        "id": e_id,
                        "title": e_title,
                    }
    except Exception as e:
        print(f"Warning: Failed to fetch open PRs: {e}", file=sys.stderr)
    return open_prs


def delete_sheet_event(
    webapp_url: str,
    secret_token: str,
    event_id: str,
    title: str,
    date: str,
    location: str,
) -> None:
    """
    title: Delete an event from the Google Sheet via Web App.
    parameters:
      webapp_url:
        type: str
      secret_token:
        type: str
      event_id:
        type: str
      title:
        type: str
      date:
        type: str
      location:
        type: str
    """
    parsed_url = urllib.parse.urlparse(webapp_url)
    query_params = urllib.parse.parse_qs(parsed_url.query)
    query_params["action"] = ["delete_event"]
    query_params["token"] = [secret_token]
    new_query = urllib.parse.urlencode(query_params, doseq=True)
    delete_url = urllib.parse.urlunparse(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            parsed_url.params,
            new_query,
            parsed_url.fragment,
        )
    )
    payload = {
        "id": event_id,
        "event_name": title,
        "start_date": date,
        "location": location,
    }
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        delete_url,
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
                    f"Error deleting event '{title}': {res_body['error']}",
                    file=sys.stderr,
                )
            else:
                print(f"Successfully deleted event from sheet: '{title}'")
    except Exception as e:
        print(f"Failed to delete event '{title}': {e}", file=sys.stderr)


def create_full_payload(event: dict[str, Any]) -> dict[str, Any]:
    """
    title: Generate a full mapping of event fields for the Google Sheet.
    parameters:
      event:
        type: dict[str, Any]
    returns:
      type: dict[str, Any]
    """
    tags_val = event.get("tags", "")
    if isinstance(tags_val, list):
        tags_val = ", ".join(tags_val)

    return {
        "id": event.get("id", ""),
        "start_time": event.get("time", ""),
        "end_time": event.get("end_time", ""),
        "event_name": event.get("title", event.get("event_name", "")),
        "start_date": event.get("date", event.get("start_date", "")),
        "end_date": event.get("end_date", ""),
        "event_type": event.get("category", event.get("event_type", "")),
        "featured": format_featured(event.get("featured", "")),
        "tags": tags_val,
        "event_description (200 char)": event.get(
            "description", event.get("event_description", "")
        ),
        "organization_name": event.get("organization_name", ""),
        "organization_url": event.get("organization_url", ""),
        "url_linkedin": event.get("url_linkedin", ""),
        "url_twitter": event.get("url_twitter", ""),
        "url_other": event.get("url_other", ""),
        "acronym": event.get("acronym", ""),
        "paid_or_free": event.get("paid_or_free", ""),
        "event_url": event.get("url", event.get("event_url", "")),
        "image_url": event.get("image_url", ""),
        "location": event.get("location", ""),
        "city": event.get("city", ""),
        "state-province": event.get("state-province", ""),
        "country": event.get("country", ""),
        "region": event.get("region", ""),
        "in_person": format_boolean(event.get("in_person", "")),
        "virtual": format_boolean(event.get("virtual", "")),
        "event_category (derived)": get_derived_category(
            event.get("in_person", ""), event.get("virtual", "")
        ),
        "language": event.get("language", ""),
    }


def update_sheet_event(
    webapp_url: str,
    secret_token: str,
    event: dict[str, Any],
) -> None:
    """
    title: Update an event's data in the Google Sheet via Web App.
    parameters:
      webapp_url:
        type: str
      secret_token:
        type: str
      event:
        type: dict[str, Any]
    """
    parsed_url = urllib.parse.urlparse(webapp_url)
    query_params = urllib.parse.parse_qs(parsed_url.query)
    query_params["action"] = ["update_event"]
    query_params["token"] = [secret_token]
    new_query = urllib.parse.urlencode(query_params, doseq=True)
    update_url = urllib.parse.urlunparse(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            parsed_url.params,
            new_query,
            parsed_url.fragment,
        )
    )

    payload = create_full_payload(event)

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        update_url,
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
                    f"Error updating event '{payload['event_name']}': {res_body['error']}",
                    file=sys.stderr,
                )
            else:
                print(
                    f"Successfully updated event ID in sheet: '{payload['event_name']}'"
                )
    except Exception as e:
        print(
            f"Failed to update event '{payload['event_name']}': {e}",
            file=sys.stderr,
        )


def main() -> None:
    """
    title: Retrieve YAML events, compare with Google Sheet, and sync.
    """
    webapp_url = os.environ.get("GOOGLE_SHEET_WEBAPP_URL")
    secret_token = os.environ.get("GOOGLE_SHEET_SECRET_TOKEN")

    if not webapp_url or not secret_token:
        print(
            "Error: GOOGLE_SHEET_WEBAPP_URL and GOOGLE_SHEET_SECRET_TOKEN environment variables are required.",
            file=sys.stderr,
        )
        sys.exit(1)

    parsed_url = urllib.parse.urlparse(webapp_url)
    query_params = urllib.parse.parse_qs(parsed_url.query)
    query_params["action"] = ["get_sheet_events"]
    query_params["token"] = [secret_token]
    new_query = urllib.parse.urlencode(query_params, doseq=True)
    get_events_url = urllib.parse.urlunparse(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            parsed_url.params,
            new_query,
            parsed_url.fragment,
        )
    )

    print("Fetching existing event list from Google Sheet...")
    req = urllib.request.Request(
        get_events_url, headers={"User-Agent": "GitHubActions-Sync"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode())
            if isinstance(res_body, dict) and "error" in res_body:
                print(
                    f"Error from Google Sheet Web App: {res_body['error']}",
                    file=sys.stderr,
                )
                sys.exit(1)

            existing_ids = set()
            sheet_events_by_id = {}
            existing_keys = set()
            sheet_events_by_key = {}
            for s_ev in res_body:
                # get id
                s_id = ""
                for candidate in ["id", "event_id", "event id"]:
                    if candidate in s_ev:
                        s_id = str(s_ev[candidate]).strip()
                        break
                    s_ev_lower = {
                        k.lower().strip(): v for k, v in s_ev.items()
                    }
                    if candidate in s_ev_lower:
                        s_id = str(s_ev_lower[candidate]).strip()
                        break
                if s_id.endswith(".0"):
                    s_id = s_id[:-2]

                if s_id:
                    existing_ids.add(s_id)
                    sheet_events_by_id[s_id] = s_ev

                s_title = str(s_ev.get("event_name", "")).strip().lower()
                s_date_raw = str(s_ev.get("start_date", "")).strip()
                s_date, _ = parse_date_time(s_date_raw)
                s_end_date_raw = str(s_ev.get("end_date", "")).strip()
                s_end_date = ""
                if s_end_date_raw:
                    s_end_date, _ = parse_date_time(s_end_date_raw)
                s_location = str(s_ev.get("location", "")).strip().lower()

                if s_title and s_date:
                    key = (s_title, s_date, s_end_date, s_location)
                    existing_keys.add(key)
                    sheet_events_by_key[key] = s_ev
    except Exception as e:
        print(f"Error calling Web App to fetch events: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(existing_keys)} existing events in the Google Sheet.")

    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found.", file=sys.stderr)
        sys.exit(1)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {"events": []}

    events = data.get("events", [])
    print(f"Loaded {len(events)} events from events.yaml.")

    github_token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")

    # Fetch open PRs to build a set of pending additions
    pending_additions = set()
    pending_additions_ids = set()
    if github_token and repo:
        print("Fetching open pull requests to map pending additions...")
        open_sync_prs = get_open_sync_prs(repo, github_token)
        for pr_key, pr_info in open_sync_prs.items():
            pending_additions.add(pr_key)
            pr_id = pr_info.get("id")
            if pr_id:
                pending_additions_ids.add(pr_id)

    yaml_keys = set()
    yaml_ids = set()
    for event in events:
        e_id = str(event.get("id", "")).strip()
        if e_id:
            yaml_ids.add(e_id)

        title = (
            str(event.get("title", event.get("event_name", "")))
            .strip()
            .lower()
        )
        date = str(event.get("date", event.get("start_date", ""))).strip()
        location = str(event.get("location", "")).strip().lower()
        if title and date:
            yaml_keys.add((title, date, location))

    # Identify events in sheet but deleted from YAML
    deleted_events = []
    if github_token:
        for s_ev in res_body:
            s_title = str(s_ev.get("event_name", "")).strip().lower()
            s_date_raw = str(s_ev.get("start_date", "")).strip()
            s_date, _ = parse_date_time(s_date_raw)
            s_location = str(s_ev.get("location", "")).strip().lower()
            if not s_title or not s_date:
                continue

            # Check if it has an ID assigned. If not, it's a new event
            # pending sync to the repo, so we should NOT delete it!
            s_id = ""
            for candidate in ["id", "event_id", "event id"]:
                if candidate in s_ev:
                    s_id = str(s_ev[candidate]).strip()
                    break
                s_ev_lower = {k.lower().strip(): v for k, v in s_ev.items()}
                if candidate in s_ev_lower:
                    s_id = str(s_ev_lower[candidate]).strip()
                    break
            if s_id.endswith(".0"):
                s_id = s_id[:-2]

            if not s_id:
                continue

            sheet_key = (s_title, s_date, s_location)

            # Use ID matching first if available
            is_deleted = False
            if s_id:
                if s_id not in yaml_ids and s_id not in pending_additions_ids:
                    is_deleted = True
            else:
                if (
                    sheet_key not in yaml_keys
                    and sheet_key not in pending_additions
                ):
                    is_deleted = True

            if is_deleted:
                deleted_events.append(
                    (
                        s_id,
                        s_ev.get("event_name", ""),
                        s_date,
                        s_ev.get("location", ""),
                    )
                )

    missing_events = []
    events_needing_update = []
    for event in events:
        e_id = str(event.get("id", "")).strip()
        title = (
            str(event.get("title", event.get("event_name", "")))
            .strip()
            .lower()
        )
        date = str(event.get("date", event.get("start_date", ""))).strip()
        end_date = str(event.get("end_date", "")).strip()
        location = str(event.get("location", "")).strip().lower()
        if not title or not date:
            continue

        s_ev = None
        if e_id and e_id in sheet_events_by_id:
            s_ev = sheet_events_by_id[e_id]
        else:
            key = (title, date, end_date, location)
            if key in existing_keys:
                s_ev = sheet_events_by_key[key]
            else:
                # Fallback: check if we can match by title, date, and a substring of location
                fallback_key = None
                for s_key in existing_keys:
                    if s_key[0] == title and s_key[1] == date:
                        if s_key[3] in location or location in s_key[3]:
                            fallback_key = s_key
                            break

                if fallback_key:
                    s_ev = sheet_events_by_key[fallback_key]

        if not s_ev:
            missing_events.append(event)
            continue

        needs_update = False
        s_id_in_sheet = ""
        for candidate in ["id", "event_id", "event id"]:
            if candidate in s_ev:
                s_id_in_sheet = str(s_ev[candidate]).strip()
                break
            s_ev_lower = {k.lower().strip(): v for k, v in s_ev.items()}
            if candidate in s_ev_lower:
                s_id_in_sheet = str(s_ev_lower[candidate]).strip()
                break
        if s_id_in_sheet.endswith(".0"):
            s_id_in_sheet = s_id_in_sheet[:-2]

        if s_id_in_sheet != e_id:
            needs_update = True
        else:
            payload = create_full_payload(event)
            for p_key, p_val in payload.items():
                if p_key == "id":
                    continue
                s_val = str(s_ev.get(p_key, "")).strip()

                # Check for alternative sheet headers for some keys
                if not s_val:
                    if p_key == "event_name":
                        s_val = str(s_ev.get("title", "")).strip()
                    elif p_key == "start_date":
                        s_val = str(s_ev.get("date", "")).strip()
                    elif p_key == "start_time":
                        s_val = str(s_ev.get("time", "")).strip()
                    elif p_key == "event_url":
                        s_val = str(s_ev.get("url", "")).strip()

                if p_key in (
                    "in_person",
                    "virtual",
                    "featured",
                    "paid_or_free",
                ):
                    s_val = s_val.lower()
                    p_str = str(p_val).lower()
                    if s_val != p_str:
                        if s_val in ("yes", "1", "true") and p_str in (
                            "yes",
                            "1",
                            "true",
                        ):
                            continue
                        if s_val in ("no", "0", "false", "") and p_str in (
                            "no",
                            "0",
                            "false",
                            "",
                        ):
                            continue
                        needs_update = True
                        break
                elif p_key in ("start_date", "end_date"):
                    if (
                        s_val
                        and p_val
                        and parse_date_time(s_val)[0]
                        != parse_date_time(str(p_val))[0]
                    ):
                        needs_update = True
                        break
                else:
                    if s_val != str(p_val).strip():
                        needs_update = True
                        break

        if needs_update:
            events_needing_update.append(event)

    if not missing_events and not deleted_events and not events_needing_update:
        print(
            "All events are already in sync with the Google Sheet. No action needed."
        )
        sys.exit(0)

    # Process deletions first
    if deleted_events:
        print(
            f"Found {len(deleted_events)} event(s) deleted from YAML. Syncing deletions to Google Sheet..."
        )
        for d_id, d_title, d_date, d_location in deleted_events:
            print(f"Deleting event from sheet: '{d_title}' ({d_date})...")
            delete_sheet_event(
                webapp_url, secret_token, d_id, d_title, d_date, d_location
            )

    # Process updates
    if events_needing_update:
        print(
            f"Found {len(events_needing_update)} event(s) that need updating in the sheet. Syncing updates..."
        )
        for event in events_needing_update:
            print(f"Updating event in sheet: '{event.get('title')}'...")
            update_sheet_event(webapp_url, secret_token, event)

    if missing_events:
        print(
            f"Found {len(missing_events)} new event(s) to sync to Google Sheet."
        )

    parsed_post_url = urllib.parse.urlparse(webapp_url)
    post_query_params = urllib.parse.parse_qs(parsed_post_url.query)
    post_query_params["token"] = [secret_token]
    new_post_query = urllib.parse.urlencode(post_query_params, doseq=True)
    post_url = urllib.parse.urlunparse(
        (
            parsed_post_url.scheme,
            parsed_post_url.netloc,
            parsed_post_url.path,
            parsed_post_url.params,
            new_post_query,
            parsed_post_url.fragment,
        )
    )

    success_count = 0
    for event in missing_events:
        payload = create_full_payload(event)

        print(
            f"Syncing event: '{payload['event_name']}' ({payload['start_date']})..."
        )

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            post_url,
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
                        f"Error syncing event '{payload['event_name']}': {res_body['error']}",
                        file=sys.stderr,
                    )
                else:
                    print(f"Successfully synced: '{payload['event_name']}'")
                    success_count += 1
        except Exception as e:
            print(
                f"Failed to sync event '{payload['event_name']}': {e}",
                file=sys.stderr,
            )

    print(
        f"Sync completed. Successfully synced {success_count}/{len(missing_events)} events."
    )
    if success_count < len(missing_events):
        sys.exit(1)


if __name__ == "__main__":
    main()
