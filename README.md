# DU Event Board

> Discover tech events, meetups, and workshops near your region.

DU Event Board is a community-driven event discovery platform deployed as a
GitHub Pages site. Events are defined in a simple YAML file, and the site is
automatically built and deployed via GitHub Actions when changes are merged to
`main`.

## How It Works

1. **Events are defined in YAML** - see [`data/events.yaml`](data/events.yaml)
2. **GitHub Actions generates the frontend data** - a Python script converts
   YAML to JSON
3. **React frontend displays the events** - with search, geographic, hashtag,
   format, and cost filtering
4. **Deployed automatically to GitHub Pages** - on every push to `main`

## Adding a New Event

Edit `data/events.yaml` and add a new entry.

The project now supports richer metadata fields:
- `eventType`: `online`, `in-person`, or `hybrid`
- `cost`: `free` or `paid`
- `startDate` and `endDate` for multi-day events
- `country` and `state` for geographic search
- `organizationLogo` for an optional organizer logo
- `featured` to highlight events at the top of the page

Example event:

```yaml
- id: "9"
  title: "Your Event Name"
  description: "A brief description of the event."
  date: "2026-05-01"
  startDate: "2026-05-01"
  endDate: "2026-05-02"
  time: "18:00"
  location: "Venue Name, City"
  region: "City Name"
  state: "State / Province"
  country: "Country"
  category: "Technology"
  eventType: "in-person"
  cost: "free"
  organizationLogo: "https://example.com/logo.png"
  featured: true
  url: "https://example.com/your-event"
  tags:
    - tag1
    - tag2
```

Then open a Pull Request. CI will validate the YAML and run tests. Once merged,
the site is automatically rebuilt and deployed.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Python](https://www.python.org/) 3.10+ (for the YAML generator)

### Setup

```bash
# Install Node dependencies
npm install

# Install Python dependencies
pip install pyyaml

# Generate events.json from YAML
npm run generate

# Start development server
npm run dev
```

### Commands

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `npm run dev`      | Start dev server               |
| `npm run build`    | Build for production           |
| `npm run preview`  | Preview production build       |
| `npm run test`     | Run tests                      |
| `npm run lint`     | Lint the codebase              |
| `npm run generate` | Generate events.json from YAML |

## Project Structure

```text
du-event-board/
|-- .github/
|   |-- ISSUE_TEMPLATE/          # Issue templates
|   |-- PULL_REQUEST_TEMPLATE.md # PR template
|   `-- workflows/
|       |-- ci.yaml              # PR checks (lint, test, build)
|       `-- deploy.yaml          # Deploy to GitHub Pages
|-- data/
|   `-- events.yaml              # Event definitions (source of truth)
|-- scripts/
|   `-- generate_events_json.py  # YAML to JSON converter
|-- src/
|   |-- components/
|   |   |-- EventCard.jsx        # Event card component
|   |   |-- Header.jsx           # Site header
|   |   `-- SearchBar.jsx        # Search and advanced filters
|   |-- data/
|   |   `-- events.json          # Generated from YAML
|   |-- test/
|   |   |-- App.test.jsx         # App tests
|   |   `-- setup.js             # Test setup
|   |-- App.jsx                  # Main app component
|   |-- index.css                # Design system
|   `-- main.jsx                 # Entry point
|-- .editorconfig
|-- .gitignore
|-- .pre-commit-config.yaml
|-- .prettierrc.yaml
|-- CODE_OF_CONDUCT.md
|-- LICENSE
|-- README.md
|-- index.html
|-- package.json
`-- vite.config.js
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup (including conda
environment) and contribution guidelines.

## License

This project is licensed under the BSD 3-Clause License - see the
[LICENSE](LICENSE) file for details.
