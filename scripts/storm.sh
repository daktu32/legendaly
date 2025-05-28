#!/usr/bin/env zsh

# ===== 左余白を調整する関数 =====
function adjust_left_margin_based_on_content() {
  local lines=()
  local maxlen=0

  while IFS= read -r line; do
    lines+=("$line")
    (( ${#line} > maxlen )) && maxlen=${#line}
  done

  local padding=$(( (COLUMNS - maxlen) / 3 ))  # 中央寄せなら /2、自然さ重視なら /3
  (( padding < 0 )) && padding=0

  for line in "${lines[@]}"; do
    printf "%*s%s\n" $padding "" "$line"
  done
}

# ===== tte エフェクト一覧 =====
typeset -a effects=(
  beams binarypath blackhole bouncyballs bubbles burn colorshift crumble decrypt
  errorcorrect expand fireworks highlight laseretch matrix middleout orbittingvolley
  overflow pour print rain randomsequence rings scattered slice slide spotlights
  spray swarm sweep synthgrid unstable vhstape waves wipe
)

# ===== メインループ =====
while true; do
  clear
  effect=${effects[RANDOM % ${#effects[@]} + 1]}

  # 名言を取得 → シャッフル → 整形 → 左余白調整 → tte 表示
  sh "${0:A:h}"/quotes.sh | shuf | column -s '|' -t | \
    adjust_left_margin_based_on_content | \
    tte --canvas-width 0 --canvas-height 0 --wrap-text --anchor-canvas c "$effect"

  sleep 5
done