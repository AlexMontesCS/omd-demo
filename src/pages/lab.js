import {
    createFromJSON,
    inlineMathToPlainText,
    renderInlineMathToHTML,
    ensureInlineMathStyles,
} from '@teachinglab/omd';
import { h, json } from '../dom.js';
import { createScope, showError, refit } from '../render.js';
import { samplesFor, stripComment } from '../catalog.js';

const SECTIONS = [
    ['input', 'Student input'],
    ['steps', 'Step-by-step reveal'],
    ['algebra', 'Live algebra'],
    ['text', 'Inline math text'],
];

export function renderLab(root, { params } = {}) {
    const scope = createScope();
    ensureInlineMathStyles();

    const head = h('header.page-head.wrap',
        h('span.kicker', 'Interactive lab'),
        h('h1', 'Drag it, shade it, ', h('em', 'step through it.')),
        h('p.lede', 'Each figure below is a live OMD component. The panel beside it shows the exact change payload the component emits, so you can see what a host app receives.'),
        h('div.chips', SECTIONS.map(([id, label]) => h('a.chip', { href: `#/lab?s=${id}` }, label))),
    );

    root.append(head,
        group('input', 'Student input', 'Six components take pointer and keyboard input. Every gesture fires a bubbling DOM event (and omdDisplay’s onChange) carrying the full state.', [
            numberLineDemo(scope),
            planeSlidersDemo(scope),
            plotModeDemo(scope),
            tableDemo(scope),
            areaPaintDemo(scope),
            areaResizeDemo(scope),
            stripsDemo(scope),
            circleDemo(scope),
        ]),
        group('steps', 'Step-by-step reveal', 'Algorithm and fraction work reveal one step at a time. The layout is sized for the finished work, so stepping never reflows the figure.', [
            fractionWorkDemo(scope),
            algorithmDemo(scope),
            fractionAreaDemo(scope),
        ]),
        group('algebra', 'Live algebra', 'Strings are parsed with math.js and typeset. Type anything.', [
            expressionDemo(scope),
            stackDemo(scope),
            hangerDemo(scope),
        ]),
        group('text', 'Inline math text', 'Word problems with typeset math inside the sentence. The same grammar ships standalone at @teachinglab/omd/text for React and SSR.', [
            mathTextDemo(scope),
        ]),
    );

    const target = params?.get('s');
    if (target) requestAnimationFrame(() => document.getElementById(`lab-${target}`)?.scrollIntoView());

    return () => scope.dispose();
}

// ---------- layout helpers ----------

function group(id, title, blurb, demos) {
    return h('section.wrap.lab-group', { id: `lab-${id}` },
        h('div.sec-head', h('div', h('span.eyebrow', `${demos.length} demo${demos.length === 1 ? '' : 's'}`), h('h2', title))),
        h('p.sec-blurb', blurb),
        demos,
    );
}

function demo({ title, body, stage, panel, wide = false }) {
    return h(`article.demo.reveal${wide ? '.wide' : ''}`,
        h('div.demo-main', h('div.demo-title', h('h3', title), body ? h('p.muted', body) : null), stage),
        h('div.demo-side', panel),
    );
}

function eventLog(label = 'Last change event') {
    const name = h('div.log-name.mono', 'Waiting for input…');
    const body = h('pre.code.log', '{}');
    const el = h('div.log', h('div.side-label', label), name, body);
    return {
        el,
        show(eventName, payload) {
            name.textContent = eventName;
            body.textContent = json(payload);
        },
    };
}

function listen(stage, eventName, log, extra) {
    stage.addEventListener(eventName, (e) => {
        log.show(eventName, e.detail);
        extra?.(e.detail);
    });
}

function status(text = '') {
    return h('div.status', text);
}

function setStatus(el, ok, text) {
    el.textContent = text;
    el.className = `status ${ok === true ? 'ok' : ok === false ? 'bad' : ''}`;
}

// ---------- student input ----------

