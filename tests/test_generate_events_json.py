"""Unit tests for event dict validation (no YAML files, no network)."""

from __future__ import annotations

import generate_events_json as gen


def _minimal_event(**overrides: object) -> dict:
    ev: dict = {
        "id": "99",
        "title": "Test event",
        "description": "Desc",
        "date": "2026-08-01",
        "time": "15:00",
        "location": "Somewhere",
        "region": "North",
        "category": "Technology",
    }
    ev.update(overrides)
    return ev


def test_validate_ok_for_sensible_event() -> None:
    err = gen.validate_event(_minimal_event(), 1)
    assert err == []


def test_missing_required_field() -> None:
    ev = _minimal_event()
    del ev["title"]
    err = gen.validate_event(ev, 1)
    assert len(err) == 1
    assert "title" in err[0].lower() or "Missing" in err[0]


def test_invalid_date_string() -> None:
    err = gen.validate_event(_minimal_event(date="not-a-date"), 1)
    assert any("date" in e.lower() for e in err)


def test_invalid_time_string() -> None:
    err = gen.validate_event(_minimal_event(time="25:99"), 1)
    assert any("time" in e.lower() for e in err)


def test_datetime_objects_get_normalized_like_yaml() -> None:
    from datetime import datetime

    ev = _minimal_event(
        date=datetime(2026, 1, 15),
        time=datetime(1900, 1, 1, 9, 30),
    )
    assert gen.validate_event(ev, 1) == []
    assert ev["date"] == "2026-01-15"
    assert ev["time"] == "09:30"
