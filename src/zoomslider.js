(function () {
    const MIN = 1, MAX = 3, STEP = 0.1;
    const TICKS = [1, 2, 3];

    function bottomPct(v) {
        return ((v - MIN) / (MAX - MIN) * 100).toFixed(3) + '%';
    }

    function formatZoom(zoom) {
        return parseFloat(zoom).toFixed(1) + 'x';
    }

    // Magnifying glass with plus sign
    const P_RING   = 'M13 3a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16z';
    const P_PLUS_H = 'M9 12h8v2H9z';
    const P_PLUS_V = 'M12 9h2v8h-2z';
    const P_HANDLE = 'M20 21.5l1.5-1.5 7.5 7.5-1.5 1.5z';

    function svgIcon(...paths) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="currentcolor" style="display:block;pointer-events:none">${
            paths.map(d => `<path d="${d}"/>`).join('')
        }</svg>`;
    }

    const CSS = `
/* Container — mirrors wxpp-speed-control */
.wxpp-zoom-control {
    overflow: hidden;
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.wxpp-zoom-control.expanded {
    overflow: visible;
}

/* Button — identical to wxpp-vol-btn */
.wxpp-zoom-btn {
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
.wxpp-zoom-btn:hover {
    background: var(--mds-color-theme-button-secondary-pressed, rgba(255,255,255,0.12));
}

/* Popup card — mirrors wxpp-speed-popup */
.wxpp-zoom-popup {
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
.wxpp-zoom-control.expanded .wxpp-zoom-popup {
    opacity: 1;
    pointer-events: auto;
}

/* Popup arrow */
.wxpp-zoom-popup-arrow {
    bottom: -15px;
    height: 16px;
    left: 50%;
    overflow: hidden;
    position: absolute;
    transform: translateX(-50%);
    width: 16px;
}
.wxpp-zoom-popup-arrow::after {
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

/* Inner layout */
.wxpp-zoom-inner {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 8px;
    height: 140px;
}

/* Track column */
.wxpp-zoom-track-col {
    width: 15px;
    position: relative;
    flex-shrink: 0;
}

.wxpp-zoom-range {
    cursor: pointer;
    position: relative;
    height: 100%;
    width: 15px;
}
.wxpp-zoom-range-bar {
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.3));
    position: absolute;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    border-radius: 1px;
}
.wxpp-zoom-range-progress {
    background: var(--mds-color-theme-control-active-normal, #64b4fa);
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    border-radius: 1px;
}
.wxpp-zoom-range-point {
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
.wxpp-zoom-tick-col {
    position: relative;
    flex: 1;
    min-width: 30px;
}
.wxpp-zoom-tick {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    left: 0;
    transform: translateY(50%);
    white-space: nowrap;
}
.wxpp-zoom-tick-line {
    width: 5px;
    height: 1px;
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.35));
    flex-shrink: 0;
}
.wxpp-zoom-tick-label {
    font-size: 10px;
    font-family: inherit;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.55));
    line-height: 1;
}
    `;

    function injectStyles() {
        if (document.getElementById('wxpp-zoom-styles')) return;
        const style = document.createElement('style');
        style.id = 'wxpp-zoom-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function clamp(v) { return Math.min(MAX, Math.max(MIN, v)); }

    function createZoomControl(video) {
        const container = document.createElement('div');
        container.className = 'wxpp-zoom-control wxp-control-button';

        const btn = document.createElement('button');
        btn.className = 'wxpp-zoom-btn';
        btn.title = 'Zoom';
        btn.innerHTML = svgIcon(P_RING, P_PLUS_H, P_PLUS_V, P_HANDLE);

        const popup = document.createElement('div');
        popup.className = 'wxpp-zoom-popup';

        const inner = document.createElement('div');
        inner.className = 'wxpp-zoom-inner';

        const trackCol = document.createElement('div');
        trackCol.className = 'wxpp-zoom-track-col';

        const range = document.createElement('div');
        range.className = 'wxpp-zoom-range';
        range.setAttribute('role', 'slider');
        range.setAttribute('tabindex', '0');
        range.setAttribute('aria-valuemin', String(MIN));
        range.setAttribute('aria-valuemax', String(MAX));
        range.setAttribute('aria-label', 'Zoom');

        const bar      = document.createElement('div'); bar.className = 'wxpp-zoom-range-bar';
        const progress = document.createElement('div'); progress.className = 'wxpp-zoom-range-progress';
        const point    = document.createElement('div'); point.className = 'wxpp-zoom-range-point';

        range.appendChild(bar);
        range.appendChild(progress);
        range.appendChild(point);
        trackCol.appendChild(range);

        const tickCol = document.createElement('div');
        tickCol.className = 'wxpp-zoom-tick-col';

        TICKS.forEach(v => {
            const tick = document.createElement('div');
            tick.className = 'wxpp-zoom-tick';
            tick.style.bottom = bottomPct(v);

            const line = document.createElement('div');
            line.className = 'wxpp-zoom-tick-line';

            const label = document.createElement('span');
            label.className = 'wxpp-zoom-tick-label';
            label.textContent = v + 'x';

            tick.appendChild(line);
            tick.appendChild(label);
            tickCol.appendChild(tick);
        });

        const arrow = document.createElement('div');
        arrow.className = 'wxpp-zoom-popup-arrow';

        inner.appendChild(trackCol);
        inner.appendChild(tickCol);
        popup.appendChild(inner);
        popup.appendChild(arrow);
        container.appendChild(btn);
        container.appendChild(popup);

        // ── State ──
        let currentZoom = MIN;
        let dragging = false;

        function updateUI(zoom) {
            const pct = bottomPct(zoom);
            point.style.bottom = pct;
            progress.style.height = pct;
            range.setAttribute('aria-valuenow', String(zoom));
        }
        updateUI(currentZoom);

        function zoomFromY(clientY) {
            const rect = range.getBoundingClientRect();
            const frac = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
            return parseFloat((MIN + frac * (MAX - MIN)).toFixed(3));
        }

        function applyZoom(zoom) {
            currentZoom = clamp(zoom);
            if (currentZoom === 1) {
                video.style.transform = '';
                video.style.transformOrigin = '';
                if (video.parentElement) video.parentElement.style.overflow = '';
            } else {
                video.style.transform = `scale(${currentZoom})`;
                video.style.transformOrigin = 'center center';
                if (video.parentElement) video.parentElement.style.overflow = 'hidden';
            }
            updateUI(currentZoom);
        }

        range.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            applyZoom(zoomFromY(e.clientY));
        });
        document.addEventListener('mousemove', (e) => {
            if (dragging) applyZoom(zoomFromY(e.clientY));
        });
        document.addEventListener('mouseup', () => { dragging = false; });

        range.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp')   { e.preventDefault(); applyZoom(currentZoom + STEP); }
            if (e.key === 'ArrowDown') { e.preventDefault(); applyZoom(currentZoom - STEP); }
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.wxpp-vol-control, .wxpp-speed-control').forEach(el => el.classList.remove('expanded'));
            container.classList.toggle('expanded');
        });
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) container.classList.remove('expanded');
        });

        return container;
    }

    function ensureZoomControl(toolbar, video) {
        if (toolbar.querySelector('.wxpp-zoom-control')) return;
        const ctrl = createZoomControl(video);
        const speedCtrl = toolbar.querySelector('.wxpp-speed-control');
        if (speedCtrl && speedCtrl.nextSibling) {
            toolbar.insertBefore(ctrl, speedCtrl.nextSibling);
        } else if (speedCtrl) {
            toolbar.appendChild(ctrl);
        } else {
            toolbar.appendChild(ctrl);
        }
        console.log('Webex++: zoom slider injected');
    }

    async function init() {
        const nativeControl = await wxppWait('wxp-playback-rate-control');
        if (!nativeControl) return;
        const video = await wxppWait('video');
        if (!video) return;
        const toolbar = nativeControl.parentElement;
        if (!toolbar) return;

        injectStyles();
        ensureZoomControl(toolbar, video);

        const obs = new MutationObserver(() => ensureZoomControl(toolbar, video));
        obs.observe(toolbar, { childList: true });
    }

    window.addEventListener('load', init);
})();
