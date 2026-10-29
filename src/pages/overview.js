import { h, reveal } from '../dom.js';
import { createScope } from '../render.js';
import { CATEGORIES, TYPES, ALL_TYPES, TOTAL_SAMPLES, samplesFor, stripComment, featuredSample } from '../catalog.js';

const INTERACTIVE_TYPES = ['numberLine', 'coordinatePlane', 'table', 'areaDiagram', 'fractionStrips', 'fractionCircle'];
const STEPPED_TYPES = ['algorithmWork', 'fractionWork', 'fractionAreaModel'];

const QUICK_START = `import { omdDisplay } from '@teachinglab/omd';

const display = new omdDisplay(document.getElementById('stage'));

display.render('2*x + 3 = 7');                 // strings are parsed and typeset
display.loadFromJSON({                         // every visual is one JSON object
  omdType: 'numberLine', min: 0, max: 10, dotValues: [3, 7],
});`;

const HERO_FIGURES = [
    { omdType: 'fractionWork', operation: 'division', left: '3 1/2', right: '1/4' },
    { omdType: 'coordinatePlane', xMin: -5, xMax: 5, yMin: -5, yMax: 5, size: 'medium',
      graphEquations: [{ equation: 'y = 0.5x^2 - 3', color: '#1F6C9F', strokeWidth: 2.5 }, { equation: 'y = x - 1', color: '#9F2F2D', strokeWidth: 2.5 }],
      dotValues: [[-0.73, -1.73, '#111111'], [2.73, 1.73, '#111111']] },
    { omdType: 'areaModel', columns: ['3', '2/3'], rows: ['2', '1/4'], showSum: true, caption: 'not to scale' },
];

export function renderOverview(root, { scrollToCatalog } = {}) {
    const scope = createScope();

    const hero = h('header.hero.wrap',
        h('span.kicker', '@teachinglab/omd · live catalog'),
        h('h1', 'Every OMD visual, ', h('em', 'rendered live.')),
        h('p.lede',
            `This site renders all ${ALL_TYPES.length} visual types in the OMD library straight from their JSON, `
            + `walks through all ${TOTAL_SAMPLES} sample configurations that ship with the package, and lets you drive `
            + 'the interactive and step-by-step models yourself.'),
        h('div.cta-row',
            h('a.btn', { href: '#/catalog' }, 'Browse the catalog'),
            h('a.btn.ghost', { href: '#/lab' }, 'Open the interactive lab'),
            h('a.btn.ghost', { href: '#/playground' }, 'JSON playground'),
        ),
        h('dl.facts',
            fact('Visual types', ALL_TYPES.length),
            fact('Sample configs', TOTAL_SAMPLES),
            fact('Interactive', INTERACTIVE_TYPES.length, 'with change events'),
            fact('Step reveal', STEPPED_TYPES.length, 'algorithms'),
        ),
    );

    const heroStrip = h('div.hero-strip.wrap.reveal', HERO_FIGURES.map((fig) => {
        const stage = h('div.stage.hero-stage');
        scope.mount(stage, fig);
        return h('figure.panel', stage, h('figcaption.mono', fig.omdType));
    }));

    const features = h('section.wrap.features.reveal',
        h('div.sec-head', h('div', h('span.eyebrow', 'How it works'), h('h2', 'One JSON object in, one SVG figure out.'))),
        h('div.bento',
            h('article.cell.span-2',
                h('h3', 'Quick start'),
                h('p.muted', 'Hand a container to omdDisplay; it sizes the SVG to fit the content and shrinks it to fit the container.'),
                h('pre.code', QUICK_START),
            ),
            feature('Exact arithmetic', 'Lengths and operands accept 4, "2/3" and "3 1/4" and stay exact rationals, so a 3 1/4 by 4 rectangle has area 13 — not 12.999999999999998.'),
            feature('Step-by-step reveal', 'Algorithm and fraction work carry step numbers. Set stepIndex, or call nextStep(), to narrate a solution one line at a time.', '#/lab?s=steps'),
            feature('Student input', 'Number lines, planes, tables, area diagrams, strips and circles accept drags, clicks and typing, and emit change events with the full state.', '#/lab'),
            feature('Translatable prose', 'mathText renders word problems as real HTML with math runs marked translate="no", so page translators rewrite the sentence and leave the math alone.', '#/lab?s=text'),
        ),
    );

    const catalog = h('div#catalog', CATEGORIES.map((cat) => h('section.wrap.category.reveal', { id: `cat-${cat.id}` },
        h('div.sec-head',
            h('div', h('span.eyebrow', `${cat.types.length} types`), h('h2', cat.title)),
        ),
        h('p.sec-blurb', cat.blurb),
        h('div.type-grid', cat.types.map((type) => typeCard(type, scope))),
    )));

    root.append(hero, heroStrip, features, catalog);
    reveal(root);

    if (scrollToCatalog) requestAnimationFrame(() => document.getElementById('catalog')?.scrollIntoView());

    return () => scope.dispose();
}

function fact(label, value, note) {
    return h('div', h('dt', label), h('dd', String(value), note ? h('small', note) : null));
}

function feature(title, body, href) {
    return h('article.cell', h('h3', title), h('p.muted', body), href ? h('a.more', { href }, 'See it live →') : null);
}

function typeCard(type, scope) {
    const meta = TYPES[type];
    const stage = h('div.stage.card-stage');
    scope.lazy(stage, stripComment(featuredSample(type)), { maxScale: 2 });
    const tags = [];
    if (INTERACTIVE_TYPES.includes(type)) tags.push(h('span.tag.blue', 'interactive'));
    if (STEPPED_TYPES.includes(type)) tags.push(h('span.tag.yellow', 'step reveal'));
    return h('a.type-card', { href: `#/type/${type}` },
        stage,
        h('div.type-card-body',
            h('div.type-card-title', h('h3', meta.name), h('span.count.mono', `${samplesFor(type).length} samples`)),
            h('p.muted', meta.blurb),
            h('div.tags', h('span.tag.mono', meta.cls), tags),
        ),
    );
}