function numberLineDemo(scope) {
    const stage = h('div.stage.lab-stage.nl-stage');
    const log = eventLog();
    listen(stage, 'omd-numberline-change', log);
    scope.mount(stage, {
        omdType: 'numberLine', min: -10, max: 10, increment: 1,
        dotValues: [{ value: -3, color: '#2386DB' }, { value: 4, color: 'black' }],
        interactive: true, interactiveRange: true, rangeValues: [-2, 6],
        rangeStartStyle: 'closed', rangeEndStyle: 'arrow', snapStep: 0.5,
        showRightArrow: true, showLeftArrow: true, totalWidth: 640,
    }, { maxScale: 1.5 });
    return demo({
        title: 'Number line — dots and an interval',
        body: 'Click the line to add a dot, drag to move, double-click or press Delete to remove. Drag the blue interval handles. Focused dots move with the arrow keys; snapping is every 0.5.',
        stage,
        panel: log.el,
    });
}

function planeSlidersDemo(scope) {
    const stage = h('div.stage.lab-stage.tall');
    const config = {
        omdType: 'coordinatePlane', xMin: -6, xMax: 6, yMin: -6, yMax: 6, size: 'large',
        interactive: true,
        variables: [
            { name: 'a', value: 0.5, min: -2, max: 2, step: 0.25 },
            { name: 'h', value: 1, min: -4, max: 4, step: 0.5 },
            { name: 'k', value: -3, min: -5, max: 5, step: 0.5 },
        ],
        graphEquations: [
            { equation: 'y = a*(x - h)^2 + k', color: '#1F6C9F', strokeWidth: 3 },
            { equation: 'y = x', color: '#c0c0bb', strokeWidth: 1.5 },
        ],
    };
    scope.mount(stage, config, { maxScale: 1.4 });
    return demo({
        title: 'Coordinate plane — variable sliders',
        body: 'Equations may reference named variables. With interactive: true, each variable gets a slider and the graph redraws as it moves.',
        stage,
        panel: h('div.log', h('div.side-label', 'Config'), h('pre.code.log', json(config))),
    });
}

function plotModeDemo(scope) {
    const stage = h('div.stage.lab-stage.tall');
    const log = eventLog();
    const result = status('Plot 4 points that lie on y = 2x − 1.');
    let plane = null;
    listen(stage, 'omd-coordinateplane-change', log, () => {
        const points = plane.getPlottedPoints();
        const on = points.filter(([x, y]) => y === 2 * x - 1).length;
        const off = points.length - on;
        if (on >= 4 && off === 0) setStatus(result, true, `All ${on} points lie on y = 2x − 1.`);
        else setStatus(result, off ? false : null, `${on} on the line${off ? `, ${off} off it` : ''}. Need 4.`);
    });
    ({ component: plane } = scope.mount(stage, {
        omdType: 'coordinatePlane', xMin: -5, xMax: 5, yMin: -7, yMax: 7, size: 'large',
        plotMode: true, plotSnap: 1, maxPlottedPoints: 6, plotPointColor: '#1F6C9F',
        plottedPoints: [[0, -1]],
    }, { maxScale: 1.6 }));
    return demo({
        title: 'Coordinate plane — plot mode',
        body: 'Hover to preview a snapped point with guides to both axes; click to add it, click an existing point to remove it. The check below reads getPlottedPoints() on every change.',
        stage,
        panel: [h('div.side-label', 'Task'), result, log.el],
    });
}

