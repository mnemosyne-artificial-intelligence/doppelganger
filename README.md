# Doppelganger

[![Docker](https://img.shields.io/badge/docker-mnemosyneai%2Fdoppelganger-0db7ed)](https://hub.docker.com/r/mnemosyneai/doppelganger)
[![Self-Hosted](https://img.shields.io/badge/self--hosted-local--first-2f855a)](#getting-started)

Doppelganger is a self-hosted, developer-focused browser automation and extraction tool. It runs locally via Docker and provides a DIY workflow for building automation tasks with blocks and optional JavaScript customization.

This project is designed for local, controlled use cases. It does not claim to bypass protections and does not encourage unlawful activity.

## Getting Started (Docker)

### Requirements
- Docker Desktop or Docker Engine
- x86_64 or ARM64 host
- 4GB+ RAM recommended

### Pull the Image
```bash
docker pull mnemosyneai/doppelganger
```

### Run the Container
```bash
docker run -d \
  --name doppelganger \
  -p 11345:11345 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public:/app/public \
  -v $(pwd)/storage_state.json:/app/storage_state.json \
  mnemosyneai/doppelganger
```

Open the dashboard at:
```
http://localhost:11345
```

### Update to Latest
```bash
docker pull mnemosyneai/doppelganger
docker stop doppelganger
docker rm doppelganger
docker run -d \
  --name doppelganger \
  -p 11345:11345 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public:/app/public \
  -v $(pwd)/storage_state.json:/app/storage_state.json \
  mnemosyneai/doppelganger
```

## Usage

### Open the Dashboard
Navigate to:
```
http://localhost:11345
```

### Create a Task (Block-Based)
1. Click **New Task**
2. Choose a mode (Scrape, Agent, Headful)
3. Add action blocks (click, type, hover, wait, scroll, press, javascript)
4. Configure variables and selectors
5. Save and run

### Example Workflow (Safe Demo)
Goal: Load a public page, wait, and extract a title.
1. Create a new task
2. Set URL to `https://example.com`
3. Add a **wait** block (2 seconds)
4. Add a **javascript** block:
```js
return document.title;
```
5. Run the task and view the output

### JSON Export
In the task editor, open the JSON view and copy the task definition for reuse.

### JavaScript Blocks
JavaScript blocks allow custom extraction or page logic. Use them for:
- Parsing DOM elements
- Returning structured data
- Adding custom logic to actions

## AI Features (Optional)
AI-assisted script generation may be added in the future.
- You would provide your own API key
- You would choose the model
- AI does not execute tasks automatically

## Community and Presets
Community-contributed presets or examples may be shared in the future.
- Use community content at your own risk
- The author is not responsible for community content
- Always use the tool safely and legally

## License
This project uses a Sustainable Use License (SUL). See `LICENSE`.

## Disclaimer
The software is provided "as-is" without warranty. You are solely responsible for:
- Your scripts and automation behavior
- The data you access or collect
- Any consequences of use

Do not use this tool in ways that violate laws or third-party terms.

## Links
- Docker Hub: https://hub.docker.com/r/mnemosyneai/doppelganger
