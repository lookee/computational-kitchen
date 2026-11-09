# Deployment cookbook

Repository: **[lookee/computational-kitchen](https://github.com/lookee/computational-kitchen)**. Application directory: **`pizza-computational-lab/`**.

## First publication

1. Commit the project to `main`. Upload the contents of the project folder, including the hidden `.github` folder; do not add an extra enclosing directory inside the repository.
2. In **Settings → Pages → Build and deployment**, set **Source: GitHub Actions**.
3. In **Actions → Pages**, choose **Run workflow → main**.
4. Wait for the `build` and `deploy` jobs to finish. Open the environment URL in the run summary.

Expected URLs, after successful deployment:

| Page | URL |
| :--- | :--- |
| Kitchen | https://lookee.github.io/computational-kitchen/ |
| Pizza lab | https://lookee.github.io/computational-kitchen/pizza-computational-lab/ |

Later pushes to `main` publish automatically. Pull requests run tests and builds without publishing. A Pages run before configuration passes the build, skips deployment and adds setup instructions to its summary. A green **build alone does not mean the site was deployed**: check the `deploy` job and its URL.

Node builds a static `_site/` directory. Only explicitly allowlisted public files are copied; tests, generated test PDFs, repository configuration and documentation are not deployed. `.nojekyll` bypasses Jekyll processing. The workflow uploads one `github-pages` artifact and deploys it once.

## Working from your computer

```sh
git clone https://github.com/lookee/computational-kitchen.git
cd computational-kitchen
npm ci --ignore-scripts
npm run check
npm start
```

Open http://127.0.0.1:8000/computational-kitchen/. Edit the source files, run `npm run check`, commit and push. Never edit `_site/`: the build replaces it.

```sh
git add .
git commit -m "feat: improve the kitchen"
git push origin main
```

No secrets, personal access tokens, paid hosting, deployment keys or external services are required by the workflows. Pages uses the repository's temporary `GITHUB_TOKEN`; deployment receives `pages: write` and `id-token: write` only in its own job.

## Troubleshooting

| Symptom | Check |
| :--- | :--- |
| Deploy is skipped | Select **GitHub Actions** as the Pages source, then rerun Pages |
| `403` in Pages preflight | Check repository Actions policy and the build job's `pages: read` permission |
| Actions cannot run | Check **Settings → Actions → General** and organisation policy; forks may need Actions enabled |
| Environment blocks deployment | Check **Settings → Environments → github-pages** branch rules and required reviewers |
| 404 immediately after deployment | Wait for Pages propagation, then use the project path, including `/computational-kitchen/` |
| Multiple `github-pages` artifacts | Keep one upload in `pages.yml`; do not add another upload action or a parallel publisher |
| Old version visible | Check the deployed commit in Actions and reload without browser cache |
| Local changes do not appear | Rebuild with `npm run build`; the preview server serves `_site/` |

## Forks and custom domains

For a fork or renamed repository, update README links and badges, `package.json` repository/homepage, `CITATION.cff`, and the root link in `404.html`. The application and landing page use relative links. The local preview's optional `/computational-kitchen/` prefix emulates this project's Pages URL; `/` always works locally.

For a custom domain, configure it in Pages, follow GitHub's DNS and verification instructions, and add a `CNAME` to the build allowlist only if you choose file-based domain configuration. No domain or DNS changes are made by this project. Update the 404 link and documentation to match the final URL.

## Suggested repository settings

These are recommendations, not settings applied by the code:

- **Description:** `An open-source playground for AI-assisted experimental recipes. Flour, water, algorithms — starting with Pizza Computational Lab.`
- **Website:** the kitchen URL after deployment.
- **Topics:** `pizza`, `cooking`, `javascript`, `thermomix`, `fermentation`, `github-pages`, `open-source`, `scientific-computing`.
- Protect `main` with a ruleset requiring pull requests and successful `Test / Node 22` and `Test / Node 24` checks when collaboration starts.
- Enable private vulnerability reporting and Dependabot alerts where available. The included Dependabot configuration proposes Action updates.
- For a first release, tag the tested published commit as `v0.1.0`, copy the changelog entry into the release notes and attach a source archive if useful. No release tag is automatically created.

Official references: [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
