"""
title: Unit tests for event coordinate validation in generate_events_json.
summary: |-
  Covers optional lat/lng pairing, ranges, and string-to-number normalization.
"""

import sys
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def _validate_event(event: dict, index: int) -> list[str]:
    """
    title: Run validate_event from generate_events_json for assertions.
    parameters:
      event:
        type: dict
      index:
        type: int
    returns:
      type: list[str]
    """
    from scripts.generate_events_json import validate_event

    return validate_event(event, index)


def _base_event() -> dict:
    """
    title: Build a minimal event dict that passes core field checks.
    returns:
      type: dict
    """
    return {
        "id": "test-id",
        "title": "Test Event",
        "description": "Test Description",
        "date": "2026-04-10",
        "time": "19:00",
        "location": "Test Location",
        "region": "Test Region",
        "category": "Technology",
    }


class ValidateCoordinatesTests(unittest.TestCase):
    def test_accepts_events_without_coordinates(self) -> None:
        """
        title: Allow events that omit both lat and lng.
        """
        errors = _validate_event(_base_event(), 1)
        self.assertEqual(errors, [])

    def test_requires_lat_lng_as_pair(self) -> None:
        """
        title: Reject events that only set one of lat or lng.
        """
        event = _base_event()
        event["lat"] = 12.34
        errors = _validate_event(event, 1)
        self.assertTrue(any("both 'lat' and 'lng'" in err for err in errors))

    def test_rejects_out_of_range_coordinates(self) -> None:
        """
        title: Fail validation when lat or lng are outside valid ranges.
        """
        event = _base_event()
        event["lat"] = 100
        event["lng"] = 10
        errors = _validate_event(event, 1)
        self.assertTrue(any("range -90 to 90" in err for err in errors))

    def test_normalizes_coordinate_types(self) -> None:
        """
        title: Coerce numeric string lat/lng to floats and mutate the dict.
        """
        event = _base_event()
        event["lat"] = "12.5"
        event["lng"] = "-40.25"
        errors = _validate_event(event, 1)
        self.assertEqual(errors, [])
        self.assertEqual(event["lat"], 12.5)
        self.assertEqual(event["lng"], -40.25)


if __name__ == "__main__":
    unittest.main()
