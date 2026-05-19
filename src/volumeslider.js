(function () {
    const MAX = 100, SNAP = 25;

    const TICKS = [
        { v: 0,   label: '0%'  },
        { v: 25,  label: null  },
        { v: 50,  label: '50%' },
        { v: 75,  label: null  },
        { v: 100, label: '100%'},
    ];

    // SVG sub-paths extracted from wxp-icon-speaker-bold
    const P_CONE  = 'M17.075 3.115a1.49 1.49 0 0 0-1.62.31L8.598 10H5a3.003 3.003 0 0 0-3 3v6a3.003 3.003 0 0 0 3 3h3.598l6.841 6.56A1.5 1.5 0 0 0 18 27.498V4.5a1.5 1.5 0 0 0-.925-1.386M16 26.325l-6.308-6.047A1 1 0 0 0 9 20H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h4c.258 0 .506-.1.692-.279L16 5.672z';
    const P_WAVE_S = 'M21.273 10.813a1 1 0 0 0 .04 1.413A5.15 5.15 0 0 1 23 15.995a5.21 5.21 0 0 1-1.687 3.778 1 1 0 1 0 1.374 1.453 7.064 7.064 0 0 0 0-10.453 1 1 0 0 0-1.414.04';
    const P_WAVE_L = 'M27.02 9.272a1 1 0 0 0-1.373 1.455A7.18 7.18 0 0 1 28 15.995a7.28 7.28 0 0 1-2.354 5.278 1 1 0 1 0 1.374 1.453A9.26 9.26 0 0 0 30 16.004a9.16 9.16 0 0 0-2.98-6.732';
    // Diagonal slash across the full icon to indicate mute
    const P_SLASH  = 'M25 4 L28 7 L7 28 L4 25Z';

    function svgIcon(...paths) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="currentcolor" style="display:block;pointer-events:none">${
            paths.map(d => `<path d="${d}"/>`).join('')
        }</svg>`;
    }

    function getIcon(val) {
        if (val === 0)   return svgIcon(P_CONE, P_SLASH);
        if (val <= 25)   return svgIcon(P_CONE);
        if (val <= 50)   return svgIcon(P_CONE, P_WAVE_S);
        return svgIcon(P_CONE, P_WAVE_S, P_WAVE_L);
    }

    function bottomPct(v) {
        return (v / MAX * 100).toFixed(3) + '%';
    }

    function toSlider(video) {
        return video.muted ? 0 : Math.round(video.volume * 100);
    }

    function snapTo25(val) {
        return Math.round(Math.max(0, Math.min(MAX, val)) / SNAP) * SNAP;
    }

    const CSS = `
wxp-volume-control {
    display: none !important;
}

.wxpp-vol-control {
    overflow: hidden;
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.wxpp-vol-control.expanded {
    overflow: visible;
}

.wxpp-vol-btn {
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
    transition: background 0.1s;
    padding: 0;
    flex-shrink: 0;
}
.wxpp-vol-btn:hover {
    background: var(--mds-color-theme-button-secondary-pressed, rgba(255,255,255,0.12));
}
.wxpp-vol-btn.muted {
    color: #e53e3e;
}

.wxpp-vol-popup {
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
.wxpp-vol-control.expanded .wxpp-vol-popup {
    opacity: 1;
    pointer-events: auto;
}

.wxpp-vol-popup-arrow {
    bottom: -15px;
    height: 16px;
    left: 50%;
    overflow: hidden;
    position: absolute;
    transform: translateX(-50%);
    width: 16px;
}
.wxpp-vol-popup-arrow::after {
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

.wxpp-vol-inner {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 8px;
    height: 140px;
}

.wxpp-vol-track-col {
    width: 15px;
    position: relative;
    flex-shrink: 0;
}

.wxpp-vol-range {
    cursor: pointer;
    position: relative;
    height: 100%;
    width: 15px;
}
.wxpp-vol-range-bar {
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.3));
    position: absolute;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    border-radius: 1px;
}
.wxpp-vol-range-progress {
    background: var(--mds-color-theme-control-active-normal, #64b4fa);
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    border-radius: 1px;
}
.wxpp-vol-range-point {
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

.wxpp-vol-tick-col {
    position: relative;
    flex: 1;
    min-width: 36px;
}
.wxpp-vol-tick {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    left: 0;
    transform: translateY(50%);
    white-space: nowrap;
}
.wxpp-vol-tick-line {
    width: 5px;
    height: 1px;
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.35));
    flex-shrink: 0;
}
.wxpp-vol-tick-label {
    font-size: 10px;
    font-family: inherit;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.55));
    line-height: 1;
}
    `;

    function injectStyles() {
        if (document.getElementById('wxpp-vol-styles')) return;
        const style = document.createElement('style');
        style.id = 'wxpp-vol-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function createVolumeControl(video) {
        const container = document.createElement('div');
        container.className = 'wxpp-vol-control wxp-control-button';

        const btn = document.createElement('button');
        btn.className = 'wxpp-vol-btn';
        btn.title = 'Volume';

        const popup = document.createElement('div');
        popup.className = 'wxpp-vol-popup';

        const inner = document.createElement('div');
        inner.className = 'wxpp-vol-inner';

        const trackCol = document.createElement('div');
        trackCol.className = 'wxpp-vol-track-col';

        const range = document.createElement('div');
        range.className = 'wxpp-vol-range';
        range.setAttribute('role', 'slider');
        range.setAttribute('tabindex', '0');
        range.setAttribute('aria-valuemin', '0');
        range.setAttribute('aria-valuemax', '100');
        range.setAttribute('aria-label', 'Volume');

        const bar      = document.createElement('div'); bar.className = 'wxpp-vol-range-bar';
        const progress = document.createElement('div'); progress.className = 'wxpp-vol-range-progress';
        const point    = document.createElement('div'); point.className = 'wxpp-vol-range-point';

        range.appendChild(bar);
        range.appendChild(progress);
        range.appendChild(point);
        trackCol.appendChild(range);

        const tickCol = document.createElement('div');
        tickCol.className = 'wxpp-vol-tick-col';

        TICKS.forEach(({ v, label }) => {
            const tick = document.createElement('div');
            tick.className = 'wxpp-vol-tick';
            tick.style.bottom = bottomPct(v);

            const line = document.createElement('div');
            line.className = 'wxpp-vol-tick-line';
            tick.appendChild(line);

            if (label) {
                const lbl = document.createElement('span');
                lbl.className = 'wxpp-vol-tick-label';
                lbl.textContent = label;
                tick.appendChild(lbl);
            }

            tickCol.appendChild(tick);
        });

        const arrow = document.createElement('div');
        arrow.className = 'wxpp-vol-popup-arrow';

        inner.appendChild(trackCol);
        inner.appendChild(tickCol);
        popup.appendChild(inner);
        popup.appendChild(arrow);
        container.appendChild(btn);
        container.appendChild(popup);

        // ── State ──
        let currentVal = snapTo25(toSlider(video));
        let dragging = false;

        function updateUI(val) {
            const pct = bottomPct(val);
            point.style.bottom = pct;
            progress.style.height = pct;
            range.setAttribute('aria-valuenow', String(val));
            btn.innerHTML = getIcon(val);
            btn.classList.toggle('muted', val === 0);
        }
        updateUI(currentVal);

        function valFromY(clientY) {
            const rect = range.getBoundingClientRect();
            const frac = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
            return snapTo25(frac * MAX);
        }

        function applyVal(val) {
            currentVal = snapTo25(val);
            video.volume = currentVal / 100;
            video.muted  = currentVal === 0;
            updateUI(currentVal);
        }

        range.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            applyVal(valFromY(e.clientY));
        });
        document.addEventListener('mousemove', (e) => {
            if (dragging) applyVal(valFromY(e.clientY));
        });
        document.addEventListener('mouseup', () => { dragging = false; });

        range.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp')   { e.preventDefault(); applyVal(currentVal + SNAP); }
            if (e.key === 'ArrowDown') { e.preventDefault(); applyVal(currentVal - SNAP); }
        });

        let volChangeTimer = null;
        video.addEventListener('volumechange', () => {
            if (!dragging) {
                clearTimeout(volChangeTimer);
                volChangeTimer = setTimeout(() => {
                    const v = snapTo25(toSlider(video));
                    if (v !== currentVal) { currentVal = v; updateUI(v); }
                }, 100);
            }
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.wxpp-speed-control, .wxpp-zoom-control').forEach(el => el.classList.remove('expanded'));
            container.classList.toggle('expanded');
            if (container.classList.contains('expanded')) {
                const v = snapTo25(toSlider(video));
                if (v !== currentVal) { currentVal = v; updateUI(currentVal); }
            }
        });
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) container.classList.remove('expanded');
        });

        return container;
    }

    function ensureVolumeControl(toolbar, nativeControl, video) {
        if (toolbar.querySelector('.wxpp-vol-control')) return;
        const ctrl = createVolumeControl(video);
        if (nativeControl.nextSibling) {
            toolbar.insertBefore(ctrl, nativeControl.nextSibling);
        } else {
            toolbar.appendChild(ctrl);
        }
        console.log('Webex++: volume slider injected');
    }

    async function init() {
        const nativeControl = await wxppWait('wxp-volume-control');
        if (!nativeControl) return;
        const video = await wxppWait('video');
        if (!video) return;
        const toolbar = nativeControl.parentElement;
        if (!toolbar) return;

        injectStyles();
        ensureVolumeControl(toolbar, nativeControl, video);

        const obs = new MutationObserver(() => ensureVolumeControl(toolbar, nativeControl, video));
        obs.observe(toolbar, { childList: true });
    }

    window.addEventListener('load', init);
})();
