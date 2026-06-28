import os
import json
import pytest
import subprocess
from unittest.mock import patch, mock_open, MagicMock
from scripts.add_event import (
    parse_issue_body,
    geocode_location_forced,
    format_event_yaml,
    main,
)

SAMPLE_ISSUE_BODY = """
### Event Name
Test Event

### Start Date
2026-10-10

### Event Description (200 char max)
_No response_
"""

def test_parse_issue_body():
    parsed = parse_issue_body(SAMPLE_ISSUE_BODY)
    assert parsed.get("Event Name") == "Test Event"
    assert parsed.get("Start Date") == "2026-10-10"
    assert parsed.get("Event Description (200 char max)") == ""

def test_geocode_location_forced_online():
    cache = {}
    assert geocode_location_forced("Online", cache) is None
    assert geocode_location_forced("", cache) is None

def test_geocode_location_forced_cached():
    cache = {"New York": [40.7, -74.0]}
    assert geocode_location_forced("New York", cache) == (40.7, -74.0)

@patch("urllib.request.urlopen")
def test_geocode_location_forced_network_success(mock_urlopen):
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps([{"lat": "40.7", "lon": "-74.0"}]).encode()
    mock_urlopen.return_value.__enter__.return_value = mock_resp

    cache = {}
    coords = geocode_location_forced("New York", cache)

    assert coords == (40.7, -74.0)
    assert cache["New York"] == [40.7, -74.0]

@patch("urllib.request.urlopen")
def test_geocode_location_forced_network_exception(mock_urlopen):
    mock_urlopen.side_effect = Exception("Network Error")
    cache = {}
    coords = geocode_location_forced("New York", cache)
    assert coords is None

def test_format_event_yaml():
    event = {
        "id": "12345",
        "title": "Test Event",
        "lat": 40.7,
        "lng": -74.0,
        "tags": ["Python", "Data"],
        "paid_or_free": "Free",
        "time": "14:00"
    }
    yaml_str = format_event_yaml(event)
    assert '  - id: "12345"' in yaml_str
    assert '    lat: 40.7' in yaml_str
    assert '    lng: -74.0' in yaml_str
    assert '    title: "Test Event"' in yaml_str
    assert '    tags:\n      - Python\n      - Data' in yaml_str
    assert '    paid_or_free: "Free"' in yaml_str
    assert '    time: "14:00"' in yaml_str

