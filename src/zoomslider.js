(function () {
    const MIN = 1, MAX = 2, STEP = 0.1;
    const TICKS = [1, 1.5, 2];
    const KEY_ZOOM = 'savedZoom';
    const KEY_PAN  = 'savedZoomPan';
    const MM_W = 160, MM_H = 90;   // 16:9

    function leftPct(v) {
        return ((v - MIN) / (MAX - MIN) * 100).toFixed(3) + '%';
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
/* Container */
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

/* Button */
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

/* Popup card */
.wxpp-zoom-popup {
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

/* Inner layout — column: minimap on top, horizontal slider below */
.wxpp-zoom-inner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: ${MM_W}px;
}

/* Minimap */
.wxpp-zoom-minimap {
    width: ${MM_W}px;
    height: ${MM_H}px;
    position: relative;
    background: var(--mds-color-theme-background-solid-secondary-normal, rgba(255,255,255,0.14));
    border-radius: 5px;
    flex-shrink: 0;
    cursor: crosshair;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
}

/* Blue rectangle — visible portion of the video */
.wxpp-zoom-minimap-view {
    position: absolute;
    background: #65B4FA;
    border-radius: 3px;
    opacity: 0.70;
    cursor: grab;
    box-sizing: border-box;
    min-width: 4px;
    min-height: 4px;
    user-select: none;
    transition: opacity 0.1s;
}
.wxpp-zoom-minimap-view.dragging {
    cursor: grabbing;
    opacity: 0.90;
}

/* Horizontal slider */
.wxpp-zoom-hslider {
    position: relative;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
}
.wxpp-zoom-hslider-bar {
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.28));
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 2px;
    border-radius: 1px;
    transform: translateY(-50%);
}
.wxpp-zoom-hslider-progress {
    background: var(--mds-color-theme-control-active-normal, #64b4fa);
    position: absolute;
    top: 50%;
    left: 0;
    height: 2px;
    border-radius: 1px;
    transform: translateY(-50%);
    width: 0;
}
.wxpp-zoom-hslider-point {
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

/* Tick row below slider */
.wxpp-zoom-tick-row {
    position: relative;
    height: 14px;
    flex-shrink: 0;
    margin-top: -4px;
}
.wxpp-zoom-tick-h {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.wxpp-zoom-tick-h-line {
    width: 1px;
    height: 3px;
    background: var(--mds-color-theme-control-inactive-normal, rgba(255,255,255,0.35));
    flex-shrink: 0;
}
.wxpp-zoom-tick-h-label {
    font-size: 9px;
    font-family: inherit;
    color: var(--mds-color-theme-text-secondary-normal, rgba(255,255,255,0.50));
    line-height: 1;
    margin-top: 2px;
    white-space: nowrap;
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

    function clampPan(zoom, x, y) {
        const half = 0.5 / zoom;
        return {
            x: Math.max(half, Math.min(1 - half, x)),
            y: Math.max(half, Math.min(1 - half, y))
        };
    }

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

        // ── Minimap ──
        const minimap = document.createElement('div');
        minimap.className = 'wxpp-zoom-minimap';
        minimap.title = 'Drag to pan';
        minimap.setAttribute('aria-label', 'Pan view');
        const minimapView = document.createElement('div');
        minimapView.className = 'wxpp-zoom-minimap-view';
        minimap.appendChild(minimapView);

        // ── Horizontal zoom slider ──
        const hslider = document.createElement('div');
        hslider.className = 'wxpp-zoom-hslider';
        hslider.setAttribute('role', 'slider');
        hslider.setAttribute('tabindex', '0');
        hslider.setAttribute('aria-valuemin', String(MIN));
        hslider.setAttribute('aria-valuemax', String(MAX));
        hslider.setAttribute('aria-label', 'Zoom');

        const hbar      = document.createElement('div'); hbar.className = 'wxpp-zoom-hslider-bar';
        const hprogress = document.createElement('div'); hprogress.className = 'wxpp-zoom-hslider-progress';
        const hpoint    = document.createElement('div'); hpoint.className = 'wxpp-zoom-hslider-point';

        hslider.appendChild(hbar);
        hslider.appendChild(hprogress);
        hslider.appendChild(hpoint);

        // ── Tick row ──
        const tickRow = document.createElement('div');
        tickRow.className = 'wxpp-zoom-tick-row';

        TICKS.forEach((v, i) => {
            const isFirst = i === 0;
            const isLast  = i === TICKS.length - 1;

            const tick = document.createElement('div');
            tick.className = 'wxpp-zoom-tick-h';
            tick.style.left = leftPct(v);
            // Edge ticks: pin left/right so label stays inside popup
            tick.style.transform = isFirst ? 'none' : isLast ? 'translateX(-100%)' : 'translateX(-50%)';

            const line = document.createElement('div');
            line.className = 'wxpp-zoom-tick-h-line';

            const label = document.createElement('span');
            label.className = 'wxpp-zoom-tick-h-label';
            label.textContent = v + 'x';

            tick.appendChild(line);
            tick.appendChild(label);
            tickRow.appendChild(tick);
        });

        const arrow = document.createElement('div');
        arrow.className = 'wxpp-zoom-popup-arrow';

        // Layout: minimap → hslider → ticks
        inner.appendChild(minimap);
        inner.appendChild(hslider);
        inner.appendChild(tickRow);
        popup.appendChild(inner);
        popup.appendChild(arrow);
        container.appendChild(btn);
        container.appendChild(popup);

        // ── State ──
        let currentZoom = MIN;
        let panX = 0.5, panY = 0.5;
        let dragging = false;
        let minimapDragging = false;
        let persistEnabled = false;
        let saveTimer = null;

        function updateUI(zoom) {
            const pct = leftPct(zoom);
            hpoint.style.left    = pct;
            hprogress.style.width = pct;
            hslider.setAttribute('aria-valuenow', String(zoom));
        }

        function updateMinimap(zoom, px, py) {
            minimapView.style.width  = (MM_W / zoom) + 'px';
            minimapView.style.height = (MM_H / zoom) + 'px';
            minimapView.style.left   = ((px - 0.5 / zoom) * MM_W) + 'px';
            minimapView.style.top    = ((py - 0.5 / zoom) * MM_H) + 'px';
        }

        updateUI(currentZoom);
        updateMinimap(currentZoom, panX, panY);

        function zoomFromX(clientX) {
            const rect = hslider.getBoundingClientRect();
            const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            return parseFloat((MIN + frac * (MAX - MIN)).toFixed(3));
        }

        function applyZoom(zoom, newPanX, newPanY) {
            currentZoom = clamp(zoom);
            const p = clampPan(
                currentZoom,
                newPanX !== undefined ? newPanX : panX,
                newPanY !== undefined ? newPanY : panY
            );
            panX = p.x;
            panY = p.y;

            if (currentZoom === 1) {
                video.style.transform = '';
                video.style.transformOrigin = '';
                if (video.parentElement) video.parentElement.style.overflow = '';
            } else {
                // panX/panY = view-center fractions. Convert to transformOrigin:
                // origin = (center * zoom - 0.5) / (zoom - 1)
                const ox = (panX * currentZoom - 0.5) / (currentZoom - 1);
                const oy = (panY * currentZoom - 0.5) / (currentZoom - 1);
                video.style.transform = `scale(${currentZoom})`;
                video.style.transformOrigin = `${ox * 100}% ${oy * 100}%`;
                if (video.parentElement) video.parentElement.style.overflow = 'hidden';
            }
            updateUI(currentZoom);
            updateMinimap(currentZoom, panX, panY);

            if (persistEnabled) {
                clearTimeout(saveTimer);
                saveTimer = setTimeout(() => chrome.storage.local.set({
                    [KEY_ZOOM]: currentZoom,
                    [KEY_PAN]:  { x: panX, y: panY }
                }), 600);
            }
        }

        wxppEnabled('persistMediaSettings', (enabled) => {
            persistEnabled = enabled;
            if (enabled) {
                chrome.storage.local.get([KEY_ZOOM, KEY_PAN], (r) => {
                    const savedPan = r[KEY_PAN] || { x: 0.5, y: 0.5 };
                    if (r[KEY_ZOOM] !== undefined) {
                        applyZoom(r[KEY_ZOOM], savedPan.x, savedPan.y);
                    }
                });
            }
        });

        // Horizontal slider drag
        hslider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            applyZoom(zoomFromX(e.clientX));
        });

        // Minimap drag
        function panFromEvent(e) {
            const rect = minimap.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            applyZoom(currentZoom, x, y);
        }

        minimap.addEventListener('mousedown', (e) => {
            e.preventDefault();
            minimapDragging = true;
            minimapView.classList.add('dragging');
            panFromEvent(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (dragging) applyZoom(zoomFromX(e.clientX));
            if (minimapDragging) panFromEvent(e);
        });
        document.addEventListener('mouseup', () => {
            dragging = false;
            minimapDragging = false;
            minimapView.classList.remove('dragging');
        });

        hslider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { e.preventDefault(); applyZoom(currentZoom + STEP); }
            if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') { e.preventDefault(); applyZoom(currentZoom - STEP); }
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.wxpp-vol-control, .wxpp-speed-control, .wxpp-silence-control, .wxpp-options-control').forEach(el => el.classList.remove('expanded'));
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
