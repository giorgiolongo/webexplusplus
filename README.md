# Webex Player Addons

A Manifest V3 Chromium/Firefox extension that enhances the Webex recording player.

## Features

### Playback controls
- **Speed slider** — replaces the native speed button with a vertical popup slider (0.5×–3×, steps of 0.25×). Tick marks at 1×, 2×, 3×.
- **Volume slider** — replaces the native volume button with a vertical popup slider (0–200%, snapping to multiples of 25%). Values above 100% amplify the audio beyond the browser's native limit using the Web Audio API. Speaker icon reflects the current level; turns red and shows a slash when muted. A tick mark at 100% visually separates normal volume from the amplification range.
- **Zoom slider** — adds a magnifying-glass button that opens a popup with a 16:9 minimap and a horizontal zoom slider (1×–2×, steps of 0.1×). The minimap shows the full video as a gray rectangle; a blue rectangle represents the currently visible portion and can be dragged to pan anywhere within the video. Tick marks at 1×, 1.5×, 2×. The zoomed video stays clipped within the player canvas.
- **Silence skip** — adds a toggle button that opens a popup panel to configure silence skipping. When enabled, the player automatically increases the playback speed (2×–16×) when silence is detected, and restores it when speech resumes. Configurable parameters include silence speed, volume threshold (%), and attack delay (seconds).
- **Keyboard shortcuts** — `Space` toggles play/pause; `↑` / `↓` increase or decrease playback speed by 0.25×.
- The speed, volume, zoom, silence skip, and options popups are mutually exclusive — opening one closes the others.

### UI
- **Hide useless elements** *(on by default)* — hides the sidebar on load and removes the follow-speaker button.
- **Persist speed, volume & zoom** *(on by default)* — restores your last speed, volume, and zoom settings every time you open a recording.
- **Estimated end time** *(on by default)* — shows a live countdown next to the time display indicating how much real-world time is left at the current playback speed.

### Download
- Adds a download button to the recording page, powered by [jacopo-j's WebXDownloader](https://github.com/jacopo-j/WebXDownloader).

## Settings

Click the gear icon in the Webex player toolbar to open the options popup. Three toggles are available:

| Setting | Default | Description |
|---|---|---|
| Hide useless elements | On | Hides the sidebar and follow-speaker control |
| Remember speed and volume | On | Persists speed, volume, and zoom across sessions |
| Show estimated end time | On | Shows a live countdown of real-world time remaining at the current speed |

## Installation

### Chromium (Chrome, Edge, Brave, …)

1. Download the `.zip` from the [latest release](https://github.com/giorgiolongo/webexplayeraddons/releases) and extract it, **or** clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extracted folder.

### Firefox (128+)

1. Download and extract the `.zip`, or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select any file inside the extracted folder (e.g. `manifest-firefox.json`).

> The extension stays active until Firefox is closed. To make it permanent, the extension must be signed by Mozilla — submit it to [AMO](https://addons.mozilla.org/developers/) or use Firefox Developer Edition / Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.
