# Pizza Lab · gas-cell simulation

The existing calculator remains in `../pizza-computational-lab.html`. The new 3D population model and viewer are maintained in `src/` and embedded into that HTML, preserving the single-file offline app.

```sh
node pizza-lab/build.mjs
node --test pizza-lab/tests/*.test.cjs
```

The model explores a **local rim sample**, from fermentation through shaping to baking. It reuses Pizza Lab's actual yeast dose, thermal trajectory and unnormalised strength model. It deliberately ignores the personal observed timing window: observations of a good stretching window do not measure gas volume.

Recipe inputs: refined soft-wheat flour / W assumption, hydration, fresh yeast ratio, salt, oil, direct/poolish/biga, preferment share and history, proofing and refrigeration, initial dough temperature, thermal lag and activation energy, autolyse, ball weight and baking duration. Additional assumptions are visible and editable in the app: pizza diameter, gluten development, initial air and cell count, gas potential and retention, shaping loss, film drainage, surface tension, oven temperature and thermal lag, matrix setting, steam pressure and random seed. Oven changes reset the oven temperature and lag to indicative defaults. A fixed seed makes comparisons reproducible.

W changes only the inherited phenomenological strength assumption. Producer protein and P/L values are not turned into invented kinetics. Unsupported flour types show an explanation rather than fictional results. Sources in the app support the mechanisms, **not the chosen coefficients**.

Gas-cell growth solves a quasi-static ideal-gas / Laplace / setting-elasticity balance. CO₂ is tracked in cells, a transfer reservoir, and losses; mergers conserve it and shaping moves a configurable fraction to losses. Baking production is deliberately disabled in this first model: existing gas expands and the reservoir transfers, while a lumped temperature law drives setting. Steam is a separate capped pressure term, with no water balance. Whole-pizza geometry, heat gradients, evaporation, acidification, enzymatic effects and real rheology require further work. Equivalent spheres can overlap or cross the sample boundary; volume porosity is not a measurement of the rendered section.

Both views use the same stored 3D population. The section shows sphere/plane intersections, and the oblique volume view projects all cells. Sliders and replay read cached snapshots rather than rerunning the solver. The simulation is deterministic and runs entirely offline, without external runtime dependencies.
