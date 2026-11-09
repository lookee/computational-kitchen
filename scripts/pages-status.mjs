// SPDX-License-Identifier: GPL-3.0-only — Copyright (C) 2026 Luca Amore
import { appendFileSync } from 'node:fs';
const response = await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/pages`, {
  headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
});
if (!response.ok && response.status !== 404) throw new Error(`Pages API returned ${response.status}; check workflow permissions.`);
const enabled = response.ok && (await response.json()).build_type === 'workflow';
appendFileSync(process.env.GITHUB_OUTPUT, `enabled=${enabled}\n`);
if (!enabled) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '## One-time Pages setup\nBuild and tests passed. Deployment is waiting for configuration.\n\nOpen **Settings → Pages → Source → GitHub Actions**, then run **Actions → Pages → Run workflow** on `main`. See `docs/DEPLOYMENT.md`.\n');
