import './style.css';
import { renderOverview } from './pages/overview.js';
import { renderType } from './pages/type.js';
import { renderLab } from './pages/lab.js';
import { renderCanvas } from './pages/canvas.js';
import { renderPlayground } from './pages/playground.js';
import { reveal } from './dom.js';

const app = document.getElementById('app');
document.getElementById('omd-version').textContent = `v${__OMD_VERSION__}`;

let unmount = null;

function parseRoute() {
    const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
    const parts = path.split('/').filter(Boolean);
    return { parts, params: new URLSearchParams(query) };
}

function route() {
    const { parts, params } = parseRoute();
    unmount?.();
    unmount = null;
    app.replaceChildren();

    const [head, ...rest] = parts;
    let nav = head || 'overview';
    if (head === 'type') {
        unmount = renderType(app, rest[0]);
        nav = 'catalog';
    } else if (head === 'lab') {
        unmount = renderLab(app, { params });
    } else if (head === 'canvas') {
        unmount = renderCanvas(app);
    } else if (head === 'playground') {
        unmount = renderPlayground(app, { type: rest[0], index: rest[1], params });
    } else {
        unmount = renderOverview(app, { scrollToCatalog: head === 'catalog' });
        nav = head === 'catalog' ? 'catalog' : 'overview';
    }

    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === nav));
    if (head !== 'catalog') window.scrollTo({ top: 0 });
    reveal(app);
}

window.addEventListener('hashchange', route);
route();
