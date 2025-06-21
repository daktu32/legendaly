# Legendaly Configuration Samples

This directory contains sample configuration files for Legendaly. Copy these files to `~/.legendaly/config/` to customize your experience.

## Quick Setup

```bash
# Copy sample files to your config directory
cp -r .temp/sample-configs/* ~/.legendaly/config/

# Rename the .env example file
mv ~/.legendaly/config/.env.example ~/.legendaly/config/.env

# Edit your API key
nano ~/.legendaly/config/.env
```

## Configuration Files

### Core Configuration

#### `.env` (Environment Variables)
- **Source**: `.env.example`
- **Purpose**: Main configuration using environment variables
- **Required**: OpenAI API key
- **Usage**: Rename `.env.example` to `.env` and customize

#### `settings.json` (JSON Configuration)
- **Purpose**: Structured configuration alternative to .env
- **Features**: JSON schema validation, comments, organized sections
- **Priority**: Environment variables override JSON settings

### Advanced Configuration

#### `themes.json` (Visual Themes)
- **Purpose**: Custom color themes and visual styling
- **Features**: Custom lolcat parameters, font settings, color schemes
- **Usage**: Define your own themes beyond the built-in ones

#### `profiles/` (Usage Profiles)
- **Purpose**: Pre-configured settings for different contexts
- **Included Profiles**:
  - `work.json` - Professional, motivational quotes
  - `personal.json` - Zen, philosophical reflection
  - `creative.json` - Artistic inspiration with visual effects

## File Structure

```
~/.legendaly/config/
├── .env                    # Main environment configuration
├── settings.json           # Alternative JSON configuration
├── themes.json            # Custom themes and visual settings
├── favorites.json         # User's favorite quotes (auto-generated)
└── profiles/              # Usage context profiles
    ├── work.json          # Professional/workplace setting
    ├── personal.json      # Personal reflection and zen
    └── creative.json      # Creative inspiration
```

## Usage Examples

### Using Environment Variables (.env)
```bash
# Edit your .env file
TONE=zen
LANGUAGE=en
INTERACTIVE=true
TYPE_SPEED=30
```

### Using Profiles
```bash
# Future feature - profile switching
legendaly --profile work
legendaly --profile creative
```

### Custom Themes
```bash
# Future feature - custom theme usage
legendaly --theme midnight
legendaly --theme sunset
```

## Configuration Priority

1. **Command Line Arguments** (highest priority)
2. **Environment Variables** (.env file)
3. **JSON Settings** (settings.json)
4. **Profile Settings** (profiles/*.json)
5. **Default Values** (lowest priority)

## Schema Validation

Future versions will include JSON schema validation for:
- `settings.json`
- `themes.json`
- `profiles/*.json`

## Notes

- All configuration files are optional
- Missing files will use sensible defaults
- Invalid settings will show warnings and fall back to defaults
- Comments in JSON files (starting with `_comment`) are ignored by the parser