#!/usr/bin/env python3
"""
title: Sync events from Google Sheet to repository.
summary: |-
  Fetches all events from the Google Sheet, compares them to events.yaml,
  detects edits and additions, geocodes coordinates, and updates events.yaml.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
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

FIELD_MAPPING = {
    "id": ["id", "event_id", "event id"],
    "title": ["event_name", "title", "event name"],
    "end_date": ["end_date", "end date"],
    "category": ["event_type", "category", "event type"],
    "description": [
        "event_description (200 char)",
        "event_description",
        "description",
        "event description",
    ],
    "organization_name": [
        "organization_name",
        "organization name",
        "hosting organization name",
    ],
    "acronym": ["acronym", "organization acronym"],
    "organization_url": [
        "organization_url",
        "organization url",
        "official organization website url",
    ],
    "url_linkedin": ["url_linkedin", "linkedin profile url"],
    "url_twitter": ["url_twitter", "twitter/x profile url", "twitter url"],
    "url_other": [
        "url_other",
        "other social media/contact url",
        "other social url",
    ],
    "paid_or_free": [
        "paid_or_free",
        "paid or free",
        "is the event paid or free?",
    ],
    "url": [
        "event_url",
        "url",
        "official event registration/information url",
    ],
    "image_url": ["image_url", "event image/logo url", "image url"],
    "location": ["location", "physical location", "address"],
    "city": ["city"],
    "state-province": [
        "state-province",
        "state/province",
        "state",
        "province",
    ],
    "country": ["country"],
    "region": ["region", "geographic region", "continent"],
    "language": ["language", "primary language"],
    "date": ["start_date", "date", "start date", "start date and time"],
    "time": ["start_time", "start time", "time"],
    "end_time": ["end_time", "end time"],
    "virtual": ["virtual", "online"],
    "in_person": ["in_person", "in person", "in-person"],
}


def run_git_cmd(args: list[str]) -> str:
    """
    title: Run a git command and return its stdout.
    parameters:
      args:
        type: list[str]
    returns:
      type: str
    """
    try:
        res = subprocess.run(
            args,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Git command failed: {' '.join(args)}", file=sys.stderr)
        print(f"Exit code: {e.returncode}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        raise e


def update_pull_request(
    repo: str,
    token: str,
    pr_num: int,
    title: str,
    body: str,
) -> None:
    """
    title: Update a Pull Request's title and body via GitHub REST API.
    parameters:
      repo:
        type: str
      token:
        type: str
      pr_num:
        type: int
      title:
        type: str
      body:
        type: str
    """
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_num}"
    data = {
        "title": title,
        "body": body,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "GitHubActions-Sync",
        },
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            print(
                f"Successfully updated pull request #{pr_num}: {res.get('html_url')}"
            )
    except Exception as e:
        print(f"Error updating pull request #{pr_num}: {e}", file=sys.stderr)


def create_pull_request(
    repo: str,
    token: str,
    branch: str,
    base: str,
    title: str,
    body: str,
) -> None:
    """
    title: Create a Pull Request via GitHub REST API.
    parameters:
      repo:
        type: str
      token:
        type: str
      branch:
        type: str
      base:
        type: str
      title:
        type: str
      body:
        type: str
    """
    url = f"https://api.github.com/repos/{repo}/pulls"
    data = {
        "title": title,
        "head": branch,
        "base": base,
        "body": body,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "GitHubActions-Sync",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            print(f"Successfully created pull request: {res.get('html_url')}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 422 and "already exists" in err_body:
            print(
                f"Pull request already exists for branch {branch}. "
                "Attempting to update the PR title and description..."
            )
            try:
                owner = repo.split("/")[0]
                query_url = f"https://api.github.com/repos/{repo}/pulls?head={owner}:{branch}&state=open"
                query_req = urllib.request.Request(
                    query_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github+json",
                        "User-Agent": "GitHubActions-Sync",
                    },
                    method="GET",
                )
                with urllib.request.urlopen(query_req) as query_response:
                    prs = json.loads(query_response.read().decode("utf-8"))
                    if prs and len(prs) > 0:
                        pr_num = prs[0]["number"]
                        update_pull_request(
                            repo=repo,
                            token=token,
                            pr_num=pr_num,
                            title=title,
                            body=body,
                        )
                        return
            except Exception as ex:
                print(
                    f"Failed to update existing pull request: {ex}",
                    file=sys.stderr,
                )
            return
        print(
            f"Error creating pull request: {e.code} - {e.reason}",
            file=sys.stderr,
        )
        print(err_body, file=sys.stderr)
        raise e


def close_pull_request(repo: str, token: str, pr_num: int) -> None:
    """
    title: Close a Pull Request via GitHub REST API.
    parameters:
      repo:
        type: str
      token:
        type: str
      pr_num:
        type: int
    """
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_num}"
    data = {"state": "closed"}
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "GitHubActions-Sync",
        },
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            print(
                f"Successfully closed pull request #{pr_num}: {res.get('html_url')}"
            )
    except Exception as e:
        print(f"Error closing pull request #{pr_num}: {e}", file=sys.stderr)


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


def get_field_value(s_ev: dict[str, Any], key: str) -> str:
    """
    title: Retrieve event field value from spreadsheet event object.
    parameters:
      s_ev:
        type: dict[str, Any]
      key:
        type: str
    returns:
      type: str
    """
    candidates = FIELD_MAPPING.get(key, [key])
    s_ev_normalized = {k.strip().lower(): v for k, v in s_ev.items()}

    for candidate in candidates:
        cand_norm = candidate.strip().lower()
        if cand_norm in s_ev_normalized:
            return str(s_ev_normalized[cand_norm]).strip()
    return ""


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
    return [t.strip() for t in str(val).replace(",", " ").split() if t.strip()]


def parse_date_time(dt_str: str) -> tuple[str, str]:
    """
    title: Parse date and time from various formats.
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
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(dt_str, fmt)
            time_val = dt.strftime("%H:%M") if "H" in fmt or "M" in fmt else ""
            return dt.strftime("%Y-%m-%d"), time_val
        except ValueError:
            continue

    # Fallback regex parsing
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


