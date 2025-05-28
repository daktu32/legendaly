#!/usr/bin/env zsh

while true; do
  clear

  # エフェクトをランダムに選択
  effects=(
    beams binarypath blackhole bouncyballs bubbles burn colorshift crumble decrypt
    errorcorrect expand fireworks highlight laseretch matrix middleout orbittingvolley
    overflow pour print rain randomsequence rings scattered slice slide spotlights
    spray swarm sweep synthgrid unstable vhstape waves wipe
  )
  effect=${effects[RANDOM % ${#effects[@]} + 1]}

  # 名言を取得・シャッフル → 縦横センタリング → tte に渡す
  sh "${0:A:h}"/quotes.sh | shuf | column -s '|' -t | tte "$effect"

  sleep 5
done