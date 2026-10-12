#!/bin/bash
# Build BLACKLINE.app (Apple Silicon) from the stock Electron runtime + the game in docs/index.html.
# Run on a Mac from the repo folder:   bash mac/build-mac-app.sh
# Output: mac/out/BLACKLINE.app and mac/out/BLACKLINE-mac.zip
set -euo pipefail
cd "$(dirname "$0")"
EV=44.5.0
mkdir -p out && cd out
[ -f electron.zip ] || curl -L --fail -o electron.zip "https://github.com/electron/electron/releases/download/v$EV/electron-v$EV-darwin-arm64.zip"
rm -rf Electron.app BLACKLINE.app && ditto -xk electron.zip . && mv Electron.app BLACKLINE.app
R=BLACKLINE.app/Contents/Resources
rm -f "$R/default_app.asar"; mkdir -p "$R/app"
cp ../main.js ../package.json "$R/app/"; cp ../../docs/index.html "$R/app/index.html"; cp ../icon.icns "$R/electron.icns"
P=BLACKLINE.app/Contents/Info.plist
plutil -replace CFBundleName -string BLACKLINE "$P"
plutil -replace CFBundleDisplayName -string "BLACKLINE: LAST HOUR" "$P"
plutil -replace CFBundleIdentifier -string com.blackline.lasthour "$P"
plutil -replace CFBundleShortVersionString -string 2.0.0 "$P"
plutil -replace CFBundleVersion -string 2.0.0 "$P"
plutil -remove ElectronAsarIntegrity "$P" 2>/dev/null || true
codesign --force --deep --sign - BLACKLINE.app
rm -f BLACKLINE-mac.zip && ditto -c -k --keepParent BLACKLINE.app BLACKLINE-mac.zip
echo "Built $(pwd)/BLACKLINE.app and BLACKLINE-mac.zip"
