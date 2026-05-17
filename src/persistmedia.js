(function () {
    const KEY_SPEED  = 'savedSpeed';
    const KEY_VOLUME = 'savedVolume';

    let saveTimer = null;
    function debounceSave(data) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => chrome.storage.local.set(data), 600);
    }

    async function init() {
        const video = await wxppWait('video');
        if (!video) return;

        function applySettings() {
            chrome.storage.local.get([KEY_SPEED, KEY_VOLUME], (result) => {
                if (result[KEY_SPEED]  !== undefined) video.playbackRate = result[KEY_SPEED];
                if (result[KEY_VOLUME] !== undefined) video.volume       = result[KEY_VOLUME];
            });
        }

        if (video.readyState >= 3) {
            setTimeout(applySettings, 0);
        } else {
            video.addEventListener('canplay', () => setTimeout(applySettings, 0), { once: true });
        }

        video.addEventListener('ratechange',   () => debounceSave({ [KEY_SPEED]:  video.playbackRate }));
        video.addEventListener('volumechange', () => debounceSave({ [KEY_VOLUME]: video.volume }));
    }

    wxppEnabled('persistMediaSettings', (enabled) => {
        if (enabled) window.addEventListener('load', init);
    });
})();