def normalize_time(t_str: str) -> str:
    """
    title: Normalize a time string to HH:MM format.
    parameters:
      t_str:
        type: str
    returns:
      type: str
    """
    t_str = t_str.strip()
    if not t_str:
        return ""

    # Extract time component if input starts with a date (e.g. "1899-12-31 05:21:10")
    if " " in t_str:
        parts = t_str.split()
        if "-" in parts[0] or "/" in parts[0]:
            t_str = " ".join(parts[1:])

    match = re.match(r"^(\d{1,2}):(\d{2})(?::\d{2})?$", t_str)
    if match:
        return f"{int(match.group(1)):02d}:{int(match.group(2)):02d}"

    for fmt in ["%I:%M %p", "%I:%M%p", "%H:%M:%S", "%H:%M"]:
        try:
            dt = datetime.strptime(t_str, fmt)
            return dt.strftime("%H:%M")
        except ValueError:
            continue
    return t_str


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


def split_yaml_into_blocks(file_path: Path) -> tuple[str, dict[str, str]]:
    """
    title: Split events.yaml into header and individual event blocks.
    parameters:
      file_path:
        type: Path
    returns:
      type: tuple[str, dict[str, str]]
    """
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines(keepends=True)
    header_lines = []
    blocks = {}

    current_id = None
    current_block_lines = []

    for line in lines:
        stripped = line.strip()
        match = re.match(r"^\s*-\s+id:\s*['\"]?(\d+)['\"]?$", stripped)
        if match:
            if current_id is not None:
                blocks[current_id] = "".join(current_block_lines)
            current_id = match.group(1)
            current_block_lines = [line]
        else:
            if current_id is None:
                header_lines.append(line)
            else:
                current_block_lines.append(line)

    if current_id is not None:
        blocks[current_id] = "".join(current_block_lines)

    header = "".join(header_lines)
    return header, blocks


