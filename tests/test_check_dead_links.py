import sys
import pytest
import requests
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add scripts directory to path to import check_dead_links
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from unittest.mock import mock_open
from check_dead_links import check_link, main

@patch("check_dead_links.requests.head")
def test_check_link_head_success(mock_head):
    """Test function."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_head.return_value = mock_response

    is_ok, reason = check_link("http://example.com")
    assert is_ok is True
    assert reason == "200"
    mock_head.assert_called_once()

@patch("check_dead_links.requests.get")
@patch("check_dead_links.requests.head")
def test_check_link_head_fails_get_succeeds(mock_head, mock_get):
    """Test function."""
    mock_head_response = MagicMock()
    mock_head_response.status_code = 405  # Method not allowed for HEAD
    mock_head.return_value = mock_head_response

    mock_get_response = MagicMock()
    mock_get_response.status_code = 200
    mock_get.return_value = mock_get_response

    is_ok, reason = check_link("http://example.com")
    assert is_ok is True
    assert reason == "200"
    mock_head.assert_called_once()
    mock_get.assert_called_once()

@patch("check_dead_links.requests.head")
def test_check_link_not_found(mock_head):
    """Test function."""
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_head.return_value = mock_response

    is_ok, reason = check_link("http://example.com")
    assert is_ok is False
    assert "Status Code: 404" in reason

@patch("check_dead_links.requests.head")
def test_check_link_timeout(mock_head):
    """Test function."""
    mock_head.side_effect = requests.exceptions.Timeout()

    is_ok, reason = check_link("http://example.com")
    assert is_ok is False
    assert reason == "Timeout (10s)"

@patch("check_dead_links.requests.head")
def test_check_link_connection_error(mock_head):
    """Test function."""
    mock_head.side_effect = requests.exceptions.ConnectionError()

    is_ok, reason = check_link("http://example.com")
    assert is_ok is False
    assert reason == "Connection Error"

@patch("check_dead_links.requests.head")
def test_check_link_request_exception(mock_head):
    """Test function."""
    mock_head.side_effect = requests.exceptions.RequestException("Some error")

    is_ok, reason = check_link("http://example.com")
    assert is_ok is False
    assert "Request Error: Some error" in reason

@patch("check_dead_links.INPUT_FILE")
@patch("check_dead_links.sys.exit")
@patch("builtins.open", new_callable=mock_open, read_data="events:\n  - id: '1'\n    url: 'http://broken.com'\n")
@patch("check_dead_links.check_link")
def test_main_generates_report(mock_check_link, mock_open_file, mock_exit, mock_input_file):
    """Test function."""
    mock_input_file.exists.return_value = True
    mock_check_link.return_value = (False, "404 Not Found")

    main()

    mock_exit.assert_called_once_with(1)

    # Check if write was called with the report
    written_content = "".join(call.args[0] for call in mock_open_file().write.call_args_list)
    assert "http://broken.com" in written_content
    assert "404 Not Found" in written_content

@patch("check_dead_links.INPUT_FILE")
@patch("builtins.open", new_callable=mock_open, read_data="events: []\n")
def test_main_no_events(mock_open_file, mock_input_file, capsys):
    """Test function."""
    mock_input_file.exists.return_value = True
    main()
    captured = capsys.readouterr()
    assert "No events found to check." in captured.out

@patch("check_dead_links.REPORT_FILE")
@patch("check_dead_links.INPUT_FILE")
@patch("check_dead_links.sys.exit")
@patch("builtins.open", new_callable=mock_open, read_data="events:\n  - id: '1'\n    url: 'http://healthy.com'\n")
@patch("check_dead_links.check_link")
def test_main_all_healthy(mock_check_link, mock_open_file, mock_exit, mock_input_file, mock_report_file):
    """Test function."""
    mock_input_file.exists.return_value = True
    mock_check_link.return_value = (True, "200")
    mock_report_file.exists.return_value = True # ensure we test unlink

    main()

    mock_exit.assert_called_once_with(0)
    mock_report_file.unlink.assert_called_once()
