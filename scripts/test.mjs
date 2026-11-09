// SPDX-License-Identifier: GPL-3.0-only — Copyright (C) 2026 Luca Amore
import { readdirSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
mkdirSync('.test-output/pdf', { recursive: true });
const tests = readdirSync('tests').filter(n => /^test-.*\.cjs$/.test(n)).sort();
let failed = 0;
for (const name of tests) {
  const result = spawnSync(process.execPath, [`tests/${name}`], { cwd: root, encoding: 'utf8', timeout: 120000 });
  const ok = result.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) { failed++; console.error(result.stdout, result.stderr, result.error || ''); }
}
console.log(`\n${tests.length - failed}/${tests.length} suites passed. No dough was harmed.`);
process.exitCode = failed ? 1 : 0;
