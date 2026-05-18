# Webex++

A Manifest V3 Chromium extension that enhances the Webex recording player.

## Features

### Playback controls
- **Speed slider** — replaces the native speed button with a vertical popup slider (0.5×–3×, steps of 0.25×). Tick marks at 1×, 2×, 3×.
- **Volume slider** — replaces the native volume button with a vertical popup slider that snaps to 0 / 25 / 50 / 75 / 100%. Speaker icon reflects the current level; turns red and shows a slash when muted.
- **Zoom slider** — adds a magnifying-glass button that opens a vertical popup slider to zoom the video in (1×–3×, continuous). The zoomed video stays clipped within the player canvas.
- **Keyboard shortcuts** — `Space` toggles play/pause; `↑` / `↓` increase or decrease playback speed by 0.25×.
- The speed, volume, and zoom popups are mutually exclusive — opening one closes the others.

### UI
- **Hide useless elements** *(on by default)* — hides the sidebar on load and removes the follow-speaker button.
- **Persist speed & volume** *(on by default)* — restores your last speed and volume settings every time you open a recording.

### Download
- Adds a download button to the recording page, powered by [jacopo-j's WebXDownloader](https://github.com/jacopo-j/WebXDownloader).

## Settings

Click the extension icon to open the popup. Two toggles are available:

| Setting | Default | Description |
|---|---|---|
| Hide useless elements | On | Hides the sidebar and follow-speaker control |
| Remember speed and volume | On | Persists speed and volume across sessions |

## Installation

### Chromium (Chrome, Edge, Brave, …)

1. Download the `.zip` from the [latest release](https://github.com/giorgiolongo/webexplusplus/releases) and extract it, **or** clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extracted folder.

### Firefox (128+)

1. Download and extract the `.zip`, or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select any file inside the extracted folder (e.g. `manifest.json`).

> The extension stays active until Firefox is closed. To make it permanent, the extension must be signed by Mozilla — submit it to [AMO](https://addons.mozilla.org/developers/) or use Firefox Developer Edition / Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.
