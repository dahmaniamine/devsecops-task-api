# Interview Notes — DevSecOps Task API

Use this only after you have run the project yourself and understand the commands.

## Docker

**What Docker does:** packages the application, runtime, dependencies and configuration into a repeatable container image.

**Dockerfile:** instructions used to build the API image.

**Docker Compose:** runs multiple related containers together. In this project it starts the Node.js API and MongoDB.

Useful commands:

```bash
docker compose up --build
docker compose ps
docker compose logs -f api
docker compose down
```

## CI vs CD

**Continuous Integration (CI):** automatically validates changes through tests/build/security checks after code is pushed.

**Continuous Delivery/Deployment (CD):** automatically prepares or releases a validated version to an environment.

Project pipeline:

```text
Push -> Tests -> npm audit -> Docker build -> Trivy scan -> Render deploy hook
```

## GitHub Actions

GitHub Actions reads `.github/workflows/ci.yml`.

The workflow runs on pushes and pull requests to `main`/`master`.

If any enforced step fails, later steps do not complete successfully. This prevents a known-bad build from being deployed.

## Trivy

Trivy scans the final container image for known operating-system/package vulnerabilities.

This is a simple example of "shifting security left": checking security automatically during development rather than waiting until after deployment.

## npm audit

`npm audit` checks Node.js dependency metadata against known vulnerabilities.

It is different from Trivy because Trivy scans the full container image while npm audit focuses on npm dependencies.

## Secrets

The MongoDB URI and Render deploy hook must not be committed into source control.

Local secrets go in `.env` (ignored by Git). Cloud/CI secrets go into the secret-management features of Render/GitHub.

## Health checks

`GET /health` returns 200 when the HTTP application is available.

Docker and Render can use health checks to detect whether the service is healthy.

## Non-root container

The Dockerfile creates and uses `appuser`. Running the process as non-root reduces the impact of some container compromises.

## Questions you should be able to answer

1. What is the difference between an image and a container?
2. Why do we use Docker Compose here?
3. What happens after `git push`?
4. What is CI/CD?
5. Why run tests before deployment?
6. What does Trivy scan?
7. Why should secrets not be inside Git?
8. Why does the container run as a non-root user?
9. What is the purpose of `/health`?
10. What happens if the security scan fails?
