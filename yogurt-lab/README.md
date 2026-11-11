# Yogurt Computational Lab — sources / sorgenti

Editable application files: `src/`. Public standalone app: [`../yogurt-computational-lab.html`](../yogurt-computational-lab.html).

```sh
node --test yogurt-lab/tests/*.test.cjs
node yogurt-lab/build.mjs
```

The build embeds all CSS, JavaScript and nutrient reference data into a single offline-ready HTML file. / La build incorpora CSS, JavaScript e dati nutrizionali in un solo HTML autonomo.

`nutrition-sources.json` preserves USDA identifiers, original values, manufacturer labels and transformations. Bubble physics is an uncalibrated model with explicit assumptions, not a validated prediction. / Le fonti originali sono conservate nel JSON; il modello delle bolle è esplorativo e non validato.

Sources and models: GPL-3.0-only, ©2026 Luca Amore. See the repository LICENSE. / Vedi LICENSE nella radice.
