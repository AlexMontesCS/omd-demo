import { omdCanvas, createFromJSON } from '@teachinglab/omd';
import { h, json, copyText } from '../dom.js';
import { showError } from '../render.js';
import { ALL_TYPES, TYPES, featuredSample, stripComment } from '../catalog.js';

const WIDTH = 1040;
const HEIGHT = 620;

const SCENE = [
    { x: 32, y: 24, omdType: 'label', text: 'Solve 2x + 3 = 11 three ways', size: 'large' },
    { x: 32, y: 90, scale: 0.85, omdType: 'equationWork', rows: [
        { kind: 'equation', left: '2x + 3', right: '11' },
        { kind: 'operation', left: '-3', right: '-3' },
        { kind: 'line' },
        { kind: 'equation', left: '2x', right: '8' },
        { kind: 'operation', left: '÷2', right: '÷2' },
        { kind: 'line' },
        { kind: 'equation', left: 'x', right: '4' },
    ] },
    { x: 340, y: 110, scale: 1.4, omdType: 'balanceHanger', leftValues: ['x', 'x', '3'], rightValues: ['11'] },
    { x: 730, y: 34, scale: 1.1, omdType: 'coordinatePlane', xMin: -1, xMax: 7, yMin: -1, yMax: 12, tickInterval: 1, size: 'large',
      graphEquations: [{ equation: 'y = 2x + 3', color: '#1F6C9F', strokeWidth: 2.5 }, { equation: 'y = 11', color: '#9F2F2D', strokeWidth: 2 }],
      dotValues: [[4, 11, '#111111']] },
    { x: 340, y: 418, omdType: 'tapeDiagram', totalWidth: 340, values: [
        { value: 'x', weight: 4, color: '#E1F3FE' }, { value: 'x', weight: 4, color: '#E1F3FE' }, { value: '3', weight: 3, color: '#FBF3DB' },
    ], labelSet: [{ startIndex: 0, endIndex: 3, label: '11', showBelow: true }] },
    { x: 330, y: 525, omdType: 'numberLine', min: 0, max: 12, increment: 1, dotValues: [4], specialNumbers: [{ value: 4, label: 'x' }], totalWidth: 640 },
];

export function renderCanvas(root) {
    const stage = h('div.canvas-stage');
    const overlay = h('div.select-box');
    stage.append(overlay);

    const canvas = new omdCanvas(stage, { width: WIDTH, height: HEIGHT });
    canvas.svg.setViewbox(WIDTH, HEIGHT);
    canvas.svg.svgObject.classList.add('canvas-svg');

    const items = [];
    let selected = null;

    const listEl = h('ul.item-list');
    const scaleIn = h('input', { type: 'range', min: 0.3, max: 2, step: 0.05, value: 1, disabled: true, 'aria-label': 'Scale' });
    const scaleOut = h('span.mono', '1.00×');
    const removeBtn = h('button.btn.ghost.small', { type: 'button', disabled: true, onclick: () => selected && removeItem(selected) }, 'Remove');
    const addSelect = h('select', ALL_TYPES.map((t) => h('option', { value: t }, TYPES[t].name)));
    const exportPre = h('pre.code.log.export');
    const errorBox = h('div');

    function add(spec) {
        const { x = 0, y = 0, scale = 1, ...config } = spec;
        let component;
        try {
            component = createFromJSON(structuredClone(config));
        } catch (error) {
            errorBox.replaceChildren();
            showError(errorBox, error);
            return null;
        }
        canvas.add(component, { x, y, scale });
        const item = { component, config, x, y, scale };
        items.push(item);
        makeDraggable(item);
        sync();
        return item;
    }

    function removeItem(item) {
        canvas.remove(item.component);
        items.splice(items.indexOf(item), 1);
        select(null);
    }

    function select(item) {
        selected = item;
        scaleIn.disabled = !item;
        removeBtn.disabled = !item;
        if (item) scaleIn.value = item.scale;
        sync();
    }

    function toCanvas(e) {
        const r = canvas.svg.svgObject.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (WIDTH / r.width), y: (e.clientY - r.top) * (HEIGHT / r.height) };
    }

    function makeDraggable(item) {
        const el = item.component.svgObject;
        // A transparent backing rect makes the whole bounding box grabbable, not just painted strokes.
        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hit.setAttribute('width', item.component.width || 0);
        hit.setAttribute('height', item.component.height || 0);
        hit.setAttribute('fill', 'transparent');
        el.insertBefore(hit, el.firstChild);
        el.style.cursor = 'grab';
        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            select(item);
            const start = toCanvas(e);
            const origin = { x: item.x, y: item.y };
            el.setPointerCapture(e.pointerId);
            el.style.cursor = 'grabbing';
            const move = (ev) => {
                const p = toCanvas(ev);
                item.x = Math.round(origin.x + p.x - start.x);
                item.y = Math.round(origin.y + p.y - start.y);
                canvas.move(item.component, item.x, item.y);
                sync();
            };
            const up = () => {
                el.style.cursor = 'grab';
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerup', up);
                el.removeEventListener('pointercancel', up);
            };
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', up);
            el.addEventListener('pointercancel', up);
        });
    }

    function sync() {
        scaleOut.textContent = `${Number(selected?.scale ?? 1).toFixed(2)}×`;
        listEl.replaceChildren(...items.map((item) => h('li', {
            class: item === selected ? 'on' : null,
            onclick: () => select(item),
        }, h('span', TYPES[item.config.omdType]?.name || item.config.omdType), h('span.mono', `${item.x}, ${item.y}`))));

        exportPre.textContent = json({
            width: WIDTH,
            height: HEIGHT,
            components: items.map((i) => ({ omdType: i.config.omdType, x: i.x, y: i.y, ...(i.scale !== 1 ? { scale: i.scale } : {}), '…': '' })),
        }).replace(/,\n\s+"…": ""/g, ', …');

        if (!selected) {
            overlay.style.display = 'none';
            return;
        }
        const s = stage.getBoundingClientRect();
        const b = selected.component.svgObject.getBoundingClientRect();
        Object.assign(overlay.style, {
            display: 'block',
            left: `${b.left - s.left - 6}px`,
            top: `${b.top - s.top - 6}px`,
            width: `${b.width + 12}px`,
            height: `${b.height + 12}px`,
        });
    }

    scaleIn.addEventListener('input', () => {
        if (!selected) return;
        selected.scale = Number(scaleIn.value);
        canvas.scale(selected.component, selected.scale);
        sync();
    });

    canvas.svg.svgObject.addEventListener('pointerdown', (e) => {
        if (e.target === canvas.svg.svgObject) select(null);
    });

    function resetScene() {
        canvas.clear();
        items.length = 0;
        SCENE.forEach(add);
        select(null);
    }

    const head = h('header.page-head.wrap',
        h('span.kicker', 'omdCanvas'),
        h('h1', 'Compose a board ', h('em', 'from many visuals.')),
        h('p.lede', 'omdCanvas is a multi-object SVG stage: add components at explicit positions, then move, scale or remove each one. Drag anything below; the scene JSON on the right is the shape omdCanvas.loadFromJSON() accepts.'),
    );

    const panel = h('aside.canvas-panel',
        h('div.side-label', 'Items — click or drag'),
        listEl,
        h('div.side-label', 'Selected'),
        h('div.inline-form', scaleIn, scaleOut, removeBtn),
        h('div.side-label', 'Add a visual'),
        h('div.inline-form', addSelect, h('button.btn.small', {
            type: 'button',
            onclick: () => {
                const item = add({ x: 60 + Math.round(Math.random() * 400), y: 60 + Math.round(Math.random() * 300), ...stripComment(featuredSample(addSelect.value)) });
                if (item) select(item);
            },
        }, 'Add')),
        errorBox,
        h('div.inline-form',
            h('button.btn.ghost.small', { type: 'button', onclick: resetScene }, 'Reset scene'),
            h('button.btn.ghost.small', { type: 'button', onclick: () => { canvas.clear(); items.length = 0; select(null); } }, 'Clear'),
        ),
        h('div.side-label', 'Scene'),
        exportPre,
        h('button.link.mono', { type: 'button', onclick: (e) => copyText(json({ width: WIDTH, height: HEIGHT, components: items.map((i) => ({ ...i.config, x: i.x, y: i.y, ...(i.scale !== 1 ? { scale: i.scale } : {}) })) }), e.currentTarget) }, 'Copy full scene JSON'),
    );

    root.append(head, h('section.wrap.canvas-layout', h('div.canvas-frame', h('div.chrome', h('i'), h('i'), h('i'), h('span.mono', 'omdCanvas · 1040 × 620')), stage), panel));
    resetScene();

    const onResize = () => sync();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
}