function tableDemo(scope) {
    const stage = h('div.stage.lab-stage.table-stage');
    const log = eventLog();
    const result = status('Fill in the blanks for y = 3x + 2.');
    const data = [[0, 2], [1, null], [2, null], [3, 11], [4, null], [5, null]];
    listen(stage, 'omd-table-change', log, (detail) => {
        const values = detail.editableValues || {};
        const blanks = data.map((row, r) => [row, r]).filter(([row]) => row[1] === null);
        let right = 0;
        let filled = 0;
        for (const [row, r] of blanks) {
            const v = values[`${r},1`];
            if (v === undefined || v === '') continue;
            filled += 1;
            if (Number(v) === 3 * row[0] + 2) right += 1;
        }
        if (right === blanks.length) setStatus(result, true, 'Every blank is correct.');
        else setStatus(result, filled > right ? false : null, `${right} of ${blanks.length} correct.`);
    });
    scope.mount(stage, {
        omdType: 'table', headers: ['x', 'y = 3x + 2'], data, editable: true,
        alternatingRowColors: true, title: 'Complete the table',
    });
    return demo({
        title: 'Table — editable cells',
        body: 'Blank cells become inputs inside the SVG. Typing emits the values without rebuilding the table or losing focus.',
        stage,
        panel: [h('div.side-label', 'Task'), result, log.el],
    });
}

function areaPaintDemo(scope) {
    const stage = h('div.stage.lab-stage');
    const log = eventLog();
    listen(stage, 'omd-areadiagram-change', log);
    scope.mount(stage, stripComment(samplesFor('areaDiagram').find((s) => s.checkAnswers) || samplesFor('areaDiagram')[0]));
    return demo({
        title: 'Area diagram — paint and answer',
        body: 'Press and drag across the grid to shade quarter-unit cells, then type the area. Answers are compared as exact rationals, so 3/2, 1 1/2 and 1.5 all match.',
        stage,
        panel: log.el,
    });
}

function areaResizeDemo(scope) {
    const stage = h('div.stage.lab-stage.tall');
    const log = eventLog();
    listen(stage, 'omd-areadiagram-change', log);
    scope.mount(stage, {
        omdType: 'areaDiagram', columns: 4, rows: 3, columnParts: 3, rowParts: 4,
        shadeWidth: '2 2/3', shadeHeight: '1 1/2', partitionScope: 'last',
        showLabels: true, decompose: true, decomposeAxis: 'both',
        interactive: true, allowResize: true, allowPaint: false, unitScale: 72,
        inputs: [{ label: 'Expression:', readout: 'expression' }, { label: 'Area:', readout: 'area' }],
    });
    return demo({
        title: 'Area diagram — resize and decompose',
        body: 'Drag the handles on the shaded rectangle; side lengths snap to the partitions. The decomposition into whole and fractional partial products updates as you go.',
        stage,
        panel: log.el,
    });
}

function stripsDemo(scope) {
    const stage = h('div.stage.lab-stage');
    const log = eventLog();
    const total = status('Shaded: 0');
    listen(stage, 'omd-fractionstrips-change', log, (d) => {
        const fair = d.shadedCount === 3 && new Set(d.shadedCells.map((c) => c.split(',')[0])).size === 3;
        setStatus(total, fair ? true : null, `Shaded: ${d.total}${fair ? ' — one fourth of each sandwich, 3 × 1/4 = 3/4' : ''}`);
    });
    scope.mount(stage, {
        omdType: 'fractionStrips', strips: 3, parts: 4, shaded: 0, interactive: true, brace: '1',
    });
    return demo({
        title: 'Fraction strips — click or drag to shade',
        body: 'Three sandwiches shared by four people. Shade one share on each strip. The change payload carries the total as an exact fraction.',
        stage,
        panel: [h('div.side-label', 'Total from the payload'), total, log.el],
    });
}

function circleDemo(scope) {
    const stage = h('div.stage.lab-stage');
    const log = eventLog();
    const total = status('Shaded: 0');
    listen(stage, 'omd-fractioncircle-change', log, (d) => setStatus(total, null, `Shaded: ${d.total}`));
    scope.mount(stage, {
        omdType: 'fractionCircle', count: 3, parts: 6, shaded: 0, interactive: true,
    });
    return demo({
        title: 'Fraction circles — click wedges',
        body: 'Click wedges to toggle them. The total is kept as an exact mixed number.',
        stage,
        panel: [h('div.side-label', 'Total from the payload'), total, log.el],
    });
}

// ---------- step reveal ----------

/**
 * A step player around one component. build(step) returns the JSON for a
 * given step; info(component, json) returns { total, min, labels[] }.
 */
function stepper(scope, { build, info, controls = null, start = 0 }) {
    const stage = h('div.stage.lab-stage.tall');
    const caption = h('div.step-caption');
    const counter = h('span.mono.counter');
    const list = h('ol.step-list');
    const display = scope.display(stage);
    let step = start;
    let meta = { total: 0, min: 0, labels: [] };
    let timer = null;

    function render() {
        stage.querySelector('.render-error')?.remove();
        let config;
        let component;
        try {
            config = build(step);
            component = createFromJSON(config);
            display.load(component);
            refit(display);
        } catch (error) {
            display.clear();
            showError(stage, error);
            caption.textContent = '';
            list.replaceChildren();
            counter.textContent = '';
            return;
        }
        meta = info(component, config);
        step = Math.max(meta.min, Math.min(step, meta.total));
        counter.textContent = `${step} / ${meta.total}`;
        caption.innerHTML = step === meta.min && meta.min === 0
            ? 'The problem, before any work.'
            : renderInlineMathToHTML(meta.labels[step - 1] || '');
        list.replaceChildren(...meta.labels.map((label, i) => h('li', {
            class: i + 1 === step ? 'on' : i + 1 < step ? 'done' : null,
            onclick: () => go(i + 1),
            html: renderInlineMathToHTML(label),
        })));
        prevBtn.disabled = step <= meta.min;
        nextBtn.disabled = step >= meta.total;
    }

    function go(n) {
        step = n;
        render();
    }

    function stop() {
        clearInterval(timer);
        timer = null;
        playBtn.textContent = 'Play';
    }

    const prevBtn = h('button.btn.ghost.small', { type: 'button', onclick: () => { stop(); go(step - 1); } }, '← Back');
    const nextBtn = h('button.btn.small', { type: 'button', onclick: () => { stop(); go(step + 1); } }, 'Next step →');
    const playBtn = h('button.btn.ghost.small', {
        type: 'button',
        onclick: () => {
            if (timer) return stop();
            if (step >= meta.total) go(meta.min);
            playBtn.textContent = 'Pause';
            timer = setInterval(() => {
                if (step >= meta.total) return stop();
                go(step + 1);
            }, 1400);
        },
    }, 'Play');
    const resetBtn = h('button.link.mono', { type: 'button', onclick: () => { stop(); go(meta.min); } }, 'Reset');

    const bar = h('div.step-bar', prevBtn, nextBtn, playBtn, resetBtn, counter);
    const panel = h('div.step-panel', controls, h('div.side-label', 'Current step'), caption, h('div.side-label', 'All steps'), list);

    return { stage: h('div', stage, bar), panel, render, reset: () => { stop(); step = start; render(); } };
}

function fractionWorkDemo(scope) {
    const op = h('select', ['multiplication', 'division', 'addition', 'subtraction'].map((o) => h('option', { value: o, selected: o === 'division' }, o)));
    const left = h('input.mono', { value: '3 1/2', size: 6, 'aria-label': 'Left operand' });
    const right = h('input.mono', { value: '1/4', size: 6, 'aria-label': 'Right operand' });
    const presets = [
        ['multiplication', '2/3', '3/4'], ['division', '3 1/2', '1/4'],
        ['addition', '2 1/3', '1 3/4'], ['subtraction', '5', '2 5/8'],
    ];

    const s = stepper(scope, {
        build: (step) => ({ omdType: 'fractionWork', operation: op.value, left: left.value.trim(), right: right.value.trim(), stepIndex: step, showStepsList: false }),
        info: (c) => ({ total: c.getSteps().length, min: 0, labels: c.getSteps().map((x) => x.description) }),
        controls: h('div.controls',
            h('div.side-label', 'Problem'),
            h('div.inline-form', left, op, right),
            h('div.chips', presets.map(([o, l, r]) => h('button.chip', {
                type: 'button',
                onclick: () => { op.value = o; left.value = l; right.value = r; s.reset(); },
            }, `${l} ${{ multiplication: '×', division: '÷', addition: '+', subtraction: '−' }[o]} ${r}`))),
        ),
    });
    for (const el of [op, left, right]) el.addEventListener('input', () => s.reset());
    s.render();

    return demo({
        title: 'Fraction work — any problem, worked from the operands',
        body: 'Enter any whole number, fraction or mixed number. OMD derives every line — renaming, keep-change-flip, common denominators, the GCF — and skips steps that do nothing.',
        stage: s.stage,
        panel: s.panel,
        wide: true,
    });
}

