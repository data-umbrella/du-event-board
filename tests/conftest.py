"""Test-only: let `import generate_events_json` resolve from scripts/."""

import sys
from pathlib import Path

_scripts = Path(__file__).resolve().parent.parent / "scripts"
if str(_scripts) not in sys.path:
    sys.path.insert(0, str(_scripts))
