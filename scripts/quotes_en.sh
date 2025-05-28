#!/bin/bash

# Source the localization library
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
source "${SCRIPT_DIR}/i18n.sh"

# Set to English language
set_language "en"

# Default values
ECHOES_DIR="echoes"
SPECIFIC_FILE=""
TONE_FILTER=""
LANG_FILTER=""
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--directory)
      ECHOES_DIR="$2"
      shift 2
      ;;
    -f|--file)
      SPECIFIC_FILE="$2"
      shift 2
      ;;
    -t|--tone)
      TONE_FILTER="$2"
      shift 2
      ;;
    -l|--lang)
      LANG_FILTER="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      show_usage "$(basename "$0")"
      ;;
    *)
      echo "$(t unknown_option): $1"
      show_usage "$(basename "$0")"
      ;;
  esac
done

# File processing function
process_file() {
  local file="$1"
  local output_quotes=false
  local quotes=()
  
  if [[ -f "$file" ]]; then
    if $VERBOSE; then
      echo "Processing: $file"
      echo "-------------------------------------------"
      output_quotes=true
    fi
    
    # Extract year, speaker, and quote from logs
    while IFS= read -r line; do
      # Extract year [YYYY]
      year=$(echo "$line" | grep -o '\[[0-9]\+\]' | head -1 | tr -d '[]')
      
      # Extract speaker (text before 『』)
      speaker=$(echo "$line" | sed -E 's/\[[0-9]+\][[:space:]]*//' | grep -o '^[^『]*' | sed 's/ *$//')
      
      # Extract quote 「quote」
      quote=$(echo "$line" | grep -o '「[^」]*」' | tr -d '「」')
      
      # Filter by tone and language
      if [[ -n "$TONE_FILTER" ]] && ! echo "$line" | grep -q "tone: $TONE_FILTER"; then
        continue
      fi
      
      if [[ -n "$LANG_FILTER" ]] && ! echo "$line" | grep -q "lang: $LANG_FILTER"; then
        continue
      fi
      
      # Output results (year, speaker, quote)
      if [[ -n "$year" && -n "$speaker" && -n "$quote" ]]; then
        if $output_quotes; then
          echo "$year | $speaker | $quote"
        else
          quotes+=("$year | $speaker | $quote")
        fi
      fi
    done < "$file"
    
    if $VERBOSE; then
      echo "-------------------------------------------"
      echo ""
    fi
    
    # If not in verbose mode, return all quotes from array
    if ! $output_quotes; then
      for q in "${quotes[@]}"; do
        echo "$q"
      done
    fi
  else
    echo "Error: File '$file' not found"
  fi
}

# Main processing
if [[ -n "$SPECIFIC_FILE" ]]; then
  # Process a specific file
  process_file "$SPECIFIC_FILE"
else
  # Process all .echoes files in the directory
  if [[ ! -d "$ECHOES_DIR" ]]; then
    echo "$(t error_dir_not_found): '$ECHOES_DIR'"
    exit 1
  fi
  
  # Filter by tone and language in filenames
  if [[ -n "$TONE_FILTER" && -n "$LANG_FILTER" ]]; then
    files=$(find "$ECHOES_DIR" -name "*-${TONE_FILTER}-${LANG_FILTER}.echoes" -type f | sort)
  elif [[ -n "$TONE_FILTER" ]]; then
    files=$(find "$ECHOES_DIR" -name "*-${TONE_FILTER}-*.echoes" -type f | sort)
  elif [[ -n "$LANG_FILTER" ]]; then
    files=$(find "$ECHOES_DIR" -name "*-*-${LANG_FILTER}.echoes" -type f | sort)
  else
    files=$(find "$ECHOES_DIR" -name "*.echoes" -type f | sort)
  fi
  
  if [[ -z "$files" ]]; then
    echo "$(t no_matching_files)"
    exit 1
  fi
  
  # Call process_all_files with proper parameter
  # shellcheck disable=SC2086
  process_all_files "$files"
fi 