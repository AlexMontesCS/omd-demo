import { h, json, copyText } from '../dom.js';
import { createScope } from '../render.js';
import { ALL_TYPES, TYPES, samplesFor, schemaFor, stripComment } from '../catalog.js';
import { fieldTable } from './type.js';

function encode(value) {
    return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(value) {
    return decodeURIComponent(escape(atob(value.replace(/-/g, '+').replace(/_/g, '/'))));
}

export function renderPlayground(root, { type, index, params }) {
    const scope = createScope();
    let current = TYPES[type] ? type : 'fractionWork';
    let sampleIndex = Math.max(0, Math.min(Number(index) || 0, samplesFor(current).length - 1));

    const typeSelect = h('select', { 'aria-label': 'Visual type' }, ALL_TYPES.map((t) => h('option', { value: t, selected: t === current }, TYPES[t].name)));
    const sampleSelect = h('select', { 'aria-label': 'Sample' });
    const editor = h('textarea.editor.mono', { spellcheck: false, 'aria-label': 'OMD JSON' });
    const stage = h('div.stage.play-stage');
    const message = h('div.status');
    const note = h('p.muted.small');
    const fieldsHost = h('div');
    const filter = h('input.mono', { placeholder: 'Filter fields…', 'aria-label': 'Filter fields' });

    function fillSamples() {
        const samples = samplesFor(current);
        sampleSelect.replaceChildren(...samples.map((s, i) => h('option', { value: i }, `${String(i + 1).padStart(2, '0')} — ${(s._comment || '').slice(0, 80)}`)));
        sampleSelect.value = String(sampleIndex);
    }

    function loadSample() {
        const sample = samplesFor(current)[sampleIndex];
        editor.value = json(stripComment(sample));
        note.textContent = sample._comment || '';
        draw();
        history.replaceState(null, '', `#/playground/${current}/${sampleIndex}`);
    }

    function showFields() {
        const schema = schemaFor(current);
        const q = filter.value.trim().toLowerCase();
        const fields = (schema?.fields || []).filter((f) => !q || f.name.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q));
        fieldsHost.replaceChildren(fieldTable(fields));
    }

    let timer = null;
    function draw() {
        let config;
        try {
            config = JSON.parse(editor.value);
        } catch (error) {
            message.textContent = `JSON: ${error.message}`;
            message.className = 'status bad';
            return;
        }
        const { error } = scope.mount(stage, config);
        if (error) {
            message.textContent = `Render: ${error.message}`;
            message.className = 'status bad';
        } else {
            message.textContent = `Rendered ${config.omdType}.`;
            message.className = 'status ok';
        }
        if (config.omdType && config.omdType !== current && TYPES[config.omdType]) {
            current = config.omdType;
            typeSelect.value = current;
            fillSamples();
            showFields();
        }
    }

    typeSelect.addEventListener('change', () => {
        current = typeSelect.value;
        sampleIndex = 0;
        fillSamples();
        showFields();
        loadSample();
    });
    sampleSelect.addEventListener('change', () => {
        sampleIndex = Number(sampleSelect.value);
        loadSample();
    });
    editor.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(draw, 220);
    });
    editor.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
    });
    filter.addEventListener('input', showFields);

    const formatBtn = h('button.btn.ghost.small', {
        type: 'button',
        onclick: () => {
            try { editor.value = json(JSON.parse(editor.value)); draw(); } catch { draw(); }
        },
    }, 'Format');
    const copyBtn = h('button.btn.ghost.small', { type: 'button', onclick: (e) => copyText(editor.value, e.currentTarget) }, 'Copy JSON');
    const shareBtn = h('button.btn.small', {
        type: 'button',
        onclick: (e) => {
            const url = `${location.origin}${location.pathname}#/playground?j=${encode(editor.value)}`;
            copyText(url, e.currentTarget);
        },
    }, 'Copy share link');

    root.append(
        h('header.page-head.wrap',
            h('span.kicker', 'Playground'),
            h('h1', 'Edit the JSON, ', h('em', 'watch it redraw.')),
            h('p.lede', 'Start from any of the package samples, change any field, and the figure re-renders as you type. Errors from the parser or the component show below the editor.'),
        ),
        h('section.wrap.play-layout',
            h('div.play-editor',
                h('div.inline-form', typeSelect, sampleSelect),
                note,
                editor,
                h('div.inline-form', formatBtn, copyBtn, shareBtn),
                message,
            ),
            h('div.play-output',
                stage,
                h('div.fields-head', h('h3', 'Fields'), filter),
                fieldsHost,
            ),
        ),
    );

    fillSamples();
    showFields();

    const shared = params?.get('j');
    if (shared) {
        try {
            editor.value = decode(shared);
            note.textContent = 'Loaded from a share link.';
            draw();
        } catch {
            loadSample();
        }
    } else {
        loadSample();
    }

    return () => {
        clearTimeout(timer);
        scope.dispose();
    };
}
