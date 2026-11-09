# Architecture — a small, inspectable kitchen

The public website is static. There is no backend, package runtime, framework, CDN dependency or account system. `index.html` is the collection landing page; `pizza-computational-lab/index.html` is both the application source and its distributable form. Do not edit `_site/`.

## Application modules

Inline script IDs keep the standalone file inspectable and allow regression tests to execute individual modules in Node's VM:

| Module | Responsibility |
| :--- | :--- |
| `pizza-engine` | Input validation, mass balance, yeast estimate, batches, machine protocols and plan |
| `pizza-math` | Formula documentation and rendered MathML/LaTeX |
| `pizza-language` | IT/EN labels and translated procedure output |
| `pizza-worksheet` | Printable model, checklist HTML and local PDF generation with embedded fonts |
| `pizza-fermentation` | Flour catalogue and exploratory curve model |
| `pizza-schedule` | Duration/anchor calculations |
| `pizza-ui` | Form state, browser storage, rendering, progress and downloads |

The app retains some original `Pizza Lab` labels, PDF/calendar names and `PizzaLab` JavaScript API names for compatibility. The distributed product and directory are **Pizza Computational Lab**; the collection is **Computational Kitchen**. The packaging version is `0.1.0`.

## Data flow

Inputs are validated before calculation. The engine creates recipe quantities and a dated event plan. Views, instructions, PDF and calendar consume that plan. The curve uses the recipe and temperature assumptions; confirmed chart selection goes through scheduling validation before the UI accepts it.

Preferences and calibration use browser local storage. No application code transmits recipes or personal data. GitHub Pages still serves HTTP requests, and external links have their own destination policies. README badge images are external and are not application runtime dependencies.

## Build and deployment

`scripts/build.mjs` parses inline JavaScript, checks license consistency and copies an explicit public-file list to `_site/`. The application is copied byte for byte: no minification, generated API, external asset fetch or transformation. New public experiments must be added to the allowlist.

CI tests Node 22 and 24. The Pages workflow independently tests/builds with Node 24, checks whether Pages uses Actions, uploads one artifact and deploys it. No repository secrets are required. Monthly Dependabot proposals cover GitHub Actions; review them before merging.

Source provenance for the initial export is recorded in `source-provenance.json`. Its checksum is a snapshot of this packaging operation, not a checksum that should be forced to match after future edits. The original recipe engine is unchanged by the product-title rename.
