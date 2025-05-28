#!/bin/bash

# Source the localization library
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
source "${SCRIPT_DIR}/i18n.sh"

# Set to Japanese language
set_language "ja"

# Default values
ECHOES_DIR="${SCRIPT_DIR}/../echoes"
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