#!/bin/bash

# Legendaly Demo Recording Script
# This script records various demo scenarios for README documentation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"

# Create assets directory if it doesn't exist
mkdir -p "$ASSETS_DIR"

echo "🎬 Starting Legendaly demo recordings..."
echo "📁 Project directory: $PROJECT_DIR"
echo "📁 Assets directory: $ASSETS_DIR"

# Function to record and convert to GIF
record_demo() {
    local name="$1"
    local env_vars="$2"
    local duration="$3"
    local description="$4"
    
    echo ""
    echo "🎥 Recording: $name"
    echo "📝 Description: $description"
    echo "⚙️  Environment: $env_vars"
    echo "⏱️  Duration: ${duration}s"
    
    # Record with asciinema
    local cast_file="$ASSETS_DIR/${name}.cast"
    local gif_file="$ASSETS_DIR/${name}.gif"
    
    echo "Press Enter to start recording '$name' (will run for ${duration}s)..."
    read -r
    
    cd "$PROJECT_DIR"
    
    # Start recording in background and run the command
    (
        sleep 1
        if [ -n "$env_vars" ]; then
            env $env_vars timeout ${duration}s node legendaly.js || true
        else
            timeout ${duration}s node legendaly.js || true
        fi
    ) &
    
    # Record the session
    asciinema rec "$cast_file" --overwrite --command "bash -c 'sleep $((duration + 2))'"
    
    # Convert to GIF
    echo "🔄 Converting to GIF..."
    agg --theme monokai --font-size 14 --cols 120 --rows 30 "$cast_file" "$gif_file"
    
    # Clean up cast file
    rm "$cast_file"
    
    echo "✅ Created: $gif_file"
}

# Demo scenarios
echo ""
echo "Available demo scenarios:"
echo "1. Basic Japanese demo (default settings)"
echo "2. English Zen mode"
echo "3. Cyberpunk theme"
echo "4. Fast typing with custom font"
echo "5. Multiple tones combination"
echo "6. All demos"

read -p "Select scenario (1-6): " choice

case $choice in
    1|6)
        record_demo "demo_basic_ja" "" 15 "Basic Japanese demo with default epic tone"
        ;;& # Continue to next case
    2|6)
        record_demo "demo_en_zen" "LANGUAGE=en TONE=zen" 15 "English output with zen atmosphere"
        ;;& # Continue to next case
    3|6)
        record_demo "demo_cyberpunk" "TONE=cyberpunk FIGLET_FONT=banner3-D" 15 "Cyberpunk theme with futuristic font"
        ;;& # Continue to next case
    4|6)
        record_demo "demo_fast_typing" "TYPE_SPEED=10 FIGLET_FONT=doom FADE_STEPS=12" 15 "Fast typing with doom font and slow fade"
        ;;& # Continue to next case
    5|6)
        record_demo "demo_multi_tone" "TONES=epic,zen LANGUAGE=en" 15 "Multiple tones combination in English"
        ;;
esac

echo ""
echo "🎉 Demo recording completed!"
echo "📁 GIF files are saved in: $ASSETS_DIR"
echo ""
echo "To use in README:"
echo "![Demo Description](assets/filename.gif)"
