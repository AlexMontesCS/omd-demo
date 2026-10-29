import { h, json, copyText } from '../dom.js';
import { createScope } from '../render.js';
import { CATEGORIES, TYPES, ALL_TYPES, samplesFor, schemaFor, categoryOf, stripComment } from '../catalog.js';

export function renderType(root, type) {
    if (!TYPES[type]) {
        root.append(h('div.wrap.empty', h('h2', 'Unknown visual type'), h('p', h('a', { href: '#/catalog' }, 'Back to the catalog'))));
        return null;
    }

    const scope = createScope();
    const meta = TYPES[type];
    const schema = schemaFor(type);
    const samples = samplesFor(type);
    const cat = categoryOf(type);
    const at = ALL_TYPES.indexOf(type);
    const prev = ALL_TYPES[at - 1];
    const next = ALL_TYPES[at + 1];

    const sidebar = h('aside.sidebar',
        CATEGORIES.map((c) => h('div.side-group',
            h('div.side-title', c.title),
            c.types.map((t) => h('a', { href: `#/type/${t}`, class: t === type ? 'on' : null },
                TYPES[t].name, h('span', String(samplesFor(t).length)))),
        )),
    );

    const head = h('header.type-head',
        h('a.crumb.mono', { href: `#/catalog` }, `Catalog / ${cat.title}`),
        h('h1', meta.name),
        h('p.lede', meta.blurb),
        h('div.tags',
            h('span.tag.mono', meta.cls),
            h('span.tag.mono', `omdType: "${type}"`),
            h('span.tag.mono', `${schema?.fields.length ?? 0} fields`),
        ),
        schema?.notes ? h('p.note', schema.notes) : null,
    );

    const grid = h('div.sample-grid', samples.map((sample, i) => sampleCard(type, sample, i, scope)));

    const fields = schema ? h('section.fields',
        h('h2', 'Field reference'),
        h('p.muted', 'From the schema that ships with the package (', h('code', '@teachinglab/omd/schema'), ').'),
        fieldTable(schema.fields),
    ) : null;

    const pager = h('div.pager',
        prev ? h('a', { href: `#/type/${prev}` }, h('small', 'Previous'), TYPES[prev].name) : h('span'),
        next ? h('a.next', { href: `#/type/${next}` }, h('small', 'Next'), TYPES[next].name) : h('span'),
    );

    root.append(h('div.type-layout.wrap', sidebar, h('div.type-main',
        head,
        h('div.sample-head', h('h2', `${samples.length} sample configurations`),
            h('a.btn.ghost.small', { href: `#/playground/${type}/0` }, 'Open in playground')),
        grid, fields, pager,
    )));

    return () => scope.dispose();
}

function sampleCard(type, sample, i, scope) {
    const config = stripComment(sample);
    const stage = h('div.stage.sample-stage');
    scope.lazy(stage, config, { maxScale: 1.6 });
    const code = h('pre.code.json', json(config));
    const details = h('details', h('summary.mono', 'JSON'), code);
    const copy = h('button.link.mono', { type: 'button', onclick: (e) => copyText(json(config), e.currentTarget) }, 'Copy');
    return h('figure.sample-card',
        stage,
        h('figcaption',
            h('span.idx.mono', String(i + 1).padStart(2, '0')),
            h('span', sample._comment || ''),
        ),
        h('div.sample-actions', details, h('div.actions', copy, h('a.link.mono', { href: `#/playground/${type}/${i}` }, 'Edit'))),
    );
}

export function fieldTable(fields) {
    return h('div.table-wrap', h('table.fields-table',
        h('thead', h('tr', h('th', 'Field'), h('th', 'Type'), h('th', 'Default'), h('th', 'Description'))),
        h('tbody', fields.map((f) => h('tr',
            h('td', h('code', f.name), f.optional === false ? h('span.req', 'required') : null),
            h('td.mono', formatType(f.type)),
            h('td.mono', f.default === undefined ? '—' : JSON.stringify(f.default)),
            h('td', f.description || ''),
        ))),
    ));
}

function formatType(type) {
    if (Array.isArray(type)) return type.join(' | ');
    if (type && typeof type === 'object') return JSON.stringify(type);
    return String(type ?? '');
}
