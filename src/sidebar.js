window.addEventListener('load', () => {
    /**
     * Wait for an element matching selector to appear in the document.
     * Resolves with the element or null if timeout elapses.
     */
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve) => {
            const found = document.querySelector(selector);
            if (found) return resolve(found);

            const observer = new MutationObserver((mutations, obs) => {
                const el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

            if (timeout > 0) {
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            }
        });
    }

    // Run autohide logic only if the user enabled it in storage (default: true).
    function runAutohide() {
        // Wait up to 10s for to look for both elements
        // Use a class selector because the button is added dynamically.

        // Forcefully hides the panel as soon as the panel element is created, so it doesnt even show up
        waitForElement('wxp-panel-list', 10000).then((panel) => {
            if (!panel) {
                console.log('Webex++: panel not found after timeout');
                return;
            }
            panel.classList.add("overflow-hidden", "wxp-hidden");
            panel.setAttribute("aria-hidden", "true");
            panel.setAttribute("style", "width: 480px; margin-right: -480px;");
        });

        // Clicks the hide button so it fixes the state of the panel and it prevents the user from having to click it twice to open it back
        waitForElement('.wxp-panel-collapse-button', 10000).then((button) => {
            if (!button) {
                console.log('Webex++: collapse button not found after timeout');
                return;
            }
            try {
                // Prefer querySelector result (the wait helper returns an element already).
                button.click();
                console.log('Webex++: collapse button clicked');
            } catch (err) {
                console.error('Webex++: failed to click collapse button', err);
            }
        });
    }

    // Check storage to see if autohide is enabled. Default to true when the key is absent.
    try {
        chrome.storage.local.get('autohideSidebar', (result) => {
            const enabled = (result && result.autohideSidebar === false) ? false : true;
            if (enabled) runAutohide();
            else console.log('Webex++: autohide disabled by user setting');
        });
    } catch (e) {
        // If chrome.storage is not available for any reason, fall back to running the autohide.
        console.warn('Webex++: failed to read autohide setting, defaulting to enabled', e);
        runAutohide();
    }

    

});
