(function () {
    const REGEX = /^https?:\/\/(.+?)\.webex\.com\/(?:recordingservice|webappng)\/sites\/([^\/]+)\/.*?([a-f0-9]{32})[^\?]*(\?.*)?/;
    const MATCH = REGEX.exec(location.href);
    if (!MATCH) return;
    const SUBDOMAIN = MATCH[1];
    const RECORDING_ID = MATCH[3];
    const AUTH_PARAMS = MATCH[4];
    var API_URL = `https://${SUBDOMAIN}.webex.com/webappng/api/v1/recordings/${RECORDING_ID}/stream`;
    var PASSWORD;

    if (AUTH_PARAMS) API_URL += AUTH_PARAMS;

    // Styles: hide native download button + download dropdown menu
    const wxppStyle = document.createElement('style');
    wxppStyle.textContent = `
.icon-mds-download_bold { display: none !important; }

.wxpp-dl-menu {
    position: fixed !important;
    background: #1e1e1e !important;
    border: 1px solid rgba(255,255,255,0.20) !important;
    border-radius: 8px !important;
    padding: 4px !important;
    z-index: 999999 !important;
    min-width: 175px !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.55) !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}
.wxpp-dl-option {
    display: block !important;
    width: 100% !important;
    padding: 9px 14px !important;
    color: rgba(255,255,255,0.88) !important;
    font-size: 13px !important;
    cursor: pointer !important;
    border-radius: 5px !important;
    box-sizing: border-box !important;
    background: transparent !important;
    border: none !important;
    text-align: left !important;
}
.wxpp-dl-option:hover { background: rgba(255,255,255,0.10) !important; }
.wxpp-dl-sep {
    display: block !important;
    margin: 3px 8px !important;
    height: 1px !important;
    background: rgba(255,255,255,0.12) !important;
}
    `;
    (document.head || document.documentElement).appendChild(wxppStyle);

    /**
     * Process a JSON-formatted response obtained from a WebEx page.
     */
    function parseParametersFromResponse(response) {
        const streamOption = response["mp4StreamOption"];

        const fallbackPlaySrc = response['fallbackPlaySrc'];
        const host            = streamOption["host"];
        const recordingDir    = streamOption["recordingDir"];
        const timestamp       = streamOption["timestamp"];
        const token           = streamOption["token"];
        const xmlName         = streamOption["xmlName"];
        const playbackOption  = streamOption["playbackOption"];
        const recordName      = response["recordName"];

        // Audio MP3 URL — present when Webex generates a separate audio track
        const audioURL = response.downloadRecordingInfo?.downloadInfo?.audioURL || null;

        return {
            host, recordingDir, timestamp, token, xmlName,
            playbackOption, recordName, fallbackPlaySrc, audioURL
        };
    }

    function sanitizeFilename(filename) {
        const allowedChars = /[^\w\s\d\-_~,;\[\]\(\).]/g;
        return filename.replaceAll(allowedChars, "_");
    }

    function sendDownload(url, savepath) {
        chrome.runtime.sendMessage({ downloadURL: url, savepath });
    }

    /**
     * Create the download button.
     * - No audio URL: clicking immediately downloads the video (original behaviour).
     * - Audio URL present: clicking opens a small dropdown to choose MP4 or MP3.
     */
    function createDownloadButton(videoURL, videoName, audioURL, audioName) {
        const i = document.createElement("i");
        i.setAttribute("title", "Download");
        i.setAttribute("tabindex", "0");
        i.setAttribute("role", "button");
        i.setAttribute("id", "playerDownload");
        i.setAttribute("aria-label", `Download recording: ${videoName}`);
        i.classList.add("icon-download", "recordingDownload");

        if (!audioURL) {
            // No audio — download video directly, same as before
            i.addEventListener("click",    () => sendDownload(videoURL, videoName));
            i.addEventListener("keypress", () => sendDownload(videoURL, videoName));
            return i;
        }

        // Build a dropdown menu appended to body (avoids clipping by parent overflow)
        const menu = document.createElement("div");
        menu.className = "wxpp-dl-menu";
        menu.style.display = "none";

        function makeOption(label, url, filename) {
            const btn = document.createElement("button");
            btn.className = "wxpp-dl-option";
            btn.textContent = label;
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                menu.style.display = "none";
                sendDownload(url, filename);
            });
            return btn;
        }

        menu.appendChild(makeOption("Download video (MP4)", videoURL, videoName));

        const sep = document.createElement("span");
        sep.className = "wxpp-dl-sep";
        menu.appendChild(sep);

        menu.appendChild(makeOption("Download audio (MP3)", audioURL, audioName));
        document.body.appendChild(menu);

        function openMenu(e) {
            e.stopPropagation();
            if (menu.style.display !== "none") {
                menu.style.display = "none";
                return;
            }
            const rect = i.getBoundingClientRect();
            menu.style.top  = (rect.bottom + 6) + "px";
            menu.style.left = (rect.left + rect.width / 2) + "px";
            menu.style.transform = "translateX(-50%)";
            menu.style.display = "block";
        }

        i.addEventListener("click",    openMenu);
        i.addEventListener("keypress", openMenu);
        document.addEventListener("click", () => { menu.style.display = "none"; });

        return i;
    }

    /**
     * Callback used by a MutationObserver object in a
     * WebEx page containing a registration to download.
     */
    function mutationCallback(_mutationArray, observer) {
        const playButtons = document.getElementsByClassName("recordingTitle");
        if (!playButtons.length) return;

        observer.disconnect();

        chrome.runtime.sendMessage(
            { fetchJson: API_URL, password: PASSWORD },
            (response) => {
                addDownloadButtonToPage(parseParametersFromResponse(response));
            }
        );
    }

    /**
     * Add the download button to the video viewer bar.
     * @param {Object} params
     */
    function addDownloadButtonToPage(params) {
        if (document.getElementById('playerDownload')) return;

        const headers = document.getElementsByClassName('recordingHeader');
        if (!headers.length) return;

        const baseName  = sanitizeFilename(params.recordName);
        const videoName = `${baseName}.mp4`;
        const audioName = `${baseName}.mp3`;

        const btn = createDownloadButton(
            params.fallbackPlaySrc, videoName,
            params.audioURL,        audioName
        );
        headers[0].appendChild(btn);
    }

    // Add a listener used to receive the password for the WebEx account
    chrome.runtime.onMessage.addListener((request) => {
        if (request.recPassword) PASSWORD = request.recPassword;
    });

    // Create an observer for the DOM
    const observer = new MutationObserver(mutationCallback);
    observer.observe(document.body, { childList: true, subtree: true });
})();
