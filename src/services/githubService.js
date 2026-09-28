const config = require('../config');

const CACHE_TTL_MS = 180_000;
let cachedOverview = null;
let cachedAt = 0;

const STAGE_DEFINITIONS = [
  { key: 'checkout', label: 'Checkout', match: 'Checkout repository' },
  { key: 'tests', label: 'Automated tests', match: 'Run automated tests' },
  { key: 'audit', label: 'Dependency audit', match: 'Audit Node.js dependencies' },
  { key: 'build', label: 'Docker build', match: 'Build Docker image' },
  { key: 'scan', label: 'Trivy scan', match: 'Scan Docker image with Trivy' },
  { key: 'gate', label: 'Security gate', match: 'Security policy gate' },
  { key: 'sbom', label: 'Generate SBOM', match: 'Generate SBOM' },
  { key: 'evidence', label: 'Upload evidence', match: 'Upload security evidence' },
  { key: 'registry', label: 'Publish GHCR image', match: 'Publish image to GHCR' },
  { key: 'staging', label: 'Deploy staging', match: 'Deploy to staging' },
  { key: 'smoke', label: 'Staging smoke test', match: 'Smoke test staging' },
  { key: 'production', label: 'Deploy production', match: 'Deploy to production' }
];

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'secureship-lite',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  return headers;
}

async function githubRequest(path) {
  const response = await fetch(`https://api.github.com/repos/${config.githubRepository}${path}`, {
    headers: githubHeaders()
  });

  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    throw new Error(`GitHub API returned ${response.status}${remaining === '0' ? ' (rate limit reached)' : ''}`);
  }

  return response.json();
}

function durationSeconds(run) {
  if (!run?.created_at || !run?.updated_at) return null;
  const start = new Date(run.created_at).getTime();
  const end = new Date(run.updated_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.round((end - start) / 1000));
}

function normalizeRun(run) {
  return {
    id: run.id,
    name: run.name,
    title: run.display_title || run.name,
    branch: run.head_branch,
    commitSha: run.head_sha,
    shortSha: run.head_sha?.slice(0, 7),
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    durationSeconds: durationSeconds(run),
    url: run.html_url
  };
}

function normalizeConclusion(step) {
  if (!step) return 'pending';
  if (step.status !== 'completed') return step.status || 'pending';
  return step.conclusion || 'unknown';
}

function buildStages(job) {
  const steps = job?.steps || [];

  return STAGE_DEFINITIONS.map((definition) => {
    const step = steps.find((item) => item.name === definition.match);
    return {
      key: definition.key,
      label: definition.label,
      status: normalizeConclusion(step),
      startedAt: step?.started_at || null,
      completedAt: step?.completed_at || null
    };
  });
}

function stageByKey(stages, key) {
  return stages.find((stage) => stage.key === key);
}

function deriveSecurity(stages, latestRun) {
  const scan = stageByKey(stages, 'scan');
  const gate = stageByKey(stages, 'gate');
  const sbom = stageByKey(stages, 'sbom');

  const gateApproved = gate?.status === 'success';
  const gateBlocked = gate?.status === 'failure';

  return {
    gate: gateApproved ? 'approved' : gateBlocked ? 'blocked' : 'pending',
    scanStatus: scan?.status || 'pending',
    sbomStatus: sbom?.status || 'pending',
    critical: gateApproved ? 0 : null,
    high: gateApproved ? 0 : null,
    statement: gateApproved
      ? 'No fixable HIGH or CRITICAL findings passed the release gate.'
      : gateBlocked
        ? 'Release blocked by the security policy. Inspect the workflow security evidence.'
        : latestRun?.status === 'in_progress'
          ? 'Security checks are still running.'
          : 'Security evidence is not available yet.'
  };
}

function deriveDeployments(stages) {
  const staging = stageByKey(stages, 'staging');
  const smoke = stageByKey(stages, 'smoke');
  const production = stageByKey(stages, 'production');

  return {
    staging: staging?.status || 'pending',
    smokeTest: smoke?.status || 'pending',
    production: production?.status || 'pending'
  };
}

async function fetchOverview() {
  const runsPayload = await githubRequest('/actions/runs?branch=main&per_page=6');
  const runs = (runsPayload.workflow_runs || [])
    .filter((run) => run.name === 'CI - Test, Build and Security Scan')
    .map(normalizeRun);

  const latestRun = runs[0] || null;
  let stages = STAGE_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    status: 'pending',
    startedAt: null,
    completedAt: null
  }));

  if (latestRun) {
    const jobsPayload = await githubRequest(`/actions/runs/${latestRun.id}/jobs?per_page=100`);
    const job = (jobsPayload.jobs || []).find((item) => item.name === 'test-build-scan') || jobsPayload.jobs?.[0];
    stages = buildStages(job);
  }

  return {
    repository: config.githubRepository,
    repositoryUrl: `https://github.com/${config.githubRepository}`,
    latestRun,
    recentRuns: runs,
    stages,
    security: deriveSecurity(stages, latestRun),
    deployments: deriveDeployments(stages),
    image: latestRun?.commitSha
      ? `ghcr.io/${config.githubRepository}:${latestRun.commitSha}`
      : `ghcr.io/${config.githubRepository}:latest`,
    refreshedAt: new Date().toISOString()
  };
}

async function getActionsOverview({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedOverview && now - cachedAt < CACHE_TTL_MS) {
    return { ...cachedOverview, cached: true };
  }

  const overview = await fetchOverview();
  cachedOverview = overview;
  cachedAt = now;
  return { ...overview, cached: false };
}

module.exports = {
  getActionsOverview,
  STAGE_DEFINITIONS
};
