(function () {
    const HIDDEN_SELECTORS = ['wxp-follow-speaker-control'];

    function hideButtons() {
        HIDDEN_SELECTORS.forEach(sel =>
            document.querySelectorAll(sel).forEach(el =>
                el.style.setProperty('display', 'none', 'important')
            )
        );
    }

    function run() {
        hideButtons();
        new MutationObserver(hideButtons).observe(document.body, { childList: true, subtree: true });
    }

    wxppEnabled('hideUselessElements', (enabled) => {
        if (enabled) wxppWait(HIDDEN_SELECTORS[0]).then(el => { if (el) run(); });
    });
})();
