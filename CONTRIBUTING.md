# Contributing to DU Event Board

Thank you for your interest in contributing! This guide will help you get
started.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Setting Up the Development Environment

### Prerequisites

- [Conda](https://docs.conda.io/) or [Mamba](https://mamba.readthedocs.io/)
  (recommended)

### Creating the Conda Environment

```bash
# Create the environment (includes Python, Node.js, and PyYAML)
mamba env create -f conda.yaml

# Activate the environment
conda activate du-event-board
```

### Installing Node Dependencies

```bash
npm install
```

### Generating Event Data

```bash
# Convert data/events.yaml → src/data/events.json
npm run generate
```

### Running the Dev Server

```bash
npm run dev
```

## Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run tests and linting:
   ```bash
   npm run test
   npm run lint
   ```
5. Commit your changes using
   [conventional commits](https://www.conventionalcommits.org/)
6. Push to the branch (`git push origin feat/amazing-feature`)
7. Open a Pull Request

## Available Commands

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `npm run dev`      | Start dev server               |
| `npm run build`    | Build for production           |
| `npm run preview`  | Preview production build       |
| `npm run test`     | Run tests                      |
| `npm run lint`     | Lint the codebase              |
| `npm run generate` | Generate events.json from YAML |

## Adding a New Event

Edit `data/events.yaml` and add a new entry following the existing format:

```yaml
- id: "9"
  title: "Your Event Name"
  description: "A brief description of the event."
  date: "2026-05-01"
  time: "18:00"
  timezone: "America/Sao_Paulo" #(IANA format)
  location: "Venue Name, City"
  region: "City Name"
  category: "Technology"
  url: "https://example.com/your-event"
  tags:
    - tag1
    - tag2
```

Then run `npm run generate` to update the JSON, and open a Pull Request. CI
will validate the YAML and run tests automatically.
