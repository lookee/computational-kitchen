# Contributing — bring evidence, leave the dough covered

Thanks for helping improve Computational Kitchen. Small, reproducible changes are easiest to review. Discussions can be in Italian or English.

## Work locally

Fork or branch from `main`, install Node 22/24, then run:

```sh
npm ci --ignore-scripts
npm run check
npm start
```

Edit source files, not `_site/`. Keep the pizza HTML self-contained and preserve its script IDs. Avoid introducing runtime dependencies for a change that plain JavaScript can reasonably handle.

## A useful pull request

- State the concrete trigger and expected result; include the smallest example recipe that reproduces the issue.
- Update IT and EN output together when labels or procedures change.
- Add or adjust a meaningful regression test for calculation, timing, rounding or export changes.
- For mathematical changes, document symbols, units, assumptions, primary sources and limits. Clearly separate measured data from fitted parameters and heuristics.
- For flour data, link the manufacturer's technical source, record ranges honestly and leave unknown fields empty.
- For Bimby instructions, explain the source and practical constraints. Do not describe personal adaptations as official programmes.
- Run `npm run check`; for layout/export changes also complete the relevant manual checks in `docs/TESTING.md`.

Commit examples: `fix: preserve the selected bake time`, `docs: explain preferment hydration`, `feat: add a kitchen experiment`. Avoid private calendar details, credentials and unrelated generated PDFs.

By contributing, you agree to license your contributions under **GPL-3.0-only**, except assets with an explicitly documented compatible separate license. Preserve attribution and existing third-party notices. No contributor agreement is required by this project.

Be kind, precise and curious. Model uncertainty is welcome; personal attacks are not. The maintainer may close abusive or unrelated contributions.
