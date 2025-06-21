# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Testing
```bash
npm test                # Run all tests using Node.js built-in test runner
```

### Running the Application
```bash
node src/legendaly.js   # Main CLI entry point (local development)
legendaly              # Global command (after npm install -g)
legendaly --help       # Show help
legendaly --version    # Show version
```

### Global Installation
```bash
npm install -g legendaly  # Install from npm
# or from source:
npm link                  # Install globally to use 'legendaly' command anywhere
```

## Architecture Overview

Legendaly is a terminal-based quote generator that uses OpenAI's GPT models to create fictional quotes with typewriter animation effects.

### Core Components

#### Source Structure (`src/`)
- **`src/legendaly.js`** - Main entry point and orchestration
- **`src/core/config.js`** - Configuration management with validation and fallback defaults
- **`src/ui/ui.js`** - Terminal UI utilities (cursor control, typewriter effects)
- **`src/core/quotes.js`** - Quote generation with retry mechanism and batch API calls
- **`src/core/animation.js`** - Animation controls and signal handling
- **`src/utils/logger.js`** - Log management with rotation and cleanup
- **`src/features/`** - Feature modules (interactive, export, notify, ratings)
- **`src/locales/`** - Language resources (ja, en, zh, ko, fr, es, de)

#### User Data Directory (`~/.legendaly/`)
- **`config/`** - User configuration files (favorites.json, .env)
- **`logs/`** - Application logs (legendaly.log with rotation)
- **`echoes/`** - Session history files (*.echoes with 30-day cleanup)
- **`cache/`** - Cache directory (future use)

### Key Architectural Patterns

1. **Batch Quote Generation**: Single API call generates multiple quotes (up to 25) for efficiency
2. **Multilingual Support**: Language resources in `locales/` directory with regex patterns for parsing
3. **Robust Error Handling**: Exponential backoff retry mechanism for API calls
4. **User Data Management**: 
   - Main log file (`~/.legendaly/logs/legendaly.log`) with automatic rotation at 10MB
   - Session-based echo files in `~/.legendaly/echoes/` directory with 30-day cleanup
   - User settings stored in `~/.legendaly/config/` directory
5. **Configuration Validation**: All environment variables validated with warnings and fallbacks

### External Dependencies

- **OpenAI Client**: Self-contained with fallback to external helper module at `~/.config/common/openaiClients.js` (configurable via `OPENAI_CLIENT_PATH`)
- **System Commands**: Uses `figlet` and `lolcat` for visual effects via `execSync` (optional)
- **Required**: Node.js 16.0.0+, OpenAI API key
- **Optional**: figlet (ASCII art), lolcat (rainbow colors)

### Language Processing

Quote parsing uses language-specific regex patterns from `src/locales/*.js` files. Each locale defines patterns for:
- Quote extraction
- Character name parsing  
- Source work identification
- Date/period extraction

### Configuration System

Environment variables are validated against allowed ranges/values in `src/core/config.js`. Invalid values trigger warnings and use defaults. Supports:
- Visual themes (epic, cyberpunk, zen, etc.)
- Animation timing controls
- Model selection (GPT-4o, GPT-4-turbo, etc.)
- Multilingual output (7 languages supported)