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
})();
