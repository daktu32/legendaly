while true; do
  effect=$(echo "beams binarypath blackhole bouncyballs bubbles burn colorshift crumble decrypt errorcorrect expand fireworks highlight laseretch matrix middleout orbittingvolley overflow pour print rain randomsequence rings scattered slice slide spotlights spray swarm sweep synthgrid unstable vhstape waves wipe" | tr ' ' '\n' | shuf -n1)
  cat legendaly.log | tte "$effect"
  sleep 5
done
