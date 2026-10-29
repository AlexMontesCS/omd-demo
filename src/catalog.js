import { omdSamples, omdSchemas } from '@teachinglab/omd';

// Every omdType the library ships, grouped the way the README groups them.
export const CATEGORIES = [
    {
        id: 'algebra',
        title: 'Expressions & equations',
        blurb: 'Typeset algebra parsed from plain strings, equation stacks aligned on the equals sign, worked solutions, and algebra tiles.',
        types: ['expression', 'equation', 'equationStack', 'equationWork', 'tileEquation'],
    },
    {
        id: 'number',
        title: 'Number & ratio models',
        blurb: 'Number lines, balance hangers, tape diagrams, ratio charts and spinners for whole-number and proportional reasoning.',
        types: ['numberLine', 'doubleNumberLine', 'balanceHanger', 'tapeDiagram', 'doubleTapeDiagram', 'ratioChart', 'spinner'],
    },
    {
        id: 'fractions',
        title: 'Fraction models',
        blurb: 'Exact rational arithmetic all the way down: area diagrams, partial-product area models, strips, circles, and fraction algorithms worked step by step.',
        types: ['areaDiagram', 'areaModel', 'fractionStrips', 'fractionCircle', 'fractionWork', 'fractionAreaModel'],
    },
    {
        id: 'algorithms',
        title: 'Algorithms & text',
        blurb: 'Standard algorithms on a place-value grid with step reveal, prose with inline typeset math, and standalone labels.',
        types: ['algorithmWork', 'mathText', 'label'],
    },
    {
        id: 'data',
        title: 'Graphing & data',
        blurb: 'Coordinate planes with graphed equations, sliders and point plotting; value tables generated from equations; line plots over fraction-aware axes.',
        types: ['coordinatePlane', 'table', 'linePlot'],
    },
    {
        id: 'shapes',
        title: 'Shapes & geometry',
        blurb: 'Labeled 2D and 3D figures: rectangles, prisms built from unit cubes, cylinders, triangles, circles, ellipses, angles and regular polygons.',
        types: ['rectangle', 'rectangularPrism', 'cylinder', 'rightTriangle', 'isoscelesTriangle', 'circle', 'ellipse', 'angle', 'regularPolygon'],
    },
];

