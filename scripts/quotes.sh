#!/bin/bash

# 使用方法メッセージ
usage() {
  echo "使用方法: $0 [options] [file]"
  echo "options:"
  echo "  -d, --directory DIR  指定したディレクトリ内のすべての.echoesファイルを処理 (デフォルト: echoes/)"
  echo "  -f, --file FILE      特定のログファイルのみを処理"
  echo "  -t, --tone TONE      指定したトーンのログのみを抽出"
  echo "  -l, --lang LANG      指定した言語のログのみを抽出"
  echo "  -v, --verbose        各ファイル名と詳細を表示"
  echo "  -h, --help           このヘルプメッセージを表示"
  echo ""
  echo "例:"
  echo "  $0                           # echoesディレクトリのすべてのログを処理"
  echo "  $0 -f echoes/20230620153045123-epic-ja.echoes  # 特定のファイルを処理"
  echo "  $0 -t cyberpunk              # cyberpunkトーンのログのみを抽出"
  echo "  $0 -l en                     # 英語のログのみを抽出"
  echo "  $0 -v                        # 各ファイル名と詳細を表示"
  exit 1
}

# デフォルト値
ECHOES_DIR="echoes"
SPECIFIC_FILE=""
TONE_FILTER=""
LANG_FILTER=""
VERBOSE=false

# 引数解析
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
      echo "不明なオプション: $1"
      usage
      ;;
  esac
done

# ファイル処理関数
process_file() {
  local file="$1"
  local output_quotes=false
  local quotes=()
  
  if [[ -f "$file" ]]; then
    if $VERBOSE; then
      echo "処理中: $file"
      echo "-------------------------------------------"
      output_quotes=true
    fi
    
    # ログから年・発言者・名言を抽出
    while IFS= read -r line; do
      # 年の抽出 [YYYY]
      year=$(echo "$line" | grep -o '\[[0-9]\+\]' | head -1 | tr -d '[]')
      
      # 発言者の抽出（『』の前の部分を取得）
      speaker=$(echo "$line" | sed -E 's/\[[0-9]+\][[:space:]]*//' | grep -o '^[^『]*' | sed 's/ *$//')
      
      # 名言の抽出 「名言」
      quote=$(echo "$line" | grep -o '「[^」]*」' | tr -d '「」')
      
      # トーンと言語のフィルタリング
      if [[ -n "$TONE_FILTER" ]] && ! echo "$line" | grep -q "tone: $TONE_FILTER"; then
        continue
      fi
      
      if [[ -n "$LANG_FILTER" ]] && ! echo "$line" | grep -q "lang: $LANG_FILTER"; then
        continue
      fi
      
      # 結果出力（年、発言者、名言）
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
    
    # verboseモードでない場合は、配列からすべての引用を返す
    if ! $output_quotes; then
      for q in "${quotes[@]}"; do
        echo "$q"
      done
    fi
  else
    echo "エラー: ファイル '$file' が見つかりません"
  fi
}

# メイン処理
if [[ -n "$SPECIFIC_FILE" ]]; then
  # 特定のファイルを処理
  process_file "$SPECIFIC_FILE"
else
  # ディレクトリ内のすべての.echoesファイルを処理
  if [[ ! -d "$ECHOES_DIR" ]]; then
    echo "エラー: ディレクトリ '$ECHOES_DIR' が見つかりません"
    exit 1
  fi
  
  # トーンフィルタがある場合はファイル名でフィルタリング
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
    echo "該当するログファイルが見つかりません"
    exit 1
  fi
  
  # verboseモードの場合は各ファイルごとに詳細を表示、そうでない場合はすべての引用をまとめて表示
  if ! $VERBOSE; then
    all_quotes=()
    
    for file in $files; do
      # 一時ファイルを使って各ファイルからの引用を取得
      temp_file=$(mktemp)
      process_file "$file" > "$temp_file"
      while IFS= read -r line; do
        all_quotes+=("$line")
      done < "$temp_file"
      rm "$temp_file"
    done
    
    # すべての引用をソートして表示
    for quote in "${all_quotes[@]}"; do
      echo "$quote"
    done
  else
    for file in $files; do
      process_file "$file"
    done
  fi
fi 