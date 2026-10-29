/** h('div.card#id', { onclick, dataset, ... }, ...children) */
export function h(spec, props, ...children) {
    if (props == null || typeof props !== 'object' || props instanceof Node || Array.isArray(props)) {
        if (props != null) children.unshift(props);
        props = {};
    }
    const [tagPart, ...classes] = spec.split('.');
    const [tag, id] = tagPart.split('#');
    const el = document.createElement(tag || 'div');
    if (id) el.id = id;
    if (classes.length) el.className = classes.join(' ');
    for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
        else if (key === 'dataset') Object.assign(el.dataset, value);
        else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
        else if (key === 'html') el.innerHTML = value;
        else if (key in el && typeof value !== 'string') el[key] = value;
        else el.setAttribute(key, value === true ? '' : value);
    }
    append(el, children);
    return el;
}

function append(el, children) {
    for (const child of children) {
        if (child == null || child === false) continue;
        if (Array.isArray(child)) append(el, child);
        else el.append(child instanceof Node ? child : String(child));
    }
}

/** Pretty JSON with arrays of primitives kept on one line. */
export function json(value) {
    return JSON.stringify(value, null, 2)
        .replace(/\[\s+([^[\]{}]*?)\s+\]/g, (_, inner) => `[${inner.split(/,\s+/).join(', ')}]`);
}

/** Reveal-on-scroll for major blocks. */
const revealer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealer.unobserve(entry.target);
        }
    }
}, { rootMargin: '0px 0px -40px 0px' });

export function reveal(root) {
    root.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));
}

export async function copyText(text, button) {
    await navigator.clipboard.writeText(text);
    if (button) {
        const label = button.textContent;
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = label; }, 1200);
    }
}