function algorithmDemo(scope) {
    const samples = samplesFor('algorithmWork').map(stripComment);
    const pick = h('select', samples.map((sample, i) => h('option', { value: i }, {
        addition: 'Addition with regrouping', subtraction: 'Subtraction across zeros', division: 'Long division 816 ÷ 12', multiplication: 'Multiplication',
    }[sample.operation] || sample.operation)));
    pick.value = '1';

    const s = stepper(scope, {
        build: (step) => ({ ...samples[Number(pick.value)], stepIndex: step }),
        info: (c, config) => {
            const labels = (config.steps || []).map((x) => x.description || x.label);
            return { total: labels.length || c.getMaxStep(), min: 0, labels };
        },
        controls: h('div.controls', h('div.side-label', 'Algorithm'), pick),
    });
    pick.addEventListener('change', () => s.reset());
    s.render();

    return demo({
        title: 'Algorithm work — place-value grid',
        body: 'Rows and single digits carry step numbers; anything above stepIndex stays hidden. Carries, borrows and crossed-out digits are first-class cells.',
        stage: s.stage,
        panel: s.panel,
        wide: true,
    });
}

function fractionAreaDemo(scope) {
    const left = h('input.mono', { value: '2/3', size: 5, 'aria-label': 'Of fraction' });
    const right = h('input.mono', { value: '3/4', size: 5, 'aria-label': 'Amount fraction' });
    const s = stepper(scope, {
        start: 1,
        build: (step) => ({ omdType: 'fractionAreaModel', left: left.value.trim(), right: right.value.trim(), stepIndex: Math.max(1, step), unitScale: 130 }),
        info: (c) => ({ total: 3, min: 1, labels: c.getCaptions() }),
        controls: h('div.controls', h('div.side-label', 'Problem'), h('div.inline-form', left, h('span', 'of'), right)),
    });
    for (const el of [left, right]) el.addEventListener('input', () => s.reset());
    s.render();

    return demo({
        title: 'Fraction area model — a/b of c/d',
        body: 'Three panels on a unit square: shade c/d, take a/b of the shaded part, then extend the cuts so the overlap reads as a×c of b×d pieces.',
        stage: s.stage,
        panel: s.panel,
        wide: true,
    });
}

// ---------- live algebra ----------

function expressionDemo(scope) {
    const stage = h('div.stage.lab-stage');
    const display = scope.display(stage, { maxScale: 1.6 });
    const input = h('input.mono.wide-input', { value: '(3/4)*x + sqrt(x^2 + 9) = 12', 'aria-label': 'Expression' });
    const presets = ['3*x + 2', 'x^2 + 2*x + 1 = 0', '(3/2)*x + 3', 'sqrt(x + 4) = 5', '2(x + 3) - 4 = 10', '(x + 1)/(x - 1)', 'x^(n + 1)'];

    function draw() {
        stage.querySelector('.render-error')?.remove();
        try {
            display.render(input.value);
        } catch (error) {
            display.clear();
            showError(stage, error);
        }
    }
    input.addEventListener('input', draw);
    draw();

    return demo({
        title: 'Expressions & equations from strings',
        body: 'display.render() detects equations by the equals sign. Fractions stack, powers raise, radicals stretch.',
        stage,
        panel: h('div.controls',
            h('div.side-label', 'Input'), input,
            h('div.chips', presets.map((p) => h('button.chip.mono', { type: 'button', onclick: () => { input.value = p; draw(); } }, p))),
        ),
    });
}