def format_event_as_yaml(ev: dict[str, Any]) -> str:
    """
    title: Format an event dictionary to standard YAML layout.
    parameters:
      ev:
        type: dict[str, Any]
    returns:
      type: str
    """
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
        "end_time",
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

    lines = []
    lines.append(f'  - id: "{ev.get("id")}"')

    for k in key_order[1:]:
        val = ev.get(k)
        if val == "" or val is None or val == [] or val is False:
            if k not in [
                "title",
                "description",
                "date",
                "time",
                "location",
                "region",
                "category",
            ]:
                continue

        if k == "tags" and isinstance(val, list):
            lines.append("    tags:")
            for tag in val:
                lines.append(f"      - {tag}")
        elif isinstance(val, bool):
            lines.append(f"    {k}: {str(val).lower()}")
        elif isinstance(val, (int, float)):
            lines.append(f"    {k}: {val}")
        else:
            val_str = str(val).replace('"', '\\"')
            lines.append(f'    {k}: "{val_str}"')

    return "\n".join(lines) + "\n"


def main() -> None:
    """
    title: >-
      Retrieve sheet events, detect additions/edits, and write events.yaml.
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
    get_sheet_events_url = urllib.parse.urlunparse(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            parsed_url.params,
            new_query,
            parsed_url.fragment,
        )
    )

    print("Fetching all events from Google Sheet...")
    req = urllib.request.Request(
        get_sheet_events_url, headers={"User-Agent": "GitHubActions-Sync"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            sheet_events = json.loads(response.read().decode())
            if isinstance(sheet_events, dict) and "error" in sheet_events:
                print(
                    f"Error from Google Sheet Web App: {sheet_events['error']}",
                    file=sys.stderr,
                )
                sys.exit(1)
    except Exception as e:
        print(
            f"Error calling Web App to fetch sheet events: {e}",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"Successfully loaded {len(sheet_events)} events from Google Sheet.")

    try:
        debug_file = PROJECT_ROOT / "data" / "debug_sheet_events.json"
        with open(debug_file, "w", encoding="utf-8") as f:
            json.dump(sheet_events, f, indent=2)
        print("Wrote debug sheet events to data/debug_sheet_events.json")
    except Exception as e:
        print(f"Warning: Failed to write debug sheet events: {e}")

    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found.", file=sys.stderr)
        sys.exit(1)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        current_data = yaml.safe_load(f) or {"events": []}

    yaml_events = current_data.get("events", [])
    print(f"Loaded {len(yaml_events)} existing events from events.yaml.")

    # Guard against empty sheet fetch to prevent wiping database
    if not sheet_events:
        print(
            "Warning: Google Sheet returned 0 events. Aborting to prevent wiping the database."
        )
        sys.exit(0)

    # Index yaml events by (title.lower, date, end_date, location.lower) for lookup
    yaml_index = {}
    yaml_by_id = {}
    for ev in yaml_events:
        t = str(ev.get("title", "")).strip().lower()
        d = str(ev.get("date", "")).strip()
        ed = str(ev.get("end_date", "")).strip()
        loc = str(ev.get("location", "")).strip().lower()
        yaml_index[(t, d, ed, loc)] = ev
        eid = str(ev.get("id", "")).strip()
        if eid:
            yaml_by_id[eid] = ev

    # We will build a list of updated events, keeping the order of IDs
    updated_yaml_events: list[dict[str, Any]] = []
    detected_changes: list[dict[str, Any]] = []

    github_token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")

    # Fetch open PRs to calculate max_id and map pending additions
    open_sync_prs = {}
    if github_token and repo:
        print("Fetching open sync pull requests from GitHub...")
        open_sync_prs = get_open_sync_prs(repo, github_token)

    # Index open PRs by ID
    open_prs_by_id = {}
    for pr_key, pr_info in open_sync_prs.items():
        pr_id = pr_info.get("id")
        if pr_id:
            open_prs_by_id[str(pr_id).strip()] = pr_info

    # Track existing IDs to calculate next ID
    max_id = 0
    for ev in yaml_events:
        try:
            int_eid = int(ev.get("id", 0))
            if int_eid > max_id:
                max_id = int_eid
        except ValueError:
            pass

    # Also factor in IDs of open sync PRs to avoid ID reuse
    for pr_info in open_sync_prs.values():
        try:
            int_eid = int(pr_info["id"])
            if int_eid > max_id:
                max_id = int_eid
        except ValueError:
            pass

    processed_yaml_ids = set()

    # Process events from Sheet
    for s_ev in sheet_events:
        s_title = get_field_value(s_ev, "title")
        s_date_raw = get_field_value(s_ev, "date")
        if not s_title or not s_date_raw:
            continue

        s_date, s_time = parse_date_time(s_date_raw)

        # End date
        end_date_raw = get_field_value(s_ev, "end_date")
        s_end_date = ""
        if end_date_raw:
            s_end_date, _ = parse_date_time(end_date_raw)

        # Normalization of virtual/location
        virtual_val = clean_boolean(get_field_value(s_ev, "virtual"))
        s_location = get_field_value(s_ev, "location")

        key = (s_title.lower(), s_date, s_end_date, s_location.lower())

        # Build normalized representation
        mapped_event: dict[str, Any] = {}
        for target_key in FIELD_MAPPING.keys():
            mapped_event[target_key] = get_field_value(s_ev, target_key)

        mapped_event["title"] = s_title
        mapped_event["date"] = s_date
        mapped_event["end_date"] = s_end_date
        mapped_event["location"] = s_location

        # Look up existing event in YAML
        s_id = get_field_value(s_ev, "id").strip()
        if s_id.endswith(".0"):
            s_id = s_id[:-2]
        existing_ev = None
        if s_id and s_id in yaml_by_id:
            existing_ev = yaml_by_id[s_id]
        else:
            if key in yaml_index:
                existing_ev = yaml_index[key]

        # Time and end_time preservation
        sheet_time = get_field_value(s_ev, "time").strip()
        sheet_end_time = get_field_value(s_ev, "end_time").strip()
        norm_sheet_time = normalize_time(sheet_time) if sheet_time else ""
        norm_sheet_end_time = (
            normalize_time(sheet_end_time) if sheet_end_time else ""
        )

        has_explicit_time_in_date = bool(
            re.search(r"\d{1,2}:\d{2}", s_date_raw)
        )

        if norm_sheet_time:
            final_time = norm_sheet_time
        elif has_explicit_time_in_date:
            final_time = s_time
        elif existing_ev and existing_ev.get("time"):
            final_time = existing_ev.get("time")
        else:
            final_time = ""

        if norm_sheet_end_time:
            final_end_time = norm_sheet_end_time
        elif existing_ev and existing_ev.get("end_time"):
            final_end_time = existing_ev.get("end_time")
        else:
            final_end_time = ""

        mapped_event["time"] = final_time
        mapped_event["end_time"] = final_end_time

        # Normalize tags
        mapped_event["tags"] = clean_tags(get_field_value(s_ev, "tags"))

        # Normalize booleans
        mapped_event["featured"] = clean_boolean(
            get_field_value(s_ev, "featured")
        )
        mapped_event["in_person"] = clean_boolean(
            get_field_value(s_ev, "in_person")
        )
        mapped_event["virtual"] = virtual_val

        # Standardize paid_or_free
        paid_or_free_val = get_field_value(s_ev, "paid_or_free").lower()
        if "free" in paid_or_free_val:
            mapped_event["paid_or_free"] = "free"
        elif "paid" in paid_or_free_val:
            mapped_event["paid_or_free"] = "paid"
        else:
            mapped_event["paid_or_free"] = ""

        # Look up in index
        if existing_ev:
            processed_yaml_ids.add(str(existing_ev.get("id")))

            # Check if any field changed
            ev_changed = False
            for k, val in mapped_event.items():
                existing_val = existing_ev.get(k)
                if k in ("in_person", "virtual", "featured"):
                    # Normalize truthiness check for boolean fields (None/False/0/"" are all equivalent)
                    if bool(existing_val) != bool(val):
                        ev_changed = True
                        break
                else:
                    if existing_val != val:
                        # Treat None as equivalent to empty string or empty list
                        if existing_val is None and (val == "" or val == []):
                            continue
                        ev_changed = True
                        break

            if ev_changed:
                print(f"Edit detected for event: '{s_title}' on {s_date}")
                mapped_event["id"] = existing_ev.get("id")
                # If location hasn't changed, coordinates can be preserved
                if existing_ev.get("location") == mapped_event["location"]:
                    mapped_event["lat"] = existing_ev.get("lat", "")
                    mapped_event["lng"] = existing_ev.get("lng", "")
                else:
                    coords = geocode_location(str(mapped_event["location"]))
                    mapped_event["lat"] = coords[0] if coords else ""
                    mapped_event["lng"] = coords[1] if coords else ""

                updated_yaml_events.append(mapped_event)
                detected_changes.append(
                    {
                        "type": "edit",
                        "id": str(existing_ev.get("id")),
                        "title": s_title,
                        "date": s_date,
                        "location": s_location,
                        "event_data": mapped_event,
                    }
                )
            else:
                # Keep existing unmodified event
                updated_yaml_events.append(existing_ev)
        else:
            # Addition detected
            # Check if there is an open PR for this new event
            matched_pr = None
            if s_id and s_id in open_prs_by_id:
                matched_pr = open_prs_by_id[s_id]
            else:
                pr_key = (
                    s_title.lower().strip(),
                    s_date.strip(),
                    s_location.lower().strip(),
                )
                if pr_key in open_sync_prs:
                    matched_pr = open_sync_prs[pr_key]
                else:
                    # Fallback: match by date + location only.
                    # This handles the case where the event was renamed in the
                    # sheet (title changed) but the PR was opened with the old
                    # title. If exactly one open PR shares the same date and
                    # location, treat it as the same event.
                    date_loc_matches = [
                        pr_info
                        for (pt, pd, pl), pr_info in open_sync_prs.items()
                        if pd == s_date.strip()
                        and pl == s_location.lower().strip()
                    ]
                    if len(date_loc_matches) == 1:
                        matched_pr = date_loc_matches[0]
                        print(
                            f"  Matched open PR #{matched_pr['number']} to "
                            f"renamed event '{s_title}' via date+location "
                            f"(old title: '{matched_pr['title']}')"
                        )

            if matched_pr:
                event_id = matched_pr["id"]
                branch_name = matched_pr["branch"]
                mapped_event["id"] = event_id

                # Fetch the branch from origin to compare details
                is_changed = True
                existing_pr_ev = None
                try:
                    run_git_cmd(["git", "fetch", "origin", branch_name])
                    branch_yaml = run_git_cmd(
                        [
                            "git",
                            "show",
                            f"origin/{branch_name}:data/events.yaml",
                        ]
                    )
                    branch_data = yaml.safe_load(branch_yaml) or {"events": []}
                    branch_events = branch_data.get("events", [])
                    existing_pr_ev = next(
                        (
                            x
                            for x in branch_events
                            if str(x.get("id")) == str(event_id)
                        ),
                        None,
                    )
                    if not existing_pr_ev:
                        # Fallback key matching on branch
                        existing_pr_ev = next(
                            (
                                x
                                for x in branch_events
                                if str(x.get("title", "")).strip().lower()
                                == s_title.lower()
                                and str(x.get("date", "")).strip() == s_date
                                and str(x.get("location", "")).strip().lower()
                                == s_location.lower()
                            ),
                            None,
                        )

                    if existing_pr_ev:
                        # If time was empty/fallback in sheet, preserve from branch
                        if (
                            not norm_sheet_time
                            and not has_explicit_time_in_date
                            and existing_pr_ev.get("time")
                        ):
                            mapped_event["time"] = existing_pr_ev.get("time")
                        if not norm_sheet_end_time and existing_pr_ev.get(
                            "end_time"
                        ):
                            mapped_event["end_time"] = existing_pr_ev.get(
                                "end_time"
                            )

                        # Compare fields
                        is_changed = False
                        for k, val in mapped_event.items():
                            existing_val = existing_pr_ev.get(k)
                            if k in ("in_person", "virtual", "featured"):
                                if bool(existing_val) != bool(val):
                                    is_changed = True
                                    break
                            else:
                                if existing_val != val:
                                    if existing_val is None and (
                                        val == "" or val == []
                                    ):
                                        continue
                                    is_changed = True
                                    break
                except Exception as ex:
                    print(
                        f"Warning: Could not fetch branch {branch_name} for comparison: {ex}"
                    )

                if is_changed:
                    print(
                        f"Edit detected for pending addition: '{s_title}' on {s_date}"
                    )
                    if (
                        existing_pr_ev
                        and existing_pr_ev.get("location")
                        == mapped_event["location"]
                    ):
                        mapped_event["lat"] = existing_pr_ev.get("lat", "")
                        mapped_event["lng"] = existing_pr_ev.get("lng", "")
                    else:
                        coords = geocode_location(
                            str(mapped_event["location"])
                        )
                        mapped_event["lat"] = coords[0] if coords else ""
                        mapped_event["lng"] = coords[1] if coords else ""

                    updated_yaml_events.append(mapped_event)
                    detected_changes.append(
                        {
                            "type": "add",
                            "id": event_id,
                            "title": s_title,
                            "date": s_date,
                            "location": s_location,
                            "event_data": mapped_event,
                            # Reuse the existing PR branch so we don't open a new PR
                            "existing_branch": branch_name,
                            "existing_pr_num": matched_pr["number"],
                        }
                    )
                else:
                    print(
                        f"Pending addition '{s_title}' is unchanged on branch '{branch_name}'."
                    )
                    if existing_pr_ev:
                        updated_yaml_events.append(existing_pr_ev)
            else:
                # Brand new event
                print(f"New event detected: '{s_title}' on {s_date}")
                max_id += 1
                mapped_event["id"] = str(max_id)

                coords = geocode_location(str(mapped_event["location"]))
                mapped_event["lat"] = coords[0] if coords else ""
                mapped_event["lng"] = coords[1] if coords else ""

                updated_yaml_events.append(mapped_event)
                detected_changes.append(
                    {
                        "type": "add",
                        "id": str(max_id),
                        "title": s_title,
                        "date": s_date,
                        "location": s_location,
                        "event_data": mapped_event,
                    }
                )

    # Detect deletions from the sheet
    for ev in yaml_events:
        event_id = str(ev.get("id", ""))
        if event_id not in processed_yaml_ids:
            title = ev.get("title", "")
            date = ev.get("date", "")
            location = ev.get("location", "")
            print(
                f"Event deleted from Google Sheet: '{title}' on {date} (ID: {event_id})"
            )
            detected_changes.append(
                {
                    "type": "delete",
                    "id": event_id,
                    "title": title,
                    "date": date,
                    "location": location,
                    "event_data": None,
                }
            )

    # Auto-close open PRs for pending additions that were deleted from the sheet
    if github_token and repo:
        sheet_keys = set()
        for s_ev in sheet_events:
            s_title = get_field_value(s_ev, "title")
            s_date_raw = get_field_value(s_ev, "date")
            if not s_title or not s_date_raw:
                continue
            s_date, _ = parse_date_time(s_date_raw)
            s_location = get_field_value(s_ev, "location")
            sheet_keys.add(
                (
                    s_title.lower().strip(),
                    s_date.strip(),
                    s_location.lower().strip(),
                )
            )

        # Build a set of event IDs that are still alive in updated_yaml_events.
        # This covers renamed events: their ID persists in updated_yaml_events
        # even though their (title, date, location) key changed.
        live_yaml_ids = {
            str(ev.get("id", "")).strip() for ev in updated_yaml_events
        }

        for pr_key, pr_info in open_sync_prs.items():
            pr_id = str(pr_info.get("id", "")).strip()
            branch_name = pr_info["branch"]
            is_deletion_pr = branch_name.startswith("sync/delete-")

            # If the PR's event ID is still alive in the sheet-derived YAML,
            # the event still exists (possibly renamed).
            event_in_yaml = bool(pr_id and pr_id in live_yaml_ids)

            should_close = False
            if is_deletion_pr:
                # A deletion PR should be closed if the user re-adds the event to the sheet
                if pr_key in sheet_keys or event_in_yaml:
                    should_close = True
            else:
                # An addition/edit PR should be closed if the user deletes the event from the sheet
                if pr_key not in sheet_keys and not event_in_yaml:
                    should_close = True

            if should_close:
                pr_num = pr_info["number"]
                print(
                    f"Closing pull request #{pr_num} for event '{pr_info['title']}' on branch '{branch_name}'..."
                )
                close_pull_request(repo, github_token, pr_num)
                try:
                    run_git_cmd(
                        ["git", "push", "origin", "--delete", branch_name]
                    )
                    print(
                        f"Deleted remote branch '{branch_name}' for closed PR."
                    )
                except Exception as ex:
                    print(
                        f"Warning: Could not delete remote branch '{branch_name}': {ex}"
                    )

    github_token = os.environ.get("GITHUB_TOKEN")

    if not detected_changes:
        print(
            "No additions or edits detected. Workspace is in sync with Google Sheet."
        )
        sys.exit(0)

    if not github_token:
        # LOCAL FALLBACK: Apply all changes at once
        print(
            "GITHUB_TOKEN not present in environment. "
            "Applying all changes locally to events.yaml at once..."
        )

        # Sort events by ID (as integers) to keep order consistent
        try:
            updated_yaml_events.sort(key=lambda x: int(x.get("id", 0)))
        except Exception:
            pass

        # Load original blocks to preserve formatting and quotes for unmodified events
        header, blocks = split_yaml_into_blocks(INPUT_FILE)

        yaml_blocks = []
        for ev in updated_yaml_events:
            event_id = str(ev.get("id", ""))

            # Check if this event was modified compared to the original parsed events
            original_ev = next(
                (x for x in yaml_events if str(x.get("id")) == event_id), None
            )

            is_modified = True
            if original_ev is not None:
                is_modified = False
                for k in set(list(ev.keys()) + list(original_ev.keys())):
                    if ev.get(k) != original_ev.get(k):
                        is_modified = True
                        break

            if not is_modified and event_id in blocks:
                yaml_blocks.append(blocks[event_id])
            else:
                yaml_blocks.append(format_event_as_yaml(ev) + "\n")

        with open(INPUT_FILE, "w", encoding="utf-8") as f:
            final_header = header
            if final_header and not final_header.endswith("\n"):
                final_header += "\n"
            f.write(final_header + "".join(yaml_blocks))

        print("Successfully updated events.yaml")

        # Re-generate src/data/events.json
        print("Re-generating events.json...")
        try:
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
            print(
                f"Error running generate_events_json.py: {e}", file=sys.stderr
            )
            print(e.stderr, file=sys.stderr)
            sys.exit(1)

    else:
        # CI Workflow: Process each change in a separate branch/PR
        print(
            f"GITHUB_TOKEN detected. Processing {len(detected_changes)} "
            "changes individually..."
        )

        repo = os.environ.get("GITHUB_REPOSITORY")
        if not repo:
            print(
                "Error: GITHUB_REPOSITORY environment variable is required in CI.",
                file=sys.stderr,
            )
            sys.exit(1)

        base_branch = os.environ.get("GITHUB_REF_NAME") or "main"

        # Configure local git user
        run_git_cmd(["git", "config", "user.name", "github-actions[bot]"])
        run_git_cmd(
            [
                "git",
                "config",
                "user.email",
                "github-actions[bot]@users.noreply.github.com",
            ]
        )

        for change in detected_changes:
            change_type = change["type"]
            event_id = change["id"]
            title = change["title"]
            date = change["date"]
            location = change["location"]
            event_data = change["event_data"]
            # If this edit targets an existing pending PR, reuse its branch
            existing_branch = change.get("existing_branch")
            existing_pr_num = change.get("existing_pr_num")

            if existing_branch:
                branch_name = existing_branch
                print(
                    f"Updating existing branch '{branch_name}' for event '{title}' "
                    f"(ID: {event_id})..."
                )
            else:
                branch_name = (
                    f"sync/{change_type}-{event_id}-{int(time.time())}"
                )
                print(
                    f"Processing {change_type} change for event '{title}' "
                    f"(ID: {event_id}) on branch '{branch_name}'..."
                )

            # 1. Reset to clean base branch
            run_git_cmd(["git", "checkout", base_branch])
            run_git_cmd(["git", "reset", "--hard", f"origin/{base_branch}"])
            run_git_cmd(["git", "clean", "-fd"])

            # 2. Check out branch (new or existing)
            run_git_cmd(["git", "checkout", "-B", branch_name])

            # 3. Apply ONLY this change to events.yaml
            with open(INPUT_FILE, "r", encoding="utf-8") as f:
                temp_yaml_data = yaml.safe_load(f) or {"events": []}
            temp_yaml_events = temp_yaml_data.get("events", [])

            if change_type == "add":
                temp_yaml_events.append(event_data)
            elif change_type == "delete":
                temp_yaml_events = [
                    ev
                    for ev in temp_yaml_events
                    if str(ev.get("id")) != str(event_id)
                ]
            else:  # edit
                for i, ev in enumerate(temp_yaml_events):
                    if str(ev.get("id")) == str(event_id):
                        temp_yaml_events[i] = event_data
                        break

            # Sort events by ID (as integers) to keep order consistent
            try:
                temp_yaml_events.sort(key=lambda x: int(x.get("id", 0)))
            except Exception:
                pass

            # Split clean INPUT_FILE into blocks
            header, blocks = split_yaml_into_blocks(INPUT_FILE)

            yaml_blocks = []
            for ev in temp_yaml_events:
                ev_id = str(ev.get("id", ""))
                if ev_id == str(event_id):
                    yaml_blocks.append(format_event_as_yaml(ev) + "\n")
                elif ev_id in blocks:
                    yaml_blocks.append(blocks[ev_id])
                else:
                    yaml_blocks.append(format_event_as_yaml(ev) + "\n")

            with open(INPUT_FILE, "w", encoding="utf-8") as f:
                final_header = header
                if final_header and not final_header.endswith("\n"):
                    final_header += "\n"
                f.write(final_header + "".join(yaml_blocks))

            # 4. Re-generate src/data/events.json
            print("  Re-generating events.json...")
            try:
                subprocess.run(
                    [
                        sys.executable,
                        str(
                            PROJECT_ROOT
                            / "scripts"
                            / "generate_events_json.py"
                        ),
                    ],
                    capture_output=True,
                    text=True,
                    check=True,
                )
            except subprocess.CalledProcessError as e:
                print(
                    f"  Error running generate_events_json.py: {e}",
                    file=sys.stderr,
                )
                print(e.stderr, file=sys.stderr)
                continue

            # 5. Commit and push
            debug_file_path = PROJECT_ROOT / "data" / "debug_sheet_events.json"

            print("  Running pre-commit formatting...")
            subprocess.run(
                [
                    "pre-commit",
                    "run",
                    "--files",
                    "data/events.yaml",
                    "src/data/events.json",
                ],
                cwd=str(PROJECT_ROOT),
                capture_output=True,
                check=False,
            )

            if debug_file_path.exists():
                run_git_cmd(
                    [
                        "git",
                        "add",
                        "data/events.yaml",
                        "src/data/events.json",
                        "data/debug_sheet_events.json",
                    ]
                )
            else:
                run_git_cmd(
                    ["git", "add", "data/events.yaml", "src/data/events.json"]
                )
            change_desc = (
                "addition of"
                if change_type == "add"
                else ("deletion of" if change_type == "delete" else "edits to")
            )
            commit_msg = f"feat: sync {change_desc} event '{title}'"
            run_git_cmd(["git", "commit", "-m", commit_msg])

            print(f"  Pushing branch '{branch_name}' to origin...")
            run_git_cmd(["git", "push", "origin", branch_name, "--force"])

            # 6. Raise or update PR via REST API
            print("  Creating/updating pull request...")
            pr_title = f"feat: sync {change_desc} event '{title}'"
            pr_body = (
                f"This PR was automatically raised to sync the {change_desc} event '{title}' "
                f"from Google Sheet back to the repository's events database.\n\n"
                f"### Event Details\n"
                f"- **Event ID**: `{event_id}`\n"
                f"- **Title**: `{title}`\n"
                f"- **Start Date**: `{date}`\n"
                f"- **Location**: `{location}`\n\n"
                f"*This pull request was automatically generated by GitHub Actions.*"
            )

            try:
                if existing_pr_num:
                    # Reuse existing PR — just update its title and body
                    update_pull_request(
                        repo=repo,
                        token=github_token,
                        pr_num=existing_pr_num,
                        title=pr_title,
                        body=pr_body,
                    )
                else:
                    create_pull_request(
                        repo=repo,
                        token=github_token,
                        branch=branch_name,
                        base=base_branch,
                        title=pr_title,
                        body=pr_body,
                    )
            except Exception as e:
                print(
                    f"  Error creating/updating pull request for event '{title}': {e}",
                    file=sys.stderr,
                )
                continue

        # Clean up: reset workspace back to base branch
        run_git_cmd(["git", "checkout", base_branch])
        print("Successfully processed all event updates.")


if __name__ == "__main__":
    main()