// name: display name; cls: exported class; blurb: one-line purpose;
// featured: sample index used on the overview cards.
export const TYPES = {
    expression:        { name: 'Expression',          cls: 'omdExpression',        featured: 6,  blurb: 'A math expression typeset from a plain string such as 3*x + 2.' },
    equation:          { name: 'Equation',            cls: 'omdEquation',          featured: 8,  blurb: 'A single equation with an equals sign, laid out as one centered line.' },
    equationStack:     { name: 'Equation stack',      cls: 'omdEquationStack',     featured: 6,  blurb: 'Several equations stacked and aligned on the equals sign.' },
    equationWork:      { name: 'Equation work',       cls: 'omdEquationWork',      featured: 3,  blurb: 'A worked solution: equation rows, operations applied to both sides, and rule lines.' },
    tileEquation:      { name: 'Tile equation',       cls: 'omdTileEquation',      featured: 3,  blurb: 'Algebra tiles for x, −x, 1 and −1 on each side of an equation.' },
    numberLine:        { name: 'Number line',         cls: 'omdNumberLine',        featured: 4,  blurb: 'A number line with dots, special labels, arrows, and an optional interactive mode.' },
    doubleNumberLine:  { name: 'Double number line',  cls: 'omdDoubleNumberLine',  featured: 4,  blurb: 'Two aligned number lines for comparing quantities in a ratio.' },
    balanceHanger:     { name: 'Balance hanger',      cls: 'omdBalanceHanger',     featured: 6,  blurb: 'A hanger diagram with variable and number weights; it tilts when the sides differ.' },
    tapeDiagram:       { name: 'Tape diagram',        cls: 'omdTapeDiagram',       featured: 8,  blurb: 'A part-whole tape with labeled segments and braces.' },
    doubleTapeDiagram: { name: 'Double tape diagram', cls: 'omdDoubleTapeDiagram', featured: 5,  blurb: 'Two stacked tapes for comparing quantities.' },
    ratioChart:        { name: 'Ratio chart',         cls: 'omdRatioChart',        featured: 10, blurb: 'A ratio drawn as a pie, dots, or bars.' },
    spinner:           { name: 'Spinner',             cls: 'omdSpinner',           featured: 8,  blurb: 'A probability spinner with equal sectors and a pointer.' },
    areaDiagram:       { name: 'Area diagram',        cls: 'omdAreaDiagram',       featured: 1,  blurb: 'An area model on a unit grid with fractional side lengths; shadeable, resizable and gradable.' },
    areaModel:         { name: 'Area model',          cls: 'omdAreaModel',         featured: 0,  blurb: 'A not-to-scale partial-products area model with a computed sum line.' },
    fractionStrips:    { name: 'Fraction strips',     cls: 'omdFractionStrips',    featured: 0,  blurb: 'Equal-sharing strips showing a ÷ b and a × 1/b on one diagram.' },
    fractionCircle:    { name: 'Fraction circle',     cls: 'omdFractionCircle',    featured: 0,  blurb: 'Circles cut into equal wedges with some shaded.' },
    fractionWork:      { name: 'Fraction work',       cls: 'omdFractionWork',      featured: 1,  blurb: 'Fraction ×, ÷, +, − worked line by line from the two operands alone.' },
    fractionAreaModel: { name: 'Fraction area model', cls: 'omdFractionAreaModel', featured: 0,  blurb: '“a/b of c/d” built up on a unit square in three captioned panels.' },
    algorithmWork:     { name: 'Algorithm work',      cls: 'omdAlgorithmWork',     featured: 1,  blurb: 'US standard algorithms on a place-value grid, with carries, borrows and step reveal.' },
    mathText:          { name: 'Math text',           cls: 'omdMathText',          featured: 1,  blurb: 'Prose with inline typeset math, rendered as translatable HTML.' },
    label:             { name: 'Label',               cls: 'omdLabel',             featured: 4,  blurb: 'A standalone text label for headings and captions.' },
    coordinatePlane:   { name: 'Coordinate plane',    cls: 'omdCoordinatePlane',   featured: 10, blurb: 'A Cartesian plane with graphed equations, points, segments, shape overlays and sliders.' },
    table:             { name: 'Table',               cls: 'omdTable',             featured: 15, blurb: 'A value table generated from an equation or given as data; cells can be editable.' },
    linePlot:          { name: 'Line plot',           cls: 'omdLinePlot',          featured: 0,  blurb: 'Stacked X or dot marks over an axis that labels its own fractional ticks.' },
    rectangle:         { name: 'Rectangle',           cls: 'omdRectangle',         featured: 6,  blurb: 'A rectangle with side and center labels.' },
    rectangularPrism:  { name: 'Rectangular prism',   cls: 'omdRectangularPrism',  featured: 15, blurb: 'A 3D prism with dimension labels, optionally drawn as stacked unit cubes.' },
    cylinder:          { name: 'Cylinder',            cls: 'omdCylinder',          featured: 4,  blurb: 'A cylinder with radius and height labels.' },
    rightTriangle:     { name: 'Right triangle',      cls: 'omdRightTriangle',     featured: 6,  blurb: 'A right triangle with leg and hypotenuse labels.' },
    isoscelesTriangle: { name: 'Isosceles triangle',  cls: 'omdIsoscelesTriangle', featured: 6,  blurb: 'An isosceles triangle with base and height.' },
    circle:            { name: 'Circle',              cls: 'omdCircle',            featured: 8,  blurb: 'A circle with optional radius, diameter, points and segments.' },
    ellipse:           { name: 'Ellipse',             cls: 'omdEllipse',           featured: 6,  blurb: 'An ellipse sized by its horizontal and vertical extents.' },
    angle:             { name: 'Angle',               cls: 'omdAngle',             featured: 6,  blurb: 'Rays from a shared vertex with arc markers and angle labels.' },
    regularPolygon:    { name: 'Regular polygon',     cls: 'omdRegularPolygon',    featured: 4,  blurb: 'A regular polygon with any number of sides.' },
};

export const ALL_TYPES = CATEGORIES.flatMap((c) => c.types);

export function samplesFor(type) {
    return omdSamples[type] || [];
}

export function schemaFor(type) {
    return omdSchemas[type] || null;
}

export function categoryOf(type) {
    return CATEGORIES.find((c) => c.types.includes(type));
}

export function featuredSample(type) {
    const list = samplesFor(type);
    const i = TYPES[type]?.featured ?? 0;
    return list[Math.min(i, list.length - 1)];
}

/** Sample JSON without the authoring comment, deep-copied so renders never share state. */
export function stripComment(sample) {
    const { _comment, ...rest } = sample;
    return structuredClone(rest);
}

export const TOTAL_SAMPLES = ALL_TYPES.reduce((n, t) => n + samplesFor(t).length, 0);
