(function () {
    const STORAGE_KEY = 'silenceSkipSettings';

    // ── Default settings ──────────────────────────────────────────────────
    let settings = {
        enabled:     false,
        skipSpeed:   8,    // playback rate during silence
        threshold:   2,    // avg volume % below which = silence (0–10 range)
        attackDelay: 1.0,  // seconds of silence before speed jumps
    };

    // ── Runtime state ─────────────────────────────────────────────────────
    let _video    = null;
    let _analyser = null;
    let _animId   = null;
    let _silStart = null;
    let _skipping = false;
    let _savedRate = 1;
    let _btnEl    = null;   // toolbar icon button (active colour)

    // ── Persist ───────────────────────────────────────────────────────────
    function saveSettings() {
        try { chrome.storage.local.set({ [STORAGE_KEY]: settings }); } catch (_) {}
    }
    function loadSettings(cb) {
        try {
            chrome.storage.local.get(STORAGE_KEY, r => {
                if (r[STORAGE_KEY]) Object.assign(settings, r[STORAGE_KEY]);
                cb();
            });
        } catch (_) { cb(); }
    }

    // ── Audio analysis ────────────────────────────────────────────────────
    function getAvgVolume() {
        if (!_analyser) return 100;
        const buf = new Uint8Array(_analyser.frequencyBinCount);
        _analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        return (sum / buf.length / 255) * 100 * 1.5;
    }

    // ── Monitor loop ──────────────────────────────────────────────────────
    function monitorLoop() {
        _animId = null;
        if (!settings.enabled || !_video || _video.paused || _video.ended) {
            if (_skipping) { 
                let base = _video.dataset.wxppBaseRate ? parseFloat(_video.dataset.wxppBaseRate) : _savedRate;
                _video.dataset.wxppSkipping = 'false';
                _video.playbackRate = base; 
                _skipping = false; 
            }
            _silStart = null;
            return;
        }
        const vol = getAvgVolume();
        const now = Date.now();
        if (vol < settings.threshold) {
            if (_silStart === null) _silStart = now;
            if (!_skipping && (now - _silStart) >= settings.attackDelay * 1000) {
                _savedRate          = _video.playbackRate;
                if (!_video.dataset.wxppBaseRate) _video.dataset.wxppBaseRate = _savedRate;
                _video.dataset.wxppSkipping = 'true';
                _video.playbackRate = settings.skipSpeed;
                _skipping           = true;
            }
        } else {
            if (_skipping) { 
                let base = _video.dataset.wxppBaseRate ? parseFloat(_video.dataset.wxppBaseRate) : _savedRate;
                _video.dataset.wxppSkipping = 'false';
                _video.playbackRate = base; 
                _skipping = false; 
            }
            _silStart = null;
        }
        _animId = requestAnimationFrame(monitorLoop);
    }

    function startMonitor() {
        if (_animId || !_analyser) return;
        _animId = requestAnimationFrame(monitorLoop);
    }
    function stopMonitor() {
        if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
        if (_skipping && _video) { 
            let base = _video.dataset.wxppBaseRate ? parseFloat(_video.dataset.wxppBaseRate) : _savedRate;
            _video.dataset.wxppSkipping = 'false';
            _video.playbackRate = base; 
            _skipping = false; 
        }
        _silStart = null;
    }
    function applyEnabled() {
        if (_btnEl) _btnEl.classList.toggle('active', settings.enabled);
        if (settings.enabled && _analyser && _video && !_video.paused) startMonitor();
        else stopMonitor();
    }

    // ── SVG icon ─────────────────────────────────────────────────────────
    function svgIcon(...paths) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="currentcolor" style="display:block;pointer-events:none">${
            paths.map(d => `<path d="${d}"/>`).join('')
        }</svg>`;
    }
    const ICON = svgIcon('M4 7v18l11-9z', 'M15 7v18l11-9z', 'M27 7h2v18h-2z');

    // ── CSS (mirrors zoomslider.js exactly) ──────────────────────────────
    const W = 180;   // popup width in px

    const CSS = `
/* Container */
.wxpp-silence-control {
    overflow: hidden;
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.wxpp-silence-control.expanded {
    overflow: visible;
}

/* Toolbar button */
.wxpp-silence-btn {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 32px;
    color: #fffffff2;
    cursor: pointer;
    display: flex;
    height: 32px;
    width: 32px;
    justify-content: center;
    text-align: center;
    transition: background 0.1s, color 0.15s;
    padding: 0;
    flex-shrink: 0;
}
.wxpp-silence-btn:hover {
    background: var(--mds-color-theme-button-secondary-pressed, rgba(255,255,255,0.12));
}
.wxpp-silence-btn.active {
    color: #64b4fa;
}

/* Popup card — identical to .wxpp-zoom-popup */
.wxpp-silence-popup {
    background: var(--compatible-color-theme-background-solid-primary-normal,
                    var(--mds-color-theme-background-solid-primary-normal, #1e1e1e));
    border: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.2));
    border-radius: 8px;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    padding: 12px;
    position: absolute;
    pointer-events: none;
    box-sizing: border-box;
}
.wxpp-silence-control.expanded .wxpp-silence-popup {
    opacity: 1;
    pointer-events: auto;
}

/* Popup arrow — identical to .wxpp-zoom-popup-arrow */
.wxpp-silence-popup-arrow {
    bottom: -15px;
    height: 16px;
    left: 50%;
    overflow: hidden;
    position: absolute;
    transform: translateX(-50%);
    width: 16px;
}
.wxpp-silence-popup-arrow::after {
    background-color: var(--mds-color-theme-background-solid-secondary-normal, #1e1e1e);
    border: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.2));
    border-left-color: transparent;
    border-top-color: transparent;
    box-sizing: border-box;
    content: "";
    height: 16px;
    position: absolute;
    inset: 0;
    top: -10px;
    transform: rotate(45deg);
    width: 16px;
}

/* Inner layout — column of blocks, same as .wxpp-zoom-inner */
.wxpp-silence-inner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: ${W}px;
}

/* ── Enable row ── */
/* Uses div[role=button] to avoid .wxp-control-button button { height:32px } */
.wxpp-silence-enable-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.12));
}
.wxpp-silence-enable-label {
    font-size: 9px;
    font-family: inherit;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.50));
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1;
}
/* div[role=button] toggle — no <button> so .wxp-control-button button won't match */
.wxpp-silence-enable-chip {
    font-size: 9px;
    font-family: inherit;
    font-weight: 600;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.50));
    background: var(--mds-color-theme-background-solid-secondary-normal, rgba(255,255,255,0.08));
    border: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.18));
    border-radius: 8px;
    padding: 2px 7px;
    cursor: pointer;
    line-height: 1.4;
    user-select: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.wxpp-silence-enable-chip.on {
    color: #64b4fa;
    background: rgba(100,180,250,0.12);
    border-color: rgba(100,180,250,0.40);
}

