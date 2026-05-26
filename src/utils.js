(function () {
    window.wxppWait = function (selector, timeout = 20000) {
        return new Promise((resolve) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const obs = new MutationObserver((_, o) => {
                const found = document.querySelector(selector);
                if (found) { o.disconnect(); resolve(found); }
            });
            obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
            if (timeout > 0) setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
        });
    };

    window.wxppEnabled = function (key, cb) {
        try {
            chrome.storage.local.get(key, (r) => cb(r[key] !== false));
        } catch (e) {
            cb(true);
        }
    };

    // ── Shared Web Audio chain ─────────────────────────────────────────────
    // Singleton: source → gainNode → destination
    //            source → analyser  (tap for silence detection, no output)
    // Both volumeslider and silenceskip share this chain so only one
    // MediaElementSource is ever created per video element.
    window._wxppAudioSingleton = (function () {
        let chain   = null;
        const waiters = [];

        return {
            /** Initialise the chain (idempotent). Call from a user-gesture handler. */
            init(video) {
                if (chain) return chain;
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const source   = audioCtx.createMediaElementSource(video);
                    const gainNode = audioCtx.createGain();
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 512;
                    analyser.smoothingTimeConstant = 0.1;

                    // Volume path: source → gainNode → output
                    source.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    // Analysis tap: source → analyser (reads raw signal, no output)
                    source.connect(analyser);

                    video.muted  = false;
                    video.volume = 1;

                    chain = { audioCtx, source, gainNode, analyser };
                    waiters.splice(0).forEach(fn => fn(chain));
                    return chain;
                } catch (e) {
                    console.warn('Webex++: Web Audio init failed', e);
                    return null;
                }
            },
            /** Register a callback fired once the chain is (or becomes) ready. */
            whenReady(fn) {
                if (chain) fn(chain);
                else waiters.push(fn);
            },
            get() { return chain; },
        };
    })();
})();
