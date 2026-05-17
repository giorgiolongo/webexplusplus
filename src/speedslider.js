(function () {
    const MIN = 0.5, MAX = 3, STEP = 0.25;
    const TICKS = [1, 2, 3];

    // Percentage from bottom for a given value (bottom = MIN, top = MAX)
    function bottomPct(v) {
        return ((v - MIN) / (MAX - MIN) * 100).toFixed(3) + '%';
    }

    function formatSpeed(rate) {
        const r = parseFloat(rate);
        return (r % 1 === 0 ? r : r.toFixed(2)) + 'X';
    }

    const CSS = `
wxp-playback-rate-control {
    display: none !important;
}

/* Container — mirrors wxp-volume-control */
.wxpp-speed-control {
    overflow: hidden;
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.wxpp-speed-control.expanded {
    overflow: visible;
}

/* Button — identical to the native wxp-playback-rate-button */
.wxpp-speed-btn {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 32px;
    color: #fffffff2;
    cursor: pointer;
    display: flex;
    height: 32px;
    justify-content: center;
    text-align: center;
    transition: background 0.1s;
    padding: 0 6px;
    font-size: 12px;
    font-family: inherit;
    font-weight: 600;
    white-space: nowrap;
    min-width: 32px;
}
.wxpp-speed-btn:hover {
    background: var(--mds-color-theme-button-secondary-pressed, rgba(255,255,255,0.12));
}

/* Popup card — mirrors wxp-volume-slider */
.wxpp-speed-popup {
    background: var(--compatible-color-theme-background-solid-primary-normal,
                    var(--mds-color-theme-background-solid-primary-normal, #1e1e1e));
    border: 1px solid var(--mds-color-theme-outline-secondary-normal, rgba(255,255,255,0.2));
    border-radius: 8px;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    padding: 15px 12px;
    position: absolute;
    pointer-events: none;
    box-sizing: border-box;
}
.wxpp-speed-control.expanded .wxpp-speed-popup {
    opacity: 1;
    pointer-events: auto;
}

/* Popup arrow — identical to wxp-volume-slider-arrow */
.wxpp-speed-popup-arrow {
    bottom: -15px;
    height: 16px;
    left: 50%;
    overflow: hidden;
    position: absolute;
    transform: translateX(-50%);
    width: 16px;
}
.wxpp-speed-popup-arrow::after {
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

/* Inner layout: slider track on the left, tick labels on the right */
.wxpp-speed-inner {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 8px;
    height: 140px;
}

/* Track column — mirrors wxp-range-vertical sizing */
.wxpp-speed-track-col {
    width: 15px;
    position: relative;
    flex-shrink: 0;
}

/* The custom div-based vertical range — mirrors wxp-range wxp-range-vertical */
.wxpp-speed-range {
    cursor: pointer;
    position: relative;
    height: 100%;
    width: 15px;
}
.wxpp-speed-range-bar {
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.3));
    position: absolute;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    border-radius: 1px;
}
.wxpp-speed-range-progress {
    background: var(--mds-color-theme-control-active-normal, #64b4fa);
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    border-radius: 1px;
}
/* Thumb — identical to wxp-range-point */
.wxpp-speed-range-point {
    background: var(--mds-color-theme-background-solid-tertiary-normal, #fff);
    border: 1px solid var(--mds-color-theme-outline-primary-normal, rgba(255,255,255,0.7));
    border-radius: 16px;
    cursor: pointer;
    height: 16px;
    width: 16px;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 50%);
    z-index: 10;
    box-sizing: border-box;
}

/* Tick label column */
.wxpp-speed-tick-col {
    position: relative;
    flex: 1;
    min-width: 30px;
}
.wxpp-speed-tick {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    left: 0;
    transform: translateY(50%);
    white-space: nowrap;
}
.wxpp-speed-tick-line {
    width: 5px;
    height: 1px;
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.35));
    flex-shrink: 0;
}
.wxpp-speed-tick-label {
    font-size: 10px;
    font-family: inherit;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.55));
    line-height: 1;
}
    `;

    function injectStyles() {
        if (document.getElementById('wxpp-speed-styles')) return;
        const style = document.createElement('style');
        style.id = 'wxpp-speed-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function clamp(v) { return Math.min(MAX, Math.max(MIN, v)); }

    function createSpeedControl(video) {
        // ── Button ──
        const container = document.createElement('div');
        container.className = 'wxpp-speed-control wxp-control-button';

        const btn = document.createElement('button');
        btn.className = 'wxpp-speed-btn';
        btn.textContent = formatSpeed(video.playbackRate || 1);

        // ── Popup ──
        const popup = document.createElement('div');
        popup.className = 'wxpp-speed-popup';

        const inner = document.createElement('div');
        inner.className = 'wxpp-speed-inner';

        // Track column
        const trackCol = document.createElement('div');
        trackCol.className = 'wxpp-speed-track-col';

        const range = document.createElement('div');
        range.className = 'wxpp-speed-range';
        range.setAttribute('role', 'slider');
        range.setAttribute('tabindex', '0');
        range.setAttribute('aria-valuemin', String(MIN));
        range.setAttribute('aria-valuemax', String(MAX));
        range.setAttribute('aria-label', 'Playback speed');

        const bar = document.createElement('div');
        bar.className = 'wxpp-speed-range-bar';

        const progress = document.createElement('div');
        progress.className = 'wxpp-speed-range-progress';

        const point = document.createElement('div');
        point.className = 'wxpp-speed-range-point';

        range.appendChild(bar);
        range.appendChild(progress);
        range.appendChild(point);
        trackCol.appendChild(range);

        // Tick label column
        const tickCol = document.createElement('div');
        tickCol.className = 'wxpp-speed-tick-col';

        TICKS.forEach(v => {
            const tick = document.createElement('div');
            tick.className = 'wxpp-speed-tick';
            tick.style.bottom = bottomPct(v);

            const line = document.createElement('div');
            line.className = 'wxpp-speed-tick-line';

            const label = document.createElement('span');
            label.className = 'wxpp-speed-tick-label';
            label.textContent = v + 'X';

            tick.appendChild(line);
            tick.appendChild(label);
            tickCol.appendChild(tick);
        });

        const arrow = document.createElement('div');
        arrow.className = 'wxpp-speed-popup-arrow';

        inner.appendChild(trackCol);
        inner.appendChild(tickCol);
        popup.appendChild(inner);
        popup.appendChild(arrow);
        container.appendChild(btn);
        container.appendChild(popup);

        // ── State ──
        let currentRate = clamp(video.playbackRate || 1);
        let dragging = false;

        function updateUI(rate) {
            const pct = bottomPct(rate);
            point.style.bottom = pct;
            progress.style.height = pct;
            range.setAttribute('aria-valuenow', String(rate));
            btn.textContent = formatSpeed(rate);
        }
        updateUI(currentRate);

        function rateFromY(clientY) {
            const rect = range.getBoundingClientRect();
            const relY = rect.bottom - clientY; // distance from bottom
            const frac = Math.max(0, Math.min(1, relY / rect.height));
            const raw = MIN + frac * (MAX - MIN);
            return Math.round(raw / STEP) * STEP;
        }

        function applyRate(rate) {
            currentRate = clamp(rate);
            video.playbackRate = currentRate;
            updateUI(currentRate);
        }

        // Mouse drag
        range.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            applyRate(rateFromY(e.clientY));
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            applyRate(rateFromY(e.clientY));
        });
        document.addEventListener('mouseup', () => { dragging = false; });

        // Keyboard on the range div
        range.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp')   { e.preventDefault(); applyRate(currentRate + STEP); }
            if (e.key === 'ArrowDown') { e.preventDefault(); applyRate(currentRate - STEP); }
        });

        // Sync if page changes rate externally
        video.addEventListener('ratechange', () => {
            if (!dragging && Math.abs(video.playbackRate - currentRate) > 0.01) {
                currentRate = clamp(video.playbackRate);
                updateUI(currentRate);
            }
        });

        // Toggle popup on button click
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.wxpp-vol-control').forEach(el => el.classList.remove('expanded'));
            container.classList.toggle('expanded');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) container.classList.remove('expanded');
        });

        return container;
    }

    function ensureSpeedControl(toolbar, nativeControl, video) {
        if (toolbar.querySelector('.wxpp-speed-control')) return;
        const ctrl = createSpeedControl(video);
        if (nativeControl.nextSibling) {
            toolbar.insertBefore(ctrl, nativeControl.nextSibling);
        } else {
            toolbar.appendChild(ctrl);
        }
        console.log('Webex++: speed slider injected');
    }

    async function init() {
        const nativeControl = await wxppWait('wxp-playback-rate-control');
        if (!nativeControl) return;
        const video = await wxppWait('video');
        if (!video) return;
        _video = video;
        const toolbar = nativeControl.parentElement;
        if (!toolbar) return;

        injectStyles();
        ensureSpeedControl(toolbar, nativeControl, video);

        const obs = new MutationObserver(() => ensureSpeedControl(toolbar, nativeControl, video));
        obs.observe(toolbar, { childList: true });
    }

    let _video = null;
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'ArrowUp' && e.code !== 'ArrowDown') return;
        if (!_video) _video = document.querySelector('video');
        if (!_video) return;
        e.preventDefault();
        e.stopPropagation();
        const next = clamp(Math.round((_video.playbackRate + (e.code === 'ArrowUp' ? STEP : -STEP)) / STEP) * STEP);
        _video.playbackRate = next;
    }, true);

    window.addEventListener('load', init);
})();
