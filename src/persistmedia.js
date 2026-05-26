(function () {
    const KEY_SPEED = 'savedSpeed';
    // NOTE: volume is persisted independently by volumeslider.js (KEY_GAIN / savedVolumeGain)

    let saveTimer = null;
    function debounceSave(data) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => chrome.storage.local.set(data), 600);
    }

    async function init() {
        const video = await wxppWait('video');
        if (!video) return;

        function applySettings() {
            chrome.storage.local.get([KEY_SPEED], function(result) {
                if (result[KEY_SPEED] === undefined) return;
                var rate = result[KEY_SPEED];
                video.playbackRate = rate;
                video.dataset.wxppBaseRate = rate;
                // Wait for speedslider to be injected before dispatching the UI-update event
                wxppWait('.wxpp-speed-btn', 5000).then(function() {
                    video.dispatchEvent(new CustomEvent('wxpp-baserate-changed', { detail: rate }));
                });
            });
        }

        if (video.readyState >= 3) {
            setTimeout(applySettings, 0);
        } else {
            video.addEventListener('canplay', () => setTimeout(applySettings, 0), { once: true });
        }

        video.addEventListener('ratechange', function() {
            // Ignore ratechange events caused by silence-skip (use the user's base rate instead)
            if (video.dataset.wxppSkipping === 'true') return;
            var rateToSave = video.dataset.wxppBaseRate
                ? parseFloat(video.dataset.wxppBaseRate)
                : video.playbackRate;
            debounceSave({ [KEY_SPEED]: rateToSave });
        });
    }

    wxppEnabled('persistMediaSettings', (enabled) => {
        if (enabled) window.addEventListener('load', init);
    });
})();
