(function () {
    const KEY = 'showEstimatedEnd';

    function pad2(n) { return String(Math.floor(n)).padStart(2, '0'); }

    function formatRemaining(secs) {
        secs = Math.max(0, Math.round(secs));
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
    }

    async function init() {
        const video = await wxppWait('video');
        if (!video) return;

        await wxppWait('wxp-time-display');

        // Match the existing <div> children — font/color inherited automatically
        const label = document.createElement('div');
        label.id = 'wxpp-endtime-label';
        label.style.marginLeft = '5px'; // same gap the " / " separator uses on each side

        function updateLabel() {
            if (!video.duration || !isFinite(video.duration)) { label.textContent = ''; return; }
            let rate = video.dataset.wxppBaseRate ? parseFloat(video.dataset.wxppBaseRate) : (video.playbackRate || 1);
            const remaining = (video.duration - video.currentTime) / rate;
            if (remaining < 0) { label.textContent = ''; return; }
            label.textContent = `(-${formatRemaining(remaining)})`;
        }

        video.addEventListener('timeupdate', updateLabel);
        video.addEventListener('ratechange', updateLabel);
        video.addEventListener('seeking',    updateLabel);
        video.addEventListener('wxpp-baserate-changed', updateLabel);

        function inject() {
            if (label.isConnected) return;
            const td = document.querySelector('wxp-time-display');
            // Wait until the component has rebuilt its own 3 children before appending
            if (!td || td.children.length < 3) return;
            td.append(label);
            updateLabel();
        }

        inject();

        // Re-inject whenever Webex rebuilds the component's children
        const obs = new MutationObserver(() => { if (!label.isConnected) inject(); });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    wxppEnabled(KEY, (enabled) => {
        if (enabled) window.addEventListener('load', init);
    });
})();