@patch("scripts.add_event.sys.exit")
def test_main_missing_issue_body(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    monkeypatch.delenv("ISSUE_BODY", raising=False)
    with pytest.raises(SystemExit):
        main()
    mock_exit.assert_called_once_with(1)

@patch("scripts.add_event.sys.exit")
def test_main_validation_fails(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    monkeypatch.setenv("ISSUE_BODY", "### Event Name\nTest Event")

    with patch("builtins.open", mock_open()) as mock_file:
        with pytest.raises(SystemExit):
            main()
        mock_exit.assert_called_once_with(1)
        mock_file.assert_called_with("error_message.md", "w")

@patch("scripts.add_event.sys.exit")
@patch("scripts.add_event.geocode_location_forced")
def test_main_success(mock_geocode, mock_exit, monkeypatch):
    valid_body = """
### Event Name
Valid Event
### Start Date
2026-10-10
### Tags
Python, Open Source
### Event Description (200 char max)
A valid event
### Event URL
https://example.com
### Location
New York
### Region (Continent)
North America
### Language
English
### Featured
Yes
### Start Time
14:00
### End Time
16:00
    """
    monkeypatch.setenv("ISSUE_BODY", valid_body)
    monkeypatch.setenv("GITHUB_OUTPUT", "github_out.txt")

    mock_geocode.return_value = (40.7, -74.0)

    def mock_file_open(filename, mode="r", *args, **kwargs):
        if "events.yaml" in str(filename):
            if "a" in mode:
                return mock_open()()
            else:
                return mock_open(read_data="events: []\n")()
        elif ".geocode_cache.json" in str(filename):
            if "w" in mode:
                return mock_open()()
            else:
                raise FileNotFoundError()
        return mock_open()()

    with patch("builtins.open", mock_file_open):
        main()

    mock_exit.assert_not_called()

@patch("scripts.add_event.sys.exit")
def test_main_various_validations(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    invalid_body = """
### Event Name
Invalid Event
### Start Date
2026-13-40
### End Date
2025-10-10
### Start Time
2pm
### End Time
13:00
### Event URL
www.example.com
### Location
New York
### Region (Continent)
North America
### Language
English
### Featured
2
### Event Description (200 char max)
""" + ("A" * 201)
    monkeypatch.setenv("ISSUE_BODY", invalid_body)

    with patch("builtins.open", mock_open()):
        with pytest.raises(SystemExit):
            main()
        mock_exit.assert_called_once_with(1)

@patch("scripts.add_event.sys.exit")
def test_main_validation_date_comparisons(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    invalid_body = """
### Event Name
Invalid Event
### Start Date
2026-10-10
### End Date
2025-10-10
### Start Time
14:00
### End Time
13:00
### Event URL
https://www.example.com
### Location
New York
### Region (Continent)
North America
### Language
English
"""
    monkeypatch.setenv("ISSUE_BODY", invalid_body)
    with patch("builtins.open", mock_open()):
        with pytest.raises(SystemExit):
            main()

@patch("scripts.add_event.sys.exit")
def test_main_validation_url_exception(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    invalid_body = """
### Event Name
Invalid Event
### Start Date
2026-10-10
### Event URL
http://[::1]:8080/
### Location
New York
### Region (Continent)
North America
### Language
English
"""
    monkeypatch.setenv("ISSUE_BODY", invalid_body)

    with patch("builtins.open", mock_open()):
        with patch("urllib.parse.urlparse", side_effect=Exception("URL Error")):
            with pytest.raises(SystemExit):
                main()

@patch("scripts.add_event.sys.exit")
def test_main_validation_time_comparisons(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    invalid_body = """
### Event Name
Invalid Event
### Start Date
2026-10-10
### End Date
2026-10-10
### Start Time
14:00
### End Time
13:00
### Event URL
https://www.example.com
### Location
New York
### Region (Continent)
North America
### Language
English
"""
    monkeypatch.setenv("ISSUE_BODY", invalid_body)
    with patch("builtins.open", mock_open()):
        with pytest.raises(SystemExit):
            main()

@patch("scripts.add_event.sys.exit")
def test_main_validation_featured_value(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    invalid_body = """
### Event Name
Invalid Event
### Start Date
2026-10-10
### Event URL
https://example.com
### Location
New York
### Region (Continent)
North America
### Language
English
### Featured
2
"""
    monkeypatch.setenv("ISSUE_BODY", invalid_body)
    with patch("builtins.open", mock_open()):
        with pytest.raises(SystemExit):
            main()

@patch("scripts.add_event.sys.exit")
def test_main_missing_events_yaml(mock_exit, monkeypatch):
    mock_exit.side_effect = SystemExit
    valid_body = "### Event Name\nValid Event\n### Start Date\n2026-10-10\n### Event URL\nhttps://example.com\n### Location\nNew York\n### Region (Continent)\nNorth America\n### Language\nEnglish\n"
    monkeypatch.setenv("ISSUE_BODY", valid_body)

    with patch("pathlib.Path.exists", return_value=False):
        with pytest.raises(SystemExit):
            main()

@patch("scripts.add_event.sys.exit")
@patch("scripts.add_event.geocode_location_forced")
def test_main_duplicate_id(mock_geocode, mock_exit, monkeypatch):
    valid_body = "### Event Name\nValid Event\n### Start Date\n2026-10-10\n### Event URL\nhttps://example.com\n### Location\nNew York\n### Region (Continent)\nNorth America\n### Language\nEnglish\n"
    monkeypatch.setenv("ISSUE_BODY", valid_body)
    mock_geocode.return_value = None

    existing_yaml = "events:\n  - id: '202610101234'\n"

    def mock_file_open(filename, mode="r", *args, **kwargs):
        if "events.yaml" in str(filename):
            if "a" in mode:
                return mock_open()()
            else:
                return mock_open(read_data=existing_yaml)()
        return mock_open()()

    with patch("builtins.open", mock_file_open):
        with patch("scripts.add_event.random.randint", side_effect=[1234, 5678]):
            with patch("scripts.add_event.datetime") as mock_dt:
                mock_dt.now.return_value.strftime.return_value = "20261010"
                main()

@patch("scripts.add_event.sys.exit")
@patch("scripts.add_event.geocode_location_forced")
def test_main_cache_write_error(mock_geocode, mock_exit, monkeypatch):
    valid_body = "### Event Name\nValid Event\n### Start Date\n2026-10-10\n### Event URL\nhttps://example.com\n### Location\nNew York\n### Region (Continent)\nNorth America\n### Language\nEnglish\n"
    monkeypatch.setenv("ISSUE_BODY", valid_body)
    mock_geocode.return_value = (40.7, -74.0)

    def mock_file_open(filename, mode="r", *args, **kwargs):
        if ".geocode_cache.json" in str(filename) and "w" in mode:
            raise PermissionError("No write access")
        if "events.yaml" in str(filename):
            if "a" in mode:
                return mock_open()()
            else:
                return mock_open(read_data="events: []\n")()
        return mock_open()()

    with patch("builtins.open", mock_file_open):
        main()

@patch("scripts.add_event.sys.exit")
@patch("scripts.add_event.geocode_location_forced")
def test_main_geocoding_fallbacks(mock_geocode, mock_exit, monkeypatch):
    valid_body = "### Event Name\nValid Event\n### Start Date\n2026-10-10\n### Event URL\nhttps://example.com\n### City\nParis\n### Country\nFrance\n### Region (Continent)\nEurope\n### Language\nEnglish\n"
    monkeypatch.setenv("ISSUE_BODY", valid_body)

    mock_geocode.side_effect = [None, None, (48.8, 2.3)]

    def mock_file_open(filename, mode="r", *args, **kwargs):
        if "events.yaml" in str(filename):
            if "a" in mode:
                return mock_open()()
            else:
                return mock_open(read_data="events: []\n")()
        return mock_open()()

    with patch("builtins.open", mock_file_open):
        main()

@patch("scripts.add_event.sys.exit")
@patch("scripts.add_event.geocode_location_forced")
def test_main_yaml_ending_without_newline(mock_geocode, mock_exit, monkeypatch):
    valid_body = "### Event Name\nValid Event\n### Start Date\n2026-10-10\n### Event URL\nhttps://example.com\n### Location\nNew York\n### Region (Continent)\nNorth America\n### Language\nEnglish\n"
    monkeypatch.setenv("ISSUE_BODY", valid_body)

    mock_geocode.return_value = None

    def mock_file_open(filename, mode="r", *args, **kwargs):
        if "events.yaml" in str(filename):
            if "a" in mode:
                return mock_open()()
            else:
                return mock_open(read_data="events: []")()
        return mock_open()()

    with patch("builtins.open", mock_file_open):
        main()

def test_script_execution():
    env = os.environ.copy()
    env["ISSUE_BODY"] = ""
    result = subprocess.run(["python3", "scripts/add_event.py"], env=env, capture_output=True)
    assert result.returncode == 1