function stackDemo(scope) {
    const stage = h('div.stage.lab-stage');
    const area = h('textarea.mono', { rows: 5, 'aria-label': 'Equations, one per line' });
    area.value = '3(x - 2) + 4 = 19\n3x - 6 + 4 = 19\n3x - 2 = 19\n3x = 21\nx = 7';
    const draw = () => scope.mount(stage, {
        omdType: 'equationStack',
        equations: area.value.split('\n').map((l) => l.trim()).filter(Boolean),
    });
    area.addEventListener('input', draw);
    draw();
    return demo({
        title: 'Equation stack — aligned on =',
        body: 'One equation per line. Every row aligns on its equals sign however long each side is.',
        stage,
        panel: h('div.controls', h('div.side-label', 'Equations'), area),
    });
}

function hangerDemo(scope) {
    const stage = h('div.stage.lab-stage');
    const leftIn = h('input.mono', { value: 'x, x, 3', 'aria-label': 'Left side weights' });
    const rightIn = h('input.mono', { value: '9', 'aria-label': 'Right side weights' });
    const parse = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);
    const draw = () => scope.mount(stage, { omdType: 'balanceHanger', leftValues: parse(leftIn.value), rightValues: parse(rightIn.value) }, { maxScale: 2 });
    leftIn.addEventListener('input', draw);
    rightIn.addEventListener('input', draw);
    draw();
    return demo({
        title: 'Balance hanger builder',
        body: 'Comma-separated weights for each side. Variables render as pills and numbers as rectangles, hanging from their side of the beam.',
        stage,
        panel: h('div.controls',
            h('div.side-label', 'Left side'), leftIn,
            h('div.side-label', 'Right side'), rightIn,
            h('div.chips',
                [['x, x, 3', '9'], ['x, 1, 1, 1', 'x, x'], ['y, y, y', '12'], ['x, x, x, 2', 'x, 8']].map(([l, r]) =>
                    h('button.chip.mono', { type: 'button', onclick: () => { leftIn.value = l; rightIn.value = r; draw(); } }, `${l} | ${r}`))),
        ),
    });
}

// ---------- inline math text ----------

function mathTextDemo(scope) {
    const stage = h('div.stage.lab-stage');
    const area = h('textarea.mono', { rows: 6, 'aria-label': 'Math text markup' });
    area.value = String.raw`**11** A baker has [3/4] of a box of muffin mix. He pours it equally into [6] bowls. How much of a box is in each bowl?` +
        '\n' + String.raw`Then solve \( 4x + 2 = 10 \) and find \( \sqrt{x^2 + 9} \) when the garden is 2 5/8 meters wide.`;
    const plain = h('pre.code.log');
    const html = h('pre.code.log');
    const live = h('div.html-preview');

    function draw() {
        const text = area.value;
        scope.mount(stage, { omdType: 'mathText', text, fontSize: 19, width: 520 });
        try {
            plain.textContent = inlineMathToPlainText(text);
            const markup = renderInlineMathToHTML(text);
            html.textContent = markup;
            live.innerHTML = markup;
        } catch (error) {
            plain.textContent = String(error.message);
        }
    }
    area.addEventListener('input', draw);
    draw();

    return demo({
        title: 'mathText and @teachinglab/omd/text',
        body: 'Markup: \\( LaTeX \\), legacy [3/4] tokens, bare 2 5/8 in prose, **bold**, and line breaks. The SVG figure and the standalone HTML renderer share one grammar.',
        stage: h('div', stage, h('div.side-label', 'renderInlineMathToHTML() → live HTML'), live),
        panel: h('div.controls',
            h('div.side-label', 'Markup'), area,
            h('div.side-label', 'inlineMathToPlainText() — for TTS and grading'), plain,
            h('div.side-label', 'HTML (math runs carry translate="no")'), html,
        ),
        wide: true,
    });
}
