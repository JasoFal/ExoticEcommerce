# CI Metrics

A weekly log of how the CI pipeline is doing. The metrics and their
definitions come from [`ci-cd-plan.md` §12](ci-cd-plan.md#12-metrics-from-day-one).
Fill in one row each Monday for the week before. No dashboards yet.

---

## How to collect

Run these from the repo root with the `gh` CLI. Adjust the dates to the week
being recorded.

**Lead time for changes** (PR opened → merged to `main`, median for the
week):

```sh
gh pr list --state merged --base main --search "merged:2026-11-02..2026-11-08" \
  --json number,createdAt,mergedAt
```

**Pipeline duration and failure rate** (CI workflow only, split into PR and
`main`):

```sh
# PR runs
gh run list --workflow CI --event pull_request --created 2026-11-02..2026-11-08 \
  --json databaseId,createdAt,updatedAt,conclusion --limit 200

# main runs
gh run list --workflow CI --branch main --event push --created 2026-11-02..2026-11-08 \
  --json databaseId,createdAt,updatedAt,conclusion --limit 200
```

- **Duration** is `updatedAt − createdAt` per run. Record the median and the
  slowest. Leave out `cancelled` runs, which are superseded PR pushes.
- **Failure rate** is `failure` runs ÷ (`success` + `failure`) runs.

**Time to fix a red build**: from the main runs above, take each first
`failure` and the next `success` after it. Record the gap.

---

## Weekly log

| Week of (Mon) | Lead time (median) | PR pipeline (median / slowest) | Failure rate (PR / main) | Time to fix red `main` | Notes |
|---|---|---|---|---|---|
| | | | | | |

---

## Escaped defects

Bugs found after merge that a test should have caught. These feed the
Smart Tests escaped-defect check ([`ci-cd-plan.md` §4.3](ci-cd-plan.md#43-rollout-phases)).

| Date found | PR that introduced it | What broke | Test that should have caught it |
|---|---|---|---|
| | | | |