/* ── Parameter block (each slider section) ── */
.wxpp-silence-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

/* name | value header row */
.wxpp-silence-block-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
}
.wxpp-silence-block-name {
    font-size: 9px;
    font-family: inherit;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.50));
    line-height: 1;
    white-space: nowrap;
}
.wxpp-silence-block-val {
    font-size: 10px;
    font-family: inherit;
    font-weight: 600;
    color: var(--mds-color-theme-text-primary-normal, rgba(255,255,255,0.85));
    line-height: 1;
}

/* Horizontal slider — identical to .wxpp-zoom-hslider */
.wxpp-silence-hslider {
    position: relative;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
}
.wxpp-silence-hslider-bar {
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.28));
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 2px;
    border-radius: 1px;
    transform: translateY(-50%);
}
.wxpp-silence-hslider-progress {
    background: var(--mds-color-theme-control-active-normal, #64b4fa);
    position: absolute;
    top: 50%;
    left: 0;
    height: 2px;
    border-radius: 1px;
    transform: translateY(-50%);
    width: 0;
}
.wxpp-silence-hslider-point {
    background: var(--mds-color-theme-background-solid-tertiary-normal, #fff);
    border: 1px solid var(--mds-color-theme-outline-primary-normal, rgba(255,255,255,0.7));
    border-radius: 50%;
    cursor: pointer;
    height: 14px;
    width: 14px;
    position: absolute;
    top: 50%;
    left: 0;
    transform: translate(-50%, -50%);
    z-index: 10;
    box-sizing: border-box;
}

/* Tick row — identical to .wxpp-zoom-tick-row */
.wxpp-silence-tick-row {
    position: relative;
    height: 14px;
    flex-shrink: 0;
    margin-top: -4px;
}
.wxpp-silence-tick {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.wxpp-silence-tick-line {
    width: 1px;
    height: 3px;
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.35));
    flex-shrink: 0;
}
.wxpp-silence-tick-label {
    font-size: 9px;
    font-family: inherit;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.50));
    line-height: 1;
    margin-top: 2px;
    white-space: nowrap;
}
    `;

    function injectStyles() {
        if (document.getElementById('wxpp-silence-styles')) return;
        const s = document.createElement('style');
        s.id = 'wxpp-silence-styles';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    // ── Horizontal slider factory (mirrors zoomslider hslider) ─────────────
    function makeHSlider(min, max, step, initVal) {
        const wrap = document.createElement('div');
        wrap.className = 'wxpp-silence-hslider';
        wrap.setAttribute('role', 'slider');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-valuemin', String(min));
        wrap.setAttribute('aria-valuemax', String(max));

        const bar      = document.createElement('div'); bar.className = 'wxpp-silence-hslider-bar';
        const progress = document.createElement('div'); progress.className = 'wxpp-silence-hslider-progress';
        const point    = document.createElement('div'); point.className = 'wxpp-silence-hslider-point';

        wrap.appendChild(bar);
        wrap.appendChild(progress);
        wrap.appendChild(point);

        let current = initVal;
        let dragging = false;
        let _onChange = null;

        function snapStep(v) {
            return parseFloat((Math.round(Math.max(min, Math.min(max, v)) / step) * step).toFixed(10));
        }
        function pct(v) { return ((v - min) / (max - min) * 100).toFixed(3) + '%'; }
        function updateUI(v) {
            const p = pct(v);
            progress.style.width = p;
            point.style.left     = p;
            wrap.setAttribute('aria-valuenow', String(v));
        }
        function applyVal(v) {
            current = snapStep(v);
            updateUI(current);
            if (_onChange) _onChange(current);
        }
        function valFromX(clientX) {
            const rect = wrap.getBoundingClientRect();
            const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            return min + frac * (max - min);
        }

        updateUI(current);

        wrap.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
            applyVal(valFromX(e.clientX));
        });
        document.addEventListener('mousemove', (e) => { if (dragging) applyVal(valFromX(e.clientX)); });
        document.addEventListener('mouseup',   ()  => { dragging = false; });

        wrap.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); applyVal(current + step); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); applyVal(current - step); }
        });

        return { el: wrap, get value() { return current; }, set onchange(fn) { _onChange = fn; } };
    }

    // ── Tick row factory (mirrors zoomslider tick row) ──────────────────────
    // ticks = [{ v, label, align }]  align: 'left' | 'center' | 'right'
    function makeTickRow(min, max, ticks) {
        const row = document.createElement('div');
        row.className = 'wxpp-silence-tick-row';
        ticks.forEach(({ v, label, align }) => {
            const tick = document.createElement('div');
            tick.className = 'wxpp-silence-tick';
            tick.style.left = ((v - min) / (max - min) * 100).toFixed(3) + '%';
            tick.style.transform =
                align === 'left'  ? 'none' :
                align === 'right' ? 'translateX(-100%)' :
                'translateX(-50%)';

            const line = document.createElement('div');
            line.className = 'wxpp-silence-tick-line';

            const lbl = document.createElement('span');
            lbl.className   = 'wxpp-silence-tick-label';
            lbl.textContent = label;

            tick.appendChild(line);
            tick.appendChild(lbl);
            row.appendChild(tick);
        });
        return row;
    }

    // ── Parameter block factory ─────────────────────────────────────────────
    function makeBlock(name, sliderObj, valFmt, tickDefs) {
        const block = document.createElement('div');
        block.className = 'wxpp-silence-block';

        // header: name (left) + current value (right)
        const head = document.createElement('div');
        head.className = 'wxpp-silence-block-head';

        const nameEl = document.createElement('span');
        nameEl.className   = 'wxpp-silence-block-name';
        nameEl.textContent = name;

        const valEl = document.createElement('span');
        valEl.className   = 'wxpp-silence-block-val';
        valEl.textContent = valFmt(sliderObj.value);

        head.appendChild(nameEl);
        head.appendChild(valEl);

        const tickRow = makeTickRow(tickDefs.min, tickDefs.max, tickDefs.ticks);

        block.appendChild(head);
        block.appendChild(sliderObj.el);
        block.appendChild(tickRow);

        // Wire up value update
        const prevOnchange = sliderObj.onchange;
        sliderObj.onchange = v => {
            valEl.textContent = valFmt(v);
            if (prevOnchange) prevOnchange(v);
        };

        return block;
    }

    // ── Build control ──────────────────────────────────────────────────────
    function createSilenceControl() {
        const container = document.createElement('div');
        container.className = 'wxpp-silence-control wxp-control-button';

        // Toolbar button
        const btn = document.createElement('button');
        btn.className = 'wxpp-silence-btn' + (settings.enabled ? ' active' : '');
        btn.title     = 'Skip silence';
        btn.innerHTML = ICON;
        _btnEl = btn;

        // Popup
        const popup = document.createElement('div');
        popup.className = 'wxpp-silence-popup';

        const inner = document.createElement('div');
        inner.className = 'wxpp-silence-inner';

        // ── Enable row (div, NOT button — avoids .wxp-control-button button rule) ──
        const enableRow = document.createElement('div');
        enableRow.className = 'wxpp-silence-enable-row';

        const enableLabel = document.createElement('span');
        enableLabel.className   = 'wxpp-silence-enable-label';
        enableLabel.textContent = 'Skip silence';

        const chip = document.createElement('div');
        chip.className = 'wxpp-silence-enable-chip' + (settings.enabled ? ' on' : '');
        chip.textContent = settings.enabled ? 'ON' : 'OFF';
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', '0');

        enableRow.appendChild(enableLabel);
        enableRow.appendChild(chip);

        // ── Sliders ──
        const slSpeed  = makeHSlider(2,   16,  0.5, settings.skipSpeed);
        const slThresh = makeHSlider(0,   10,  0.5, settings.threshold);
        const slAttack = makeHSlider(0.1, 3.0, 0.1, settings.attackDelay);

        const blockSpeed  = makeBlock(
            'Silence speed', slSpeed,
            v => v + '×',
            { min: 2, max: 16, ticks: [
                { v: 2,  label: '2×',  align: 'left'   },
                { v: 8,  label: '8×',  align: 'center' },
                { v: 16, label: '16×', align: 'right'  },
            ]}
        );
        const blockThresh = makeBlock(
            'Threshold', slThresh,
            v => v + '%',
            { min: 0, max: 10, ticks: [
                { v: 0,  label: '0%',  align: 'left'   },
                { v: 5,  label: '5%',  align: 'center' },
                { v: 10, label: '10%', align: 'right'  },
            ]}
        );
        const blockAttack = makeBlock(
            'Attack delay', slAttack,
            v => v.toFixed(1) + 's',
            { min: 0.1, max: 3.0, ticks: [
                { v: 0.1, label: '0.1s', align: 'left'   },
                { v: 1.5, label: '1.5s', align: 'center' },
                { v: 3.0, label: '3s',   align: 'right'  },
            ]}
        );

        const arrow = document.createElement('div');
        arrow.className = 'wxpp-silence-popup-arrow';

        inner.appendChild(enableRow);
        inner.appendChild(blockSpeed);
        inner.appendChild(blockThresh);
        inner.appendChild(blockAttack);
        popup.appendChild(inner);
        popup.appendChild(arrow);
        container.appendChild(btn);
        container.appendChild(popup);

        // ── Slider change handlers ──
        slSpeed.onchange = v => {
            settings.skipSpeed = v;
            saveSettings();
        };
        slThresh.onchange = v => {
            settings.threshold = v;
            saveSettings();
        };
        slAttack.onchange = v => {
            settings.attackDelay = v;
            saveSettings();
        };

        // ── Enable chip toggle ──
        function toggleEnabled() {
            settings.enabled = !settings.enabled;
            chip.textContent = settings.enabled ? 'ON' : 'OFF';
            chip.classList.toggle('on', settings.enabled);
            applyEnabled();
            saveSettings();
        }
        chip.addEventListener('click',   (e) => { e.stopPropagation(); toggleEnabled(); });
        chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEnabled(); } });

        // ── Toolbar button: open/close popup ──
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.wxpp-vol-control, .wxpp-speed-control, .wxpp-zoom-control, .wxpp-options-control')
                .forEach(el => el.classList.remove('expanded'));
            container.classList.toggle('expanded');
        });
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) container.classList.remove('expanded');
        });

        return container;
    }

    // ── Toolbar injection ─────────────────────────────────────────────────
    function ensureControl(toolbar, anchorControl) {
        if (toolbar.querySelector('.wxpp-silence-control')) return;
        const ctrl = createSilenceControl();
        if (anchorControl.nextSibling) {
            toolbar.insertBefore(ctrl, anchorControl.nextSibling);
        } else {
            toolbar.appendChild(ctrl);
        }
        console.log('Webex++: silence skip injected');
    }

    // ── Entry point ───────────────────────────────────────────────────────
    async function init() {
        const volControl = await wxppWait('.wxpp-vol-control');
        if (!volControl) return;
        const video = await wxppWait('video');
        if (!video) return;
        _video = video;
        const toolbar = volControl.parentElement;
        if (!toolbar) return;

        window._wxppAudioSingleton.whenReady(chain => {
            _analyser = chain.analyser;
            if (settings.enabled && !video.paused) startMonitor();
        });

        video.addEventListener('play', () => {
            const ch = window._wxppAudioSingleton.init(video);
            if (ch) {
                _analyser = ch.analyser;
                if (ch.audioCtx.state === 'suspended') ch.audioCtx.resume();
            }
            if (settings.enabled) startMonitor();
        });
        video.addEventListener('pause', stopMonitor);
        video.addEventListener('ended', stopMonitor);

        injectStyles();
        loadSettings(() => {
            applyEnabled();
            ensureControl(toolbar, volControl);
            const obs = new MutationObserver(() => ensureControl(toolbar, volControl));
            obs.observe(toolbar, { childList: true });
        });
    }

    window.addEventListener('load', init);
})();
