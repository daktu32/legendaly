#!/bin/bash

# Usage message
usage() {
  echo "Usage: $0 [options] [file]"
  echo "Options:"
  echo "  -d, --directory DIR  Process all .echoes files in the specified directory (default: echoes/)"
  echo "  -f, --file FILE      Process only the specified log file"
  echo "  -t, --tone TONE      Extract logs only for the specified tone"
  echo "  -l, --lang LANG      Extract logs only for the specified language"
  echo "  -v, --verbose        Show file names and details for each file"
  echo "  -h, --help           Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0                           # Process all logs in the echoes directory"
  echo "  $0 -f echoes/20230620153045123-epic-ja.echoes  # Process a specific file"
  echo "  $0 -t cyberpunk              # Extract only cyberpunk tone logs"
  echo "  $0 -l en                     # Extract only English logs"
  echo "  $0 -v                        # Show file names and details for each file"
  exit 1
}

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
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
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
      fi
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
    echo "Error: Directory '$ECHOES_DIR' not found"
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
    echo "No matching log files found"
    exit 1
  fi
  
  # In verbose mode, show details file by file, otherwise show all quotes together
  if ! $VERBOSE; then
    all_quotes=()
    
    for file in $files; do
      # Use a temporary file to get quotes from each file
      temp_file=$(mktemp)
      process_file "$file" > "$temp_file"
      while IFS= read -r line; do
        all_quotes+=("$line")
      done < "$temp_file"
      rm "$temp_file"
    done
    
    # Display all quotes sorted
    for quote in "${all_quotes[@]}"; do
      echo "$quote"
    done
  else
    for file in $files; do
      process_file "$file"
    done
  fi
fi 