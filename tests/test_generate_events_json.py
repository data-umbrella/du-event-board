import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add scripts directory to path to import generate_events_json
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from unittest.mock import mock_open
from generate_events_json import is_ci, validate_event, geocode_location, update_yaml_surgically

def test_is_ci(monkeypatch):
    """Test function."""
    monkeypatch.delenv("GITHUB_ACTIONS", raising=False)
    monkeypatch.delenv("NETLIFY", raising=False)
    monkeypatch.delenv("CI", raising=False)
    monkeypatch.delenv("VERCEL", raising=False)
    assert is_ci() is False

    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    assert is_ci() is True

def test_validate_event_valid():
    """Test function."""
    event = {
        "id": "1",
        "title": "Test Event",
        "description": "Desc",
        "date": "2023-10-15",
        "time": "14:00",
        "location": "Online",
        "region": "Global",
        "category": "Tech"
    }
    errors = validate_event(event, 1)
    assert errors == []

def test_validate_event_missing_fields():
    """Test function."""
    event = {
        "id": "1",
        "title": "Test Event",
        # missing description, date, location, region, category
    }
    errors = validate_event(event, 1)
    assert len(errors) == 5
    assert any("Missing required field 'description'" in e for e in errors)

def test_validate_event_invalid_date():
    """Test function."""
    event = {
        "id": "1",
        "title": "Test Event",
        "description": "Desc",
        "date": "15-10-2023", # Invalid format
        "location": "Online",
        "region": "Global",
        "category": "Tech"
    }
    errors = validate_event(event, 1)
    assert len(errors) == 1
    assert "Invalid date format" in errors[0]

def test_validate_event_invalid_time():
    """Test function."""
    event = {
        "id": "1",
        "title": "Test Event",
        "description": "Desc",
        "date": "2023-10-15",
        "time": "2pm", # Invalid format
        "location": "Online",
        "region": "Global",
        "category": "Tech"
    }
    errors = validate_event(event, 1)
    assert len(errors) == 1
    assert "Invalid time format" in errors[0]

def test_validate_event_python_datetime_objects():
    """Test function."""
    import datetime
    event = {
        "id": "1",
        "title": "Test Event",
        "description": "Desc",
        "date": datetime.date(2023, 10, 15),
        "time": datetime.time(14, 0),
        "location": "Online",
        "region": "Global",
        "category": "Tech"
    }
    errors = validate_event(event, 1)
    assert len(errors) == 0
    # The script converts time objects to strings, but leaves datetime.date objects as-is
    assert str(event["date"]) == "2023-10-15"
    assert event["time"] == "14:00"

@patch("generate_events_json.INPUT_FILE")
def test_update_yaml_surgically_file_not_found(mock_input_file):
    """Test function."""
    mock_input_file.exists.return_value = False
    update_yaml_surgically([{"id": "1", "lat": 12.3, "lng": 45.6}])

@patch("generate_events_json.is_ci")
@patch("generate_events_json.get_cache")
def test_geocode_location_online(mock_get_cache, mock_is_ci):
    """Test function."""
    assert geocode_location("Online") is None
    assert geocode_location("online") is None
    assert geocode_location("") is None

@patch("generate_events_json.is_ci")
@patch("generate_events_json.get_cache")
def test_geocode_location_cached(mock_get_cache, mock_is_ci):
    """Test function."""
    mock_get_cache.return_value = {"London": (51.5074, -0.1278)}
    assert geocode_location("London") == (51.5074, -0.1278)

@patch("generate_events_json.is_ci")
@patch("generate_events_json.get_cache")
def test_geocode_location_ci_skip(mock_get_cache, mock_is_ci):
    """Test function."""
    mock_get_cache.return_value = {}
    mock_is_ci.return_value = True
    assert geocode_location("Paris") is None

@patch("generate_events_json.urllib.request.urlopen")
@patch("generate_events_json.is_ci")
@patch("generate_events_json.get_cache")
@patch("generate_events_json.time.sleep")
def test_geocode_location_network_success(mock_sleep, mock_get_cache, mock_is_ci, mock_urlopen):
    """Test function."""
    mock_get_cache.return_value = {}
    mock_is_ci.return_value = False

    mock_response = MagicMock()
    mock_response.read.return_value = b'[{"lat": "48.8566", "lon": "2.3522"}]'
    mock_urlopen.return_value.__enter__.return_value = mock_response

    result = geocode_location("Paris")
    assert mock_get_cache.return_value["Paris"] == (48.8566, 2.3522)

@patch("generate_events_json.INPUT_FILE")
@patch("builtins.open", new_callable=mock_open, read_data="events:\n  - id: '1'\n    title: 'Test'\n")
def test_update_yaml_surgically(mock_file, mock_input_file):
    """Test function."""
    mock_input_file.exists.return_value = True
    events_with_coords = [{"id": "1", "lat": 12.34, "lng": 56.78}]
    update_yaml_surgically(events_with_coords)

    # Check if writelines was called
    assert mock_file().writelines.called
    lines_written = mock_file().writelines.call_args[0][0]
    written_data = "".join(lines_written)

    assert "lat: 12.34" in written_data
    assert "lng: 56.78" in written_data
