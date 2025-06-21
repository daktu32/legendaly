#!/bin/bash

# Quick recording script for Legendaly demos
# Usage: ./quick_record.sh [output_name] [duration] [env_vars...]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"

# Default values
OUTPUT_NAME="${1:-demo_$(date +%Y%m%d_%H%M%S)}"
DURATION="${2:-15}"
shift 2 2>/dev/null || shift $# 2>/dev/null || true
ENV_VARS="$*"

echo "🎬 Quick Recording Setup"
echo "📝 Output: ${OUTPUT_NAME}.gif"
echo "⏱️  Duration: ${DURATION} seconds"
echo "⚙️  Environment: ${ENV_VARS:-"(default)"}"
echo ""

# Create assets directory
mkdir -p "$ASSETS_DIR"

cd "$PROJECT_DIR"

# Prepare files
CAST_FILE="$ASSETS_DIR/${OUTPUT_NAME}.cast"
GIF_FILE="$ASSETS_DIR/${OUTPUT_NAME}.gif"

echo "🔴 Recording will start in 3 seconds..."
sleep 1
echo "🔴 Recording will start in 2 seconds..."
sleep 1
echo "🔴 Recording will start in 1 second..."
sleep 1
echo "🎥 Recording started!"

# Record with asciinema
if [ -n "$ENV_VARS" ]; then
    asciinema rec "$CAST_FILE" --overwrite --command "bash -c 'env $ENV_VARS timeout ${DURATION}s node legendaly.js || echo \"Recording completed\"'"
else
    asciinema rec "$CAST_FILE" --overwrite --command "bash -c 'timeout ${DURATION}s node legendaly.js || echo \"Recording completed\"'"
fi

echo ""
echo "🔄 Converting to GIF..."

# Convert to GIF with optimized settings
agg \
    --theme monokai \
    --font-size 14 \
    --cols 100 \
    --rows 25 \
    --speed 1.0 \
    "$CAST_FILE" \
    "$GIF_FILE"

# Clean up
rm "$CAST_FILE"

echo "✅ GIF created: $GIF_FILE"
echo "📏 File size: $(du -h "$GIF_FILE" | cut -f1)"
echo ""
echo "To use in README:"
echo "![Demo](assets/${OUTPUT_NAME}.gif)"
