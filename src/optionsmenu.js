(function () {
    const STORAGE_KEYS = ["hideUselessElements", "persistMediaSettings", "showEstimatedEnd"];

    let settings = {
        hideUselessElements: true,
        persistMediaSettings: true,
        showEstimatedEnd: true
    };

    function saveSettings() {
        try { chrome.storage.local.set(settings); } catch (_) {}
    }

    function loadSettings(cb) {
        try {
            chrome.storage.local.get(STORAGE_KEYS, function(r) {
                if (r.hideUselessElements !== undefined) settings.hideUselessElements = !!r.hideUselessElements;
                if (r.persistMediaSettings !== undefined) settings.persistMediaSettings = !!r.persistMediaSettings;
                if (r.showEstimatedEnd !== undefined) settings.showEstimatedEnd = !!r.showEstimatedEnd;
                cb();
            });
        } catch (_) { cb(); }
    }

    function svgIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;pointer-events:none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    }

    var W = 220;

    var CSS = [
        '.wxpp-options-control {',
        '    overflow: hidden;',
        '    position: relative;',
        '    z-index: 50;',
        '    flex-shrink: 0;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '}',
        '.wxpp-options-control.expanded {',
        '    overflow: visible;',
        '}',
        '.wxpp-options-btn {',
        '    align-items: center;',
        '    background: transparent;',
        '    border: none;',
        '    border-radius: 32px;',
        '    color: #fffffff2;',
        '    cursor: pointer;',
        '    display: flex;',
        '    height: 32px;',
        '    width: 32px;',
        '    justify-content: center;',
        '    text-align: center;',
        '    transition: background 0.1s, color 0.15s;',
        '    padding: 0;',
        '    flex-shrink: 0;',
        '}',
        '.wxpp-options-btn:hover {',
        '    background: var(--mds-color-theme-button-secondary-pressed, rgba(255,255,255,0.12));',
        '}',
        '.wxpp-options-popup {',
        '    background: var(--compatible-color-theme-background-solid-primary-normal, var(--mds-color-theme-background-solid-primary-normal, #1e1e1e));',
        '    border: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.2));',
        '    border-radius: 8px;',
        '    bottom: 40px;',
        '    left: 50%;',
        '    transform: translateX(-50%);',
        '    opacity: 0;',
        '    padding: 12px;',
        '    position: absolute;',
        '    pointer-events: none;',
        '    box-sizing: border-box;',
        '}',
        '.wxpp-options-control.expanded .wxpp-options-popup {',
        '    opacity: 1;',
        '    pointer-events: auto;',
        '}',
        '.wxpp-options-popup-arrow {',
        '    bottom: -15px;',
        '    height: 16px;',
        '    left: 50%;',
        '    overflow: hidden;',
        '    position: absolute;',
        '    transform: translateX(-50%);',
        '    width: 16px;',
        '}',
        '.wxpp-options-popup-arrow::after {',
        '    background-color: var(--mds-color-theme-background-solid-secondary-normal, #1e1e1e);',
        '    border: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.2));',
        '    border-left-color: transparent;',
        '    border-top-color: transparent;',
        '    box-sizing: border-box;',
        '    content: "";',
        '    height: 16px;',
        '    position: absolute;',
        '    inset: 0;',
        '    top: -10px;',
        '    transform: rotate(45deg);',
        '    width: 16px;',
        '}',
        '.wxpp-options-inner {',
        '    display: flex;',
        '    flex-direction: column;',
        '    align-items: stretch;',
        '    width: ' + W + 'px;',
        '}',
        '.wxpp-options-row {',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: space-between;',
        '    padding: 8px 0;',
        '}',
        '.wxpp-options-row:not(:last-child) {',
        '    border-bottom: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.12));',
        '}',
        '.wxpp-options-label-container {',
        '    display: flex;',
        '    flex-direction: column;',
        '    gap: 2px;',
        '}',
        '.wxpp-options-label-title {',
        '    font-size: 11px;',
        '    font-family: inherit;',
        '    font-weight: 600;',
        '    color: var(--mds-color-theme-text-primary-normal, rgba(255,255,255,0.85));',
        '    line-height: 1.2;',
        '}',
        '.wxpp-options-label-desc {',
        '    font-size: 9px;',
        '    font-family: inherit;',
        '    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.50));',
        '    line-height: 1.2;',
        '}',
        '.wxpp-options-chip {',
        '    font-size: 9px;',
        '    font-family: inherit;',
        '    font-weight: 600;',
        '    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.50));',
        '    background: var(--mds-color-theme-background-solid-secondary-normal, rgba(255,255,255,0.08));',
        '    border: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.18));',
        '    border-radius: 8px;',
        '    padding: 2px 7px;',
        '    cursor: pointer;',
        '    line-height: 1.4;',
        '    user-select: none;',
        '    transition: background 0.15s, border-color 0.15s, color 0.15s;',
        '    flex-shrink: 0;',
        '    margin-left: 10px;',
        '    min-width: 28px;',
        '    text-align: center;',
        '    box-sizing: border-box;',
        '}',
        '.wxpp-options-chip.on {',
        '    color: #64b4fa;',
        '    background: rgba(100,180,250,0.12);',
        '    border-color: rgba(100,180,250,0.40);',
        '}'
    ].join('\n');

    function injectStyles() {
        if (document.getElementById('wxpp-options-styles')) return;
        var s = document.createElement('style');
        s.id = 'wxpp-options-styles';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    function createOptionRow(key, title, desc) {
        var row = document.createElement('div');
        row.className = 'wxpp-options-row';

        var labelContainer = document.createElement('div');
        labelContainer.className = 'wxpp-options-label-container';

        var titleEl = document.createElement('span');
        titleEl.className = 'wxpp-options-label-title';
        titleEl.textContent = title;

        var descEl = document.createElement('span');
        descEl.className = 'wxpp-options-label-desc';
        descEl.textContent = desc;

        labelContainer.appendChild(titleEl);
        labelContainer.appendChild(descEl);

        var chip = document.createElement('div');
        chip.className = 'wxpp-options-chip' + (settings[key] ? ' on' : '');
        chip.textContent = settings[key] ? 'ON' : 'OFF';
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', '0');

        row.appendChild(labelContainer);
        row.appendChild(chip);

        function toggle() {
            settings[key] = !settings[key];
            chip.textContent = settings[key] ? 'ON' : 'OFF';
            chip.classList.toggle('on', settings[key]);
            saveSettings();
        }

        chip.addEventListener('click', function(e) { e.stopPropagation(); toggle(); });
        chip.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });

        return row;
    }

    function createOptionsControl() {
        var container = document.createElement('div');
        container.className = 'wxpp-options-control wxp-control-button';

        var btn = document.createElement('button');
        btn.className = 'wxpp-options-btn';
        btn.title = 'Webex Player Addons Options';
        btn.innerHTML = svgIcon();

        var popup = document.createElement('div');
        popup.className = 'wxpp-options-popup';

        var inner = document.createElement('div');
        inner.className = 'wxpp-options-inner';

        inner.appendChild(createOptionRow('hideUselessElements',  'Hide useless elements',    'Hides the sidebar and unnecessary controls'));
        inner.appendChild(createOptionRow('persistMediaSettings', 'Remember speed and volume',    'Restores speed and volume when opening the player'));
        inner.appendChild(createOptionRow('showEstimatedEnd',     'Show estimated end time', 'Shows remaining time adjusted for current playback speed'));

        var arrow = document.createElement('div');
        arrow.className = 'wxpp-options-popup-arrow';

        popup.appendChild(inner);
        popup.appendChild(arrow);
        container.appendChild(btn);
        container.appendChild(popup);

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.wxpp-vol-control, .wxpp-speed-control, .wxpp-zoom-control, .wxpp-silence-control')
                .forEach(function(el) { el.classList.remove('expanded'); });
            container.classList.toggle('expanded');
        });

        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) container.classList.remove('expanded');
        });

        return container;
    }

    function ensureControl(toolbar) {
        if (toolbar.querySelector('.wxpp-options-control')) return;
        var ctrl = createOptionsControl();
        // Insert after the last custom wxpp control (silence-skip is the rightmost)
        var silenceCtrl = toolbar.querySelector('.wxpp-silence-control');
        if (silenceCtrl && silenceCtrl.nextSibling) {
            toolbar.insertBefore(ctrl, silenceCtrl.nextSibling);
        } else if (silenceCtrl) {
            toolbar.appendChild(ctrl);
        } else {
            toolbar.appendChild(ctrl);
        }
        console.log('Webex++: options menu injected');
    }

    async function init() {
        // Wait for the silence-control to appear (same toolbar as other custom controls)
        var silenceCtrl = await wxppWait('.wxpp-silence-control');
        if (!silenceCtrl) {
            // Fallback: use volume control toolbar
            var volCtrl = await wxppWait('.wxpp-vol-control');
            if (!volCtrl) return;
            var toolbar = volCtrl.parentElement;
            if (!toolbar) return;
            injectStyles();
            loadSettings(function() {
                ensureControl(toolbar);
                new MutationObserver(function() { ensureControl(toolbar); })
                    .observe(toolbar, { childList: true });
            });
            return;
        }
        var toolbar = silenceCtrl.parentElement;
        if (!toolbar) return;

        injectStyles();
        loadSettings(function() {
            ensureControl(toolbar);
            new MutationObserver(function() { ensureControl(toolbar); })
                .observe(toolbar, { childList: true });
        });
    }

    window.addEventListener('load', init);
})();
