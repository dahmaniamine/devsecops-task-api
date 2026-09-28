# SecureShip Lite - Interview Notes

## 30-second explanation

SecureShip Lite is a small secure software-delivery platform built around a Node.js and MongoDB workload. A GitHub Actions pipeline runs tests and dependency auditing, builds a hardened Docker image, scans it with Trivy, applies a security policy gate, generates a CycloneDX SBOM, uploads security evidence and publishes approved images to GitHub Container Registry. The dashboard reads real GitHub Actions data and shows the current release gate, supply-chain stages, service health and deployment readiness.

## Why the task API still exists

The task API is the managed workload. The DevSecOps work is the system around it: build, test, scan, evidence, registry and deployment controls.

## Strong real story from this project

The first Trivy-enabled pipeline did not pass. It found HIGH/CRITICAL vulnerabilities in the runtime image. Instead of disabling the scanner, the image was hardened by applying Alpine security updates and removing npm from the production runtime because the application only needs Node to run. The next Trivy scan passed. This is a good example of a security gate changing the release process.

## Key concepts to explain

### Docker
A container packages the application and runtime into a repeatable unit. Docker Compose runs the API and MongoDB together locally.

### CI/CD
CI validates every change automatically. CD promotes an approved build toward staging/production. Deployment steps are skipped visibly if the required secrets are not configured.

### Trivy
Trivy scans the built image. The workflow writes JSON evidence instead of only printing text.

### Security policy gate
`scripts/security-gate.js` reads the Trivy report. A fixable HIGH or CRITICAL finding blocks the workflow.

### SBOM
The CycloneDX SBOM records the software components included in the release. It is useful for supply-chain visibility and incident response.

### GHCR
Approved images are pushed to GitHub Container Registry with the exact Git commit SHA and `latest`. The SHA tag gives traceability from runtime artifact back to source.

### Staging smoke test
If a staging URL is configured, the pipeline polls its health endpoint. A failed smoke test stops promotion before production.

### Non-root container
The production container runs as `appuser`, reducing the impact of a container compromise.

## Things not to claim

- Do not say Kubernetes is used. It is not.
- Do not say images are cryptographically signed. Cosign is not part of Lite yet.
- Do not say production is deployed unless the Render secret is actually configured and the deployment step succeeds.
- The dashboard's HIGH/CRITICAL counts refer to findings that reached the release gate after Trivy filtering, not every theoretical vulnerability in every dependency database.
