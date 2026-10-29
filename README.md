# omd-demo

A live catalog of [`@teachinglab/omd`](https://www.npmjs.com/package/@teachinglab/omd). Every figure is rendered in the browser from JSON by the published package — no screenshots.

| Page | What it shows |
|---|---|
| **Overview / Catalog** (`#/`) | All 33 visual types grouped by category, each rendered from a representative sample |
| **Type pages** (`#/type/<omdType>`) | Every sample configuration that ships with the package (386 in total), its JSON, and the field reference from the package schema |
| **Interactive lab** (`#/lab`) | Number line, coordinate plane (sliders and plot mode), editable table, area diagram (paint, resize, graded answers), fraction strips and circles — each with its live change payload; step-through players for fraction work, algorithm work and the fraction area model; live expression, equation stack, balance hanger and mathText editors |
| **Canvas** (`#/canvas`) | An `omdCanvas` board with draggable, scalable components and the scene JSON |
| **Playground** (`#/playground`) | Edit any sample's JSON and watch it re-render; shareable links |

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

To demo a new OMD release, bump `@teachinglab/omd` in `package.json`. The catalog, sample pages and field tables read `omdSamples` and `omdSchemas` from the package, so new types and samples appear once they are added to `src/catalog.js`.
