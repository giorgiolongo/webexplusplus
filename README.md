# Webex++

A Manifest V3 Chromium/Firefox extension that enhances the Webex recording player.

## Features

### Playback controls
- **Speed slider** — replaces the native speed button with a vertical popup slider (0.5×–3×, steps of 0.25×). Tick marks at 1×, 2×, 3×.
- **Volume slider** — replaces the native volume button with a vertical popup slider that snaps to 0 / 25 / 50 / 75 / 100%. Speaker icon reflects the current level; turns red and shows a slash when muted.
- **Zoom slider** — adds a magnifying-glass button that opens a vertical popup slider to zoom the video in (1×–2×, steps of 0.1×). Tick marks at 1×, 1.5×, 2×. The zoomed video stays clipped within the player canvas.
- **Keyboard shortcuts** — `Space` toggles play/pause; `↑` / `↓` increase or decrease playback speed by 0.25×.
- The speed, volume, and zoom popups are mutually exclusive — opening one closes the others.

### UI
- **Hide useless elements** *(on by default)* — hides the sidebar on load and removes the follow-speaker button.
- **Persist speed, volume & zoom** *(on by default)* — restores your last speed, volume, and zoom settings every time you open a recording.
- **Estimated end time** *(on by default)* — shows a live countdown next to the time display indicating how much real-world time is left at the current playback speed.

### Download
- Adds a download button to the recording page, powered by [jacopo-j's WebXDownloader](https://github.com/jacopo-j/WebXDownloader).

## Settings

Click the extension icon to open the popup. Three toggles are available:

| Setting | Default | Description |
|---|---|---|
| Hide useless elements | On | Hides the sidebar and follow-speaker control |
| Remember speed and volume | On | Persists speed, volume, and zoom across sessions |
| Show estimated end time | On | Shows a live countdown of real-world time remaining at the current speed |

## Installation

### Chromium (Chrome, Edge, Brave, …)

1. Download the `.zip` from the [latest release](https://github.com/giorgiolongo/webexplusplus/releases) and extract it, **or** clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extracted folder.

### Firefox (128+)

1. Download and extract the `.zip`, or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select any file inside the extracted folder (e.g. `manifest-firefox.json`).

> The extension stays active until Firefox is closed. To make it permanent, the extension must be signed by Mozilla — submit it to [AMO](https://addons.mozilla.org/developers/) or use Firefox Developer Edition / Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.

## Changelog

### v2.2.0
- **New**: estimated end time — live countdown displayed next to the time bar, accounting for current playback speed
- **Zoom**: max zoom reduced to 2×; tick marks updated to 1×, 1.5×, 2×; zoom level is now persisted across sessions (requires "Remember speed and volume" to be on)
- **Volume**: debounced `volumechange` handler to avoid flicker; slider now syncs correctly to the current level when the panel is opened
- **Download**: `downloadenabler.js` wrapped in an IIFE and uses a non-global regex; returns early if the URL does not match the expected pattern
- **Manifest**: GitHub API URL moved from `permissions` to `host_permissions` for cleaner MV3 compliance
- Added `manifest-firefox.json` and `package.sh` for Firefox packaging

### v2.1.0
- Zoom slider — continuous video zoom clipped to player canvas

### v2.0.0
- Custom speed & volume sliders, keyboard shortcuts, persistent settings
