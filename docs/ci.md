# CI Pipeline — Mark Scheme Method Pilot

## Overview

This document describes the Continuous Integration pipeline for the
`mark-scheme-method-pilot` repository. The pipeline runs on every push
to `main` and on every pull request targeting `main`.

---

## Pipeline Stages

| # | Stage | Tool | Artifact |
|---|-------|------|----------|
| 1 | Fast-forward sync | git pull --ff-only | — |
| 2 | Install dependencies | pip | — |
| 3 | Unit & integration tests | pytest + pytest-cov | coverage.xml → Codecov |
| 4 | End-to-end UI tests | Playwright | allure-results |
| 5 | Performance tests | Locust | performance-report.csv |
| 6 | Security scan | OWASP ZAP | zap-report.html |
| 7 | Allure report | allure CLI | allure-report/ |

### Stage Details

**Fast-forward sync** — `git pull origin main --ff-only` is the first
step in every job. This prevents the non-fast-forward push problem that
can arise when multiple contributors push to the same branch.

**Unit & integration tests** — Pytest runs `tests/unit/` and
`tests/integration/` together. Coverage is uploaded to Codecov. Tests
must all pass before the PR can be merged.

**End-to-end tests** — Playwright drives the live GitHub Pages site
(`devontallman.github.io/mark-scheme-method-pilot`). Flakiness is
expected on GitHub-hosted runners; re-run the job once before
investigating failures.

**Performance tests** — Locust simulates 10 concurrent users at a spawn
rate of 2/s for 30 seconds. Results are saved as `locust_result_stats.csv`
and attached as the `performance-report` artifact.

**Security scan** — OWASP ZAP runs a baseline spider + active scan
against the live site. The scan produces `zap_report.html` attached as
the `zap-report` artifact. The job exits 0 (non-blocking) so a ZAP
warning does not fail the build; the HTML report is reviewed manually.
CI will fail if a **High** severity finding is detected.

**Allure report** — Results from pytest and Playwright are combined into
a single Allure HTML report attached as the `allure-report` artifact.

---

## Running Tests Locally

### Prerequisites

```bash
pip install -r requirements.txt
playwright install --with-deps
```

### Unit & integration

```bash
pytest tests/unit tests/integration -v
```

### End-to-end

```bash
pytest tests/e2e -v
```

### Performance

```bash
locust -f tests/performance/locustfile.py \
  --headless -u 10 -r 2 --run-time 30s \
  --csv=locust_result
```

### Security scan

```bash
python zap_scan.py
```

---

## Node.js Actions Upgrade Plan

The `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` environment variable is a
short-term workaround for the Node.js 20 deprecation warning in GitHub
Actions. Before **June 2026**, upgrade the four flagged actions in a
separate PR after the current fix is confirmed stable on main.

| Action | Current | Upgrade to |
|--------|---------|-----------|
| `actions/checkout` | v4 | v5 |
| `actions/setup-python` | v5 | v6 |
| `actions/upload-artifact` | v4 | v5 |
| `codecov/codecov-action` | v4 | v5 |

Update each reference in `.github/workflows/ci.yml` (e.g.
`actions/checkout@v4` → `actions/checkout@v5`), push on a test branch,
and watch the CI run pass before merging to main.

---

## Live Site

- **URL:** <https://devontallman.github.io/mark-scheme-method-pilot/>
- **Served from:** `main` branch root (GitHub Pages — no build step)
- **Note:** The Allure test dashboard is **not** deployed to GitHub
  Pages. It is available exclusively as a downloadable artifact on the
  Actions run page. This prevents the CI pipeline from overwriting the
  live site.

---

## Rollback

If the live site goes down after a merge:

```bash
# Squash merge (recommended)
git checkout main && git pull
git revert HEAD --no-edit
git push origin main

# Normal merge (if squash was not used)
git revert -m 1 HEAD --no-edit
git push origin main
```

GitHub Pages redeploys within 2–3 minutes.

---

*Prepared for The Mark Scheme Method® Dev Team — 12 March 2026*
