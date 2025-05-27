# Legendaly 🧙‍♂️

**Legendaly** is a terminal-based legendary quote generator powered by OpenAI GPT-4.
It types out beautiful quotes like a sage, then fades them into mist, one by one.

## Features

- Generate AI-crafted "legendary" quotes
- Display with typewriter animation
- Fade out like mist (supports full-width Japanese characters)
- Loop new quotes every N seconds

## Installation

```bash
npm install
```

You also need an OpenAI API key. The script expects a helper at
`~/.config/common/openaiClients.js` that provides a configured OpenAI client.
Create this file (or modify `legendaly.js` to point to your own helper) and set
up your credentials there. A typical helper uses `dotenv` to load a `.env` file.

User configurable options are centralised in `config.js`. Environment
variables defined there can be overridden in a `.env` file or via the shell.

## Usage

```bash
node legendaly.js
```

Create a `.env` file or edit `config.js` to customise behaviour.
The following environment variables are recognised:

- `TONE` – Style of the generated quote (default: `epic`).
- `FIGLET_FONT` – Font used for the header (default: `slant`).
- `FETCH_INTERVAL` – Seconds between each new quote (default: `3`).
- `MODEL` – OpenAI model to use (default: `gpt-4o`).

Each generated quote is appended to `legendaly.log` in the following format:

```
[YYYY-MM-DD] 偉人名：「名言」
```

Enjoy legendary wisdom in your terminal!

## Global CLI

Install the package globally to use the `legendaly` command anywhere:

```bash
npm link
legendaly
```

## License

MIT License
