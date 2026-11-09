# Testing notes

Run `npm ci --ignore-scripts` and `npm run check` with Node 22 or 24. The lockfile has no third-party package dependencies. `scripts/test.mjs` runs each `.cjs` suite in a fresh process from the repository root, so tests do not depend on your current directory or a previous Git commit.

| Suite | Main checks |
| :--- | :--- |
| `test-engine` | Recipe validation and core quantities |
| `test-autolysis` | Autolyse quantities, sequence and available-water limits |
| `test-salt-order` | Delayed salt and machine-step ordering |
| `test-live` | Progress boundaries and UI script syntax |
| `test-fermentation` | Curve model outputs and combinations |
| `test-fixed-yeast-oil` | Fixed yeast ratio, oil presets and related behaviour |
| `test-duration-selection` | Confirmed chart-duration behaviour |
| `test-start-from-duration` | Start-time constraints and duration scheduling |
| `test-schedule` | Clock/anchor behaviour, defaults and license consistency |
| `test-math` | Formula rendering and numerical documentation cases |
| `test-worksheet` | 50 report scenarios: quantities, timestamps, row coverage, blank checkboxes, languages, DST and long plans |
| `test-yeast-tenth` | 0.1 g display, tiny-dose notices, batch apportionment and recipe regression fixture |

`tests/fixtures/reference-recipes.json` is an explicit snapshot of 18 recipes from the imported engine. Change it only when a reviewed intentional recipe change requires it; do not regenerate it automatically during tests. It checks regressions, not independent scientific truth.

Generated PDFs and mathematical cases go to `.test-output/`, which is ignored and not deployed. The build also parses all inline app scripts, checks the GPL license files, ensures the app is copied unchanged and checks the public top-level allowlist.

## Manual checks before a release

1. Build and serve locally. Open the home and pizza app at the simulated `/computational-kitchen/` base path.
2. Check desktop and mobile layouts, keyboard focus, IT/EN switching and numerical input.
3. Try direct, poolish, biga, autolyse, refrigerator and delayed-salt options; check quantities and timestamps.
4. Confirm a chart duration with both start and bake anchors; ensure the anchor/yeast ratio are retained and past preparation is rejected.
5. Download IT/EN PDFs and a calendar. Inspect PDF page breaks and compare timestamps with the timeline. Print the blank checklist if practical.
6. Test local downloaded HTML without a network connection; external reference links naturally remain online.

The automated suites do not run a full browser, guarantee visual layout, measure appliance behaviour or validate fermentation biology. A test passing is a statement about specified software behaviour.
