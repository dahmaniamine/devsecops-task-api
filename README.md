# SecureShip Lite

SecureShip Lite is a small **secure software delivery platform** built around a real Node.js / MongoDB workload.

The original task API is still present, but it is no longer the point of the project. It is the application that the DevSecOps pipeline builds, tests, scans, packages and releases.

The browser dashboard at `http://localhost:3000` reads your **real GitHub Actions data** and visualizes release readiness, security controls, SBOM generation, container publication and deployment stages.

## Why this project exists

The project demonstrates practical junior DevSecOps concepts instead of only CRUD functionality:

- Git / GitHub
- GitHub Actions CI/CD
- Node.js / Express
- MongoDB
- Docker / Docker Compose
- Jest / Supertest
- `npm audit`
- Trivy container vulnerability scanning
- explicit security policy gate
- CycloneDX SBOM generation
- GitHub Actions security-evidence artifacts
- GitHub Container Registry (GHCR)
- optional staging deployment + smoke test
- optional production deployment to Render
- live pipeline/release dashboard

## Architecture

```text
Developer
   |
   | git push
   v
GitHub
   |
   v
GitHub Actions
   |-- npm ci
   |-- automated tests
   |-- npm audit
   |-- Docker build
   |-- Trivy JSON scan
   |-- security policy gate
   |-- CycloneDX SBOM
   |-- evidence artifact
   |-- GHCR image publish
   |-- optional staging deploy
   |-- optional smoke test
   |-- optional production deploy
   |
   +-------------------------+
                             |
                             v
                    SecureShip dashboard
                    /api/devsecops/overview
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
             Node.js API              MongoDB
```

## Security gate

The workflow intentionally does **not** hide serious findings.

Trivy produces `trivy-report.json`. `scripts/security-gate.js` parses that report and blocks the release if a fixable **HIGH** or **CRITICAL** vulnerability remains.

```text
HIGH/CRITICAL finding > 0
        -> release BLOCKED

HIGH/CRITICAL finding = 0
        -> release APPROVED
```

This is the same concept that already occurred during development: Trivy initially blocked the image, the runtime image was hardened, and the next pipeline passed.

## SBOM and supply-chain evidence

For every CI run, the pipeline creates:

- `trivy-report.json`
- `sbom.cdx.json` in CycloneDX format

Both are uploaded as a GitHub Actions artifact named:

```text
security-evidence-<commit-sha>
```

On a successful push to `main`, the Docker image is also published to:

```text
ghcr.io/dahmaniamine/devsecops-task-api:<commit-sha>
ghcr.io/dahmaniamine/devsecops-task-api:latest
```

## Dashboard

Open:

```text
http://localhost:3000
```

The dashboard displays:

- release gate: approved / blocked / running
- latest commit and branch
- real GitHub Actions stages
- security posture
- SBOM generation status
- API and MongoDB health
- GHCR publication status
- staging / smoke-test / production states
- recent pipeline history

GitHub data is cached for three minutes so the public API rate limit is not exhausted.

## Local setup

From WSL / Ubuntu:

```bash
docker compose down
docker compose up --build -d
```

Open:

```text
http://localhost:3000
```

Check the API:

```bash
curl http://localhost:3000/health
```

Run tests:

```bash
npm test
```

## Environment variables

```text
PORT=3000
MONGODB_URI=mongodb://localhost:27017/devsecops_tasks
NODE_ENV=development
GITHUB_REPOSITORY=dahmaniamine/devsecops-task-api
GITHUB_TOKEN=
```

`GITHUB_TOKEN` is optional for a public repository. Add one as an environment variable only if you want a higher API rate limit. Never commit it.

## Optional staging and production deployment

GitHub Actions recognizes these repository secrets:

```text
RENDER_STAGING_DEPLOY_HOOK_URL
STAGING_HEALTH_URL
RENDER_DEPLOY_HOOK_URL
```

If they are absent, the corresponding deployment stages are skipped visibly instead of pretending a deployment occurred.

## Cloud database

For Render, use MongoDB Atlas and configure:

```text
MONGODB_URI=<Atlas connection string>
```

Do not commit the real connection string.

## Existing workload API

The original workload remains available:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/devsecops/overview` | SecureShip live overview |

## Interview explanation

A concise explanation:

> I built a containerized Node.js and MongoDB application, then built SecureShip Lite around it as a secure software-delivery pipeline. GitHub Actions runs automated tests and dependency auditing, builds the Docker image, scans the image with Trivy, enforces a policy gate, generates a CycloneDX SBOM, uploads security evidence and publishes successful images to GHCR. The dashboard consumes live GitHub Actions data to show release status, security posture, registry publication and deployment readiness.

Be prepared to explain **why** each gate exists, especially the difference between building an image and allowing that image to be released.
