# SecureShip Lite

SecureShip Lite turns the original task API into a small secure software delivery platform.
The task API remains the workload, while the dashboard shows the real CI/CD pipeline that builds, scans and releases it.

## Release path

```text
Developer push
   -> automated tests
   -> npm dependency audit
   -> Docker image build
   -> Trivy vulnerability scan
   -> security policy gate
   -> CycloneDX SBOM generation
   -> security evidence artifact
   -> GHCR image publication
   -> optional staging deployment
   -> optional staging smoke test
   -> optional production deployment
```

## Security gate

`scripts/security-gate.js` parses the Trivy JSON report. Any fixable HIGH or CRITICAL vulnerability blocks the workflow. The pipeline does not hide findings or force a green result.

## Supply-chain evidence

Each successful workflow creates:

- `trivy-report.json`
- `sbom.cdx.json` (CycloneDX SBOM)
- a versioned GHCR image tagged with the Git commit SHA
- a `latest` GHCR tag for the latest successful `main` build

## Dashboard data

`GET /api/devsecops/overview` reads the public GitHub Actions API and returns the latest release status, pipeline stages, security gate, registry image, deployments and recent runs.

The GitHub result is cached for three minutes to stay inside unauthenticated API limits. Set `GITHUB_TOKEN` as an environment variable for a higher rate limit. Never commit a real token.
