#!/bin/bash
INT="eDP-1"
DELL="DP-6"
DELL="$(xrandr | grep DP | awk '{print $1}' | tail -n1)"
if ! xrandr | grep "^$DELL connected" > /dev/null; then
    echo "DELL monitor ($DELL) not detected. Find with 'xrandr'."
    exit 1
fi
POS=$(xrandr --query | grep "^$DELL " | grep -oP '\d+x\d+\+\d+\+\d+' | cut -d'+' -f2-3)
if [ "$POS" == "0+0" ]; then
    kscreen-doctor output.$DELL.position.1600,0
    echo "Switched DELL monitor to extended mode"
else
    kscreen-doctor output.$DELL.position.0,0
    echo "Switched DELL monitor to duplicate/mirror mode"
fi
