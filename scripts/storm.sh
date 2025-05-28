#!/usr/bin/env zsh

function adjust_left_margin_based_on_content() {
  local lines=()
  local maxlen=0
  while IFS= read -r line; do
    lines+=("$line")
    (( ${#line} > maxlen )) && maxlen=${#line}
  done
  local padding=$(( (COLUMNS - maxlen) / 3 ))
  (( padding < 0 )) && padding=0
  for line in "${lines[@]}"; do
    printf "%*s%s\n" $padding "" "$line"
  done
}

typeset -a effects=(
  beams binarypath blackhole bouncyballs bubbles burn colorshift crumble decrypt
  errorcorrect expand fireworks highlight laseretch matrix middleout orbittingvolley
  overflow pour print rain randomsequence rings scattered slice slide spotlights
  spray swarm sweep synthgrid unstable vhstape waves wipe
)

# 霧散演出用エフェクト
typeset -a dissolve_effects=(crumble scatter spray swarm burn)

# 前回の出力保持用
prev_output=""

while true; do
  # 前回のテキストを「霧散」エフェクトで消す（あれば）
#   if [[ -n "$prev_output" ]]; then
#     echo "$prev_output" | tte --canvas-width 0 --canvas-height 0 --wrap-text --anchor-canvas c "${dissolve_effects[RANDOM % ${#dissolve_effects[@]} + 1]}"
#     sleep 0.5
#   fi

  clear

  # 新しいエフェクトを選んで表示
  effect=${effects[RANDOM % ${#effects[@]} + 1]}

  # 表示内容を生成して一時保存（再利用のため）
  raw_output=$(sh "${0:A:h}"/quotes.sh | shuf | column -s '|' -t)
  processed_output=$(echo "$raw_output" | adjust_left_margin_based_on_content)
  echo "$processed_output" | tte --canvas-width 0 --canvas-height 0 --wrap-text --anchor-canvas c "$effect"

  # 次回に備えて保存
  prev_output="$processed_output"

  sleep 5
done