#!/bin/bash
current=$(brightnessctl -m | cut -d, -f4 | tr -d '%')

if [ "$current" -gt 1 ]; then
    brightnessctl set 1%
else
    brightnessctl set 60%
fi
