# Legendaly Usage Guide

## Introduction

Legendaly is a terminal-based tool that generates fictional quotes using OpenAI models. The program shows each quote with a typewriter effect and then fades it away before displaying the next one.

## Basic Usage

```bash
node legendaly.js
```
After installing globally you can simply run `legendaly`.

## Configuration via Environment Variables

Create a `.env` file or pass variables directly when executing to customize behavior.

### Core Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `TONE` | Style of generated quotes | `epic` |
| `MODEL` | OpenAI model (`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`) | `gpt-4o-mini` |
| `QUOTE_COUNT` | Quotes fetched at launch (1-1000) | `25` |
| `FETCH_INTERVAL` | Seconds between quotes (1-300) | `1` |
| `LANGUAGE` | Output language | `ja` |
| `OPENAI_CLIENT_PATH` | Path to configured OpenAI client | `~/.config/common/openaiClients.js` |

### Display Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `FIGLET_FONT` | ASCII art font for the header | `slant` |
| `TYPE_SPEED` | Typing speed in ms (1-1000) | `40` |
| `DISPLAY_TIME` | How long to show the quote in ms (100-60000) | `2000` |
| `FADE_STEPS` | Fade animation steps (1-50) | `8` |
| `FADE_DELAY` | Delay between fade steps in ms (10-5000) | `100` |

### Additional Options

| Variable | Description | Default |
|----------|-------------|---------|
| `TONES` | Combine multiple tones with commas | *(empty)* |
| `CATEGORY` | Restrict quotes by topic | *(empty)* |
| `USER_PROMPT` | Extra prompt text | *(empty)* |
| `MIN_RATING` | Minimum rating to display (0-5) | `0` |
| `DISPLAY_STYLE` | Alternative display style | `standard` |
| `AUDIO_FILE` | Play a sound with each quote | *(empty)* |
| `NOTIFY` | Enable desktop notifications | `false` |
| `VISUAL_NOTIFY` | Enable in-terminal notifications | `false` |
| `DISABLE_SOUND` | Mute notification sounds | `false` |
| `FLASH_SCREEN` | Flash terminal on notifications | `false` |
| `INTERACTIVE` | Enable interactive mode | `false` |
| `VERBOSE` | Output verbose logs | `false` |

**Note:** Invalid values fall back to defaults and show a warning.

### Examples

```bash
# Generate quotes in English with a zen tone
LANGUAGE=en TONE=zen node legendaly.js

# Cyberpunk theme with fancy font
TONE=cyberpunk FIGLET_FONT=banner3-D node legendaly.js
```

### Logging

All quotes are appended to `legendaly.log` and organized per session in the `echoes/` directory. Old logs rotate at 10MB and echoes older than 30 days are removed automatically.

