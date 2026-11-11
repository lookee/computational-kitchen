# Yogurt Computational Lab — sources / sorgenti

Editable application files: `src/`. Public standalone app: [`../yogurt-computational-lab.html`](../yogurt-computational-lab.html).

```sh
node --test yogurt-lab/tests/*.test.cjs
node yogurt-lab/build.mjs
```

The build embeds all CSS, JavaScript and nutrient reference data into a single offline-ready HTML file. / La build incorpora CSS, JavaScript e dati nutrizionali in un solo HTML autonomo.

**Italiano / English:** the selector remembers the chosen language; `?lang=it` and `?lang=en` open a specific language. Both work in the standalone offline file. Presentation messages are in `src/translations.js`; `src/i18n.js` translates generated UI and exports without changing recipe identifiers, numerical models or notebook data. Personal names and notes are not translated. / Il selettore memorizza la lingua; i parametri URL aprono direttamente italiano o inglese. Anche la versione offline include entrambe le lingue.

Whole-egg scaling uses the nearest count suggested by pan area, then scales every ingredient by total shelled egg mass / reference egg mass. The default 50 g per egg is an estimate; a measured total uses all the selected eggs. `geometryScale` and effective `scale` are separate, so thermal depth, nutrition and the simulation use the actual recipe. Existing notebook entries retain historical area scaling; loading one as a new recipe enables whole eggs. / Le dosi proposte usano uova intere; il peso misurato sostituisce la stima, senza scarti. Le prove storiche mantengono i calcoli originali.

`nutrition-sources.json` preserves USDA identifiers, original values, manufacturer labels and transformations. Bubble physics is an uncalibrated model with explicit assumptions, not a validated prediction. / Le fonti originali sono conservate nel JSON; il modello delle bolle è esplorativo e non validato.

Sources and models: GPL-3.0-only, ©2026 Luca Amore. See the repository LICENSE. / Vedi LICENSE nella radice.
