# Legendaly 🧙‍♂️

**Legendaly** is a terminal-based legendary quote generator powered by OpenAI GPT-4.
It types out beautiful quotes like a sage, then fades them into mist, one by one.

## Features

- Generate AI-crafted "legendary" quotes with character attribution
- Pre-fetch multiple quotes in a single API call for efficiency
- Display with customizable typewriter animation
- Fade out like mist (supports full-width Japanese characters)
- Loop through quotes with configurable timing
- Cyberpunk glitch effects (when using cyberpunk tone)
- Support for various visual themes and fonts

## Installation

```bash
npm install
```

You also need an OpenAI API key. By default the program loads a helper module
from `~/.config/common/openaiClients.js` that exports a configured OpenAI
client.  If you keep this helper in another location, set the
`OPENAI_CLIENT_PATH` environment variable to point to it.  A typical helper uses
`dotenv` to load a `.env` file with your credentials.

## Usage

```bash
node legendaly.js
```

Create a `.env` file to customize behavior with the following environment variables:

### Core Settings
- `TONE` – Style of the generated quotes (default: `epic`)
  - Available tones: `epic`, `cyberpunk`, `mellow`, `retro`, `neon`, `zen`
- `MODEL` – OpenAI model to use (default: `gpt-4o`)
- `QUOTE_COUNT` – Number of quotes to pre-fetch at startup (default: `100`)
- `FETCH_INTERVAL` – Seconds between displaying each quote (default: `3`)
- `LANGUAGE` – Output language (default: `ja`)
  - Available languages: `ja` (Japanese), `en` (English), `zh` (Chinese), `ko` (Korean), `fr` (French), `es` (Spanish), `de` (German)
- `OPENAI_CLIENT_PATH` – Path to the helper that exports a configured OpenAI client (default: `~/.config/common/openaiClients.js`)

### Visual Settings
- `FIGLET_FONT` – ASCII art font used for the header (default: `slant`)
  - Try others like: `banner`, `big`, `doom`, `standard`, `broadway`, etc.
- `TYPE_SPEED` – Speed of typewriter effect in milliseconds (default: `40`)
- `DISPLAY_TIME` – Time to display quote before fading in milliseconds (default: `2000`)
- `FADE_STEPS` – Number of steps in fade out animation (default: `8`)
- `FADE_DELAY` – Delay between fade steps in milliseconds (default: `100`)

### Examples

```bash
# Use cyberpunk theme with futuristic fonts
TONE=cyberpunk FIGLET_FONT=banner3-D node legendaly.js

# Fetch fewer quotes but display them longer
QUOTE_COUNT=10 DISPLAY_TIME=5000 FETCH_INTERVAL=5 node legendaly.js

# Fast typing speed with slower fade effect
TYPE_SPEED=10 FADE_STEPS=12 FADE_DELAY=200 node legendaly.js
```

Each generated quote is appended to `legendaly.log` in the following format:

```
[YYYY] キャラクター名『作品名』：「名言」
```

## Quote Format

Quotes are generated with:
- The quote itself
- A fictional character who said it
- The fictional work it's from 
- A year/time period setting

## Global CLI

Install the package globally to use the `legendaly` command anywhere:

```bash
npm link
legendaly
```

## License

MIT License
