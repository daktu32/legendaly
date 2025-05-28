#!/bin/bash

# i18n.sh - Localization library for legendaly scripts

# Available languages
AVAILABLE_LANGS=("ja" "en")
CURRENT_LANG="en"  # Default language

# Set language
set_language() {
  local lang="$1"
  if [[ " ${AVAILABLE_LANGS[@]} " =~ " ${lang} " ]]; then
    CURRENT_LANG="$lang"
    return 0
  else
    echo "Unsupported language: $lang" >&2
    return 1
  fi
}

# Detect language from system locale
detect_language() {
  local sys_lang=$(locale | grep LANG= | cut -d= -f2 | cut -d_ -f1)
  if [[ " ${AVAILABLE_LANGS[@]} " =~ " ${sys_lang} " ]]; then
    CURRENT_LANG="$sys_lang"
  fi
}

# Get translation
t() {
  local key="$1"
  
  case "$CURRENT_LANG" in
    "ja")
      case "$key" in
        "usage") echo "使用方法" ;;
        "options") echo "options" ;;
        "directory_desc") echo "指定したディレクトリ内のすべての.echoesファイルを処理 (デフォルト: echoes/)" ;;
        "file_desc") echo "特定のログファイルのみを処理" ;;
        "tone_desc") echo "指定したトーンのログのみを抽出" ;;
        "lang_desc") echo "指定した言語のログのみを抽出" ;;
        "verbose_desc") echo "各ファイル名と詳細を表示" ;;
        "help_desc") echo "このヘルプメッセージを表示" ;;
        "examples") echo "例" ;;
        "process_all") echo "echoesディレクトリのすべてのログを処理" ;;
        "process_file") echo "特定のファイルを処理" ;;
        "extract_tone") echo "指定したトーンのログのみを抽出" ;;
        "extract_lang") echo "指定した言語のログのみを抽出" ;;
        "show_details") echo "各ファイル名と詳細を表示" ;;
        "unknown_option") echo "不明なオプション" ;;
        "processing") echo "処理中" ;;
        "error_file_not_found") echo "エラー: ファイルが見つかりません" ;;
        "error_dir_not_found") echo "エラー: ディレクトリが見つかりません" ;;
        "no_matching_files") echo "該当するログファイルが見つかりません" ;;
        *)
          echo "未翻訳: $key" >&2
          echo "$key"
          ;;
      esac
      ;;
    "en"|*)
      case "$key" in
        "usage") echo "Usage" ;;
        "options") echo "Options" ;;
        "directory_desc") echo "Process all .echoes files in the specified directory (default: echoes/)" ;;
        "file_desc") echo "Process only the specified log file" ;;
        "tone_desc") echo "Extract logs only for the specified tone" ;;
        "lang_desc") echo "Extract logs only for the specified language" ;;
        "verbose_desc") echo "Show file names and details for each file" ;;
        "help_desc") echo "Display this help message" ;;
        "examples") echo "Examples" ;;
        "process_all") echo "Process all logs in the echoes directory" ;;
        "process_file") echo "Process a specific file" ;;
        "extract_tone") echo "Extract only specified tone logs" ;;
        "extract_lang") echo "Extract only specified language logs" ;;
        "show_details") echo "Show file names and details for each file" ;;
        "unknown_option") echo "Unknown option" ;;
        "processing") echo "Processing" ;;
        "error_file_not_found") echo "Error: File not found" ;;
        "error_dir_not_found") echo "Error: Directory not found" ;;
        "no_matching_files") echo "No matching log files found" ;;
        *)
          echo "Untranslated: $key" >&2
          echo "$key"
          ;;
      esac
      ;;
  esac
}

# Common functions

# Extract quotes from a file
extract_quotes_from_file() {
  local file="$1"
  local quotes=()
  
  if [[ -f "$file" ]]; then
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
        echo "$year | $speaker | $quote"
      fi
    done < "$file"
  else
    echo "$(t error_file_not_found): '$file'" >&2
    return 1
  fi
}

# File processing function with formatted output
process_file() {
  local file="$1"
  
  if [[ -f "$file" ]]; then
    if $VERBOSE; then
      echo "$(t processing): $file"
      echo "-------------------------------------------"
    fi
    
    # Get all quotes from file
    extract_quotes_from_file "$file"
    
    if $VERBOSE; then
      echo "-------------------------------------------"
      echo ""
    fi
  else
    echo "$(t error_file_not_found): '$file'"
  fi
}

# Process all files
process_all_files() {
  local files=$1
  
  # In verbose mode, show details file by file, otherwise show all quotes together
  if ! $VERBOSE; then
    for file in $files; do
      # Extract quotes without headers
      extract_quotes_from_file "$file"
    done
  else
    # In verbose mode, process each file separately
    for file in $files; do
      process_file "$file"
    done
  fi
}

# Show usage help
show_usage() {
  local script_name="$1"
  
  echo "$(t usage): $script_name [options] [file]"
  echo "$(t options):"
  echo "  -d, --directory DIR  $(t directory_desc)"
  echo "  -f, --file FILE      $(t file_desc)"
  echo "  -t, --tone TONE      $(t tone_desc)"
  echo "  -l, --lang LANG      $(t lang_desc)"
  echo "  -v, --verbose        $(t verbose_desc)"
  echo "  -h, --help           $(t help_desc)"
  echo ""
  echo "$(t examples):"
  echo "  $script_name                           # $(t process_all)"
  echo "  $script_name -f echoes/20230620153045123-epic-ja.echoes  # $(t process_file)"
  echo "  $script_name -t cyberpunk              # $(t extract_tone)"
  echo "  $script_name -l en                     # $(t extract_lang)"
  echo "  $script_name -v                        # $(t show_details)"
  exit 1
}

# Detect system language at script initialization
detect_language 