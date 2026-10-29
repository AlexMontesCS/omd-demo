import { omdDisplay, createFromJSON } from '@teachinglab/omd';

/**
 * One scope per page: every display it creates is destroyed when the page
 * unmounts, and lazy stages render only as they approach the viewport.
 */
export function createScope() {
    const displays = new Set();
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            entry.target._omdMount?.();
        }
    }, { rootMargin: '600px 0px' });

    function display(el, options = {}) {
        const d = new omdDisplay(el, { maxScale: 1, padding: 12, ...options });
        displays.add(d);
        return d;
    }

    /** Renders JSON into el, reusing el's display. Returns { display, component } or { error }. */
    const byElement = new WeakMap();
    function mount(el, json, options = {}) {
        let d = byElement.get(el);
        if (d) {
            d.clear();
            el.querySelectorAll(':scope > .render-error').forEach((n) => n.remove());
        } else {
            el.replaceChildren();
            d = display(el, options);
            byElement.set(el, d);
        }
        try {
            const component = createFromJSON(structuredClone(json));
            d.load(component);
            return { display: d, component };
        } catch (error) {
            showError(el, error);
            return { display: d, error };
        }
    }

    function lazy(el, json, options) {
        el._omdMount = () => mount(el, json, options);
        observer.observe(el);
    }

    function dispose() {
        observer.disconnect();
        for (const d of displays) d.destroy();
        displays.clear();
    }

    return { display, mount, lazy, dispose };
}

export function showError(el, error) {
    const pre = document.createElement('pre');
    pre.className = 'render-error';
    pre.textContent = String(error?.message || error);
    el.append(pre);
}

/** Re-fits a display after its component changed size in place (e.g. a step reveal). */
export function refit(display) {
    display._layout();
}
