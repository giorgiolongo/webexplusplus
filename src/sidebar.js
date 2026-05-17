(function () {
    function runAutohide() {
        wxppWait('wxp-panel-list', 10000).then((panel) => {
            if (!panel) return;
            panel.classList.add('overflow-hidden', 'wxp-hidden');
            panel.setAttribute('aria-hidden', 'true');
            panel.setAttribute('style', 'width: 480px; margin-right: -480px;');
        });

        wxppWait('.wxp-panel-collapse-button', 10000).then((button) => {
            if (!button) return;
            button.click();
            console.log('Webex++: collapse button clicked');
        });
    }

    window.addEventListener('load', () => {
        wxppEnabled('hideUselessElements', (enabled) => { if (enabled) runAutohide(); });
    });
})();
