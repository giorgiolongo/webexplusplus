#!/bin/bash
set -e

VERSION=$(jq -r .version manifest.json)
DIST="dist"

rm -rf "$DIST"
mkdir -p "$DIST"

FILES=(manifest.json src assets)

# Chrome
zip -r "$DIST/webexplusplus-$VERSION-chrome.zip" "${FILES[@]}" -x "*.DS_Store"
echo "Created $DIST/webexplusplus-$VERSION-chrome.zip"

# Firefox (swap manifest)
cp manifest.json manifest.json.bak
cp manifest-firefox.json manifest.json
zip -r "$DIST/webexplusplus-$VERSION-firefox.zip" "${FILES[@]}" -x "*.DS_Store"
mv manifest.json.bak manifest.json
echo "Created $DIST/webexplusplus-$VERSION-firefox.zip"
