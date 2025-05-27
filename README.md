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

## Usage

```bash
node legendaly.js
```

Set the following optional environment variables to customize behaviour:

- `TONE` – Style of the generated quote (default: `epic`).
- `TWEET_USER` – Name displayed as the author (default: `Unsung Hero`).
- `COLOR_TONE` – Figlet colour tone (default: `cyan`).
- `FETCH_INTERVAL` – Seconds between each new quote (default: `10`).

Enjoy legendary wisdom in your terminal!

## License

MIT License
