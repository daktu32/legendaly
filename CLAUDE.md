# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Testing
```bash
npm test                # Run all tests using Node.js built-in test runner
```

### Running the Application
```bash
node legendaly.js       # Main CLI entry point
```

### Global Installation
```bash
npm link               # Install globally to use 'legendaly' command anywhere
```

## Architecture Overview

Legendaly is a terminal-based quote generator that uses OpenAI's GPT models to create fictional quotes with typewriter animation effects.

### Core Components

- **`legendaly.js`** - Main entry point and orchestration
- **`config.js`** - Configuration management with validation and fallback defaults
- **`ui.js`** - Terminal UI utilities (cursor control, typewriter effects)
- **`lib/quotes.js`** - Quote generation with retry mechanism and batch API calls
- **`lib/animation.js`** - Animation controls and signal handling
- **`lib/logger.js`** - Log management with rotation and cleanup

### Key Architectural Patterns

1. **Batch Quote Generation**: Single API call generates multiple quotes (up to 25) for efficiency
2. **Multilingual Support**: Language resources in `locales/` directory with regex patterns for parsing
3. **Robust Error Handling**: Exponential backoff retry mechanism for API calls
4. **Dual Logging System**: 
   - Main log file (`legendaly.log`) with automatic rotation at 10MB
   - Session-based echo files in `echoes/` directory with 30-day cleanup
5. **Configuration Validation**: All environment variables validated with warnings and fallbacks

### External Dependencies

- **OpenAI Client**: Requires external helper module at `~/.config/common/openaiClients.js` (configurable via `OPENAI_CLIENT_PATH`)
- **System Commands**: Uses `figlet` and `lolcat` for visual effects via `execSync`

### Language Processing

Quote parsing uses language-specific regex patterns from `locales/*.js` files. Each locale defines patterns for:
- Quote extraction
- Character name parsing  
- Source work identification
- Date/period extraction

### Configuration System

Environment variables are validated against allowed ranges/values in `config.js`. Invalid values trigger warnings and use defaults. Supports:
- Visual themes (epic, cyberpunk, zen, etc.)
- Animation timing controls
- Model selection (GPT-4o, GPT-4-turbo, etc.)
- Multilingual output (7 languages supported)