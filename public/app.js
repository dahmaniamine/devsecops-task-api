const OVERVIEW_URL = '/api/devsecops/overview';
const TASKS_URL = '/api/tasks';

const elements = {
  refreshButton: document.querySelector('#refreshButton'),
  repoLink: document.querySelector('#repoLink'),
  workflowLink: document.querySelector('#workflowLink'),
  gateBadge: document.querySelector('#gateBadge'),
  releaseTitle: document.querySelector('#releaseTitle'),
  releaseMeta: document.querySelector('#releaseMeta'),
  commitSha: document.querySelector('#commitSha'),
  branchValue: document.querySelector('#branchValue'),
  eventValue: document.querySelector('#eventValue'),
  durationValue: document.querySelector('#durationValue'),
  environmentValue: document.querySelector('#environmentValue'),
  shieldIcon: document.querySelector('#shieldIcon'),
  criticalCount: document.querySelector('#criticalCount'),
  highCount: document.querySelector('#highCount'),
  sbomState: document.querySelector('#sbomState'),
  securityStatement: document.querySelector('#securityStatement'),
  apiStatus: document.querySelector('#apiStatus'),
  apiDetail: document.querySelector('#apiDetail'),
  databaseStatus: document.querySelector('#databaseStatus'),
  registryStatus: document.querySelector('#registryStatus'),
  registryImage: document.querySelector('#registryImage'),
  productionStatus: document.querySelector('#productionStatus'),
  pipelineStages: document.querySelector('#pipelineStages'),
  stagingStatus: document.querySelector('#stagingStatus'),
  smokeStatus: document.querySelector('#smokeStatus'),
  productionPathStatus: document.querySelector('#productionPathStatus'),
  imageEvidence: document.querySelector('#imageEvidence'),
  runHistory: document.querySelector('#runHistory'),
  lastUpdated: document.querySelector('#lastUpdated'),
  toast: document.querySelector('#toast'),
  workloadForm: document.querySelector('#workloadTaskForm'),
  workloadTitle: document.querySelector('#workloadTitle'),
  workloadDescription: document.querySelector('#workloadDescription'),
  workloadSubmit: document.querySelector('#workloadSubmit'),
  workloadRefresh: document.querySelector('#workloadRefresh'),
  workloadTasks: document.querySelector('#workloadTasks'),
  workloadEmpty: document.querySelector('#workloadEmpty'),
  workloadError: document.querySelector('#workloadError'),
  workloadCount: document.querySelector('#workloadCount'),
  workloadStatus: document.querySelector('#workloadStatus')
};

let toastTimer;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast show${type === 'error' ? ' error' : ''}`;
  toastTimer = setTimeout(() => {
    elements.toast.className = 'toast';
  }, 2800);
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function prettyStatus(value) {
  if (!value) return 'Pending';
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value) {
  if (value === 'success' || value === 'healthy' || value === 'approved') return 'good';
  if (value === 'failure' || value === 'blocked' || value === 'disconnected') return 'bad';
  if (value === 'in_progress' || value === 'queued' || value === 'pending') return 'warn';
  return '';
}

function stageIcon(status) {
  if (status === 'success') return '✓';
  if (status === 'failure') return '×';
  if (status === 'skipped') return '–';
  if (status === 'in_progress') return '●';
  if (status === 'queued') return '…';
  return '·';
}

function renderGate(github) {
  const latest = github.latestRun;
  const gate = github.security?.gate || 'unknown';

  elements.gateBadge.className = `gate-badge ${gate}`;
  elements.gateBadge.textContent = gate === 'approved'
    ? 'APPROVED'
    : gate === 'blocked'
      ? 'BLOCKED'
      : gate === 'pending'
        ? 'IN PROGRESS'
        : 'UNKNOWN';

  if (latest) {
    elements.releaseTitle.textContent = latest.title;
    elements.releaseMeta.textContent = latest.conclusion === 'success'
      ? 'All configured release controls completed successfully.'
      : latest.status === 'in_progress'
        ? 'The latest release pipeline is currently running.'
        : `Latest workflow result: ${prettyStatus(latest.conclusion || latest.status)}.`;
    elements.commitSha.textContent = latest.shortSha || '—';
    elements.branchValue.textContent = latest.branch || '—';
    elements.eventValue.textContent = latest.event || '—';
    elements.durationValue.textContent = formatDuration(latest.durationSeconds);
    elements.workflowLink.href = latest.url;
    elements.workflowLink.classList.remove('disabled');
  } else {
    elements.releaseTitle.textContent = 'No pipeline data available';
    elements.releaseMeta.textContent = github.error || 'Push to main to create the first SecureShip release.';
  }
}

function renderSecurity(github) {
  const security = github.security || {};
  const approved = security.gate === 'approved';
  const blocked = security.gate === 'blocked';

  elements.shieldIcon.textContent = approved ? '✓' : blocked ? '!' : '…';
  elements.shieldIcon.classList.toggle('blocked', blocked);
  elements.criticalCount.textContent = security.critical ?? '—';
  elements.highCount.textContent = security.high ?? '—';
  elements.sbomState.textContent = security.sbomStatus === 'success'
    ? 'READY'
    : prettyStatus(security.sbomStatus || 'pending').toUpperCase();
  elements.securityStatement.textContent = security.statement || 'No security statement available.';
}

function renderServices(data) {
  const apiStatus = data.service?.status || 'unknown';
  const dbStatus = data.database?.status || 'unknown';
  const registryStage = data.github?.stages?.find((stage) => stage.key === 'registry');
  const productionStage = data.github?.deployments?.production || 'pending';

  elements.apiStatus.textContent = prettyStatus(apiStatus);
  elements.apiStatus.className = statusClass(apiStatus);
  elements.apiDetail.textContent = `${data.service?.nodeVersion || 'Node'} · ${Math.round((data.service?.uptimeSeconds || 0) / 60)}m uptime`;

  elements.databaseStatus.textContent = prettyStatus(dbStatus);
  elements.databaseStatus.className = statusClass(dbStatus);

  elements.registryStatus.textContent = registryStage?.status === 'success'
    ? 'Published'
    : prettyStatus(registryStage?.status || 'pending');
  elements.registryStatus.className = statusClass(registryStage?.status);
  elements.registryImage.textContent = data.github?.image || '—';
  elements.imageEvidence.textContent = data.github?.image || 'Tagged with the Git commit SHA';

  elements.productionStatus.textContent = productionStage === 'skipped'
    ? 'Not configured'
    : prettyStatus(productionStage);
  elements.productionStatus.className = statusClass(productionStage);
}

function renderPipeline(stages = []) {
  if (!stages.length) {
    elements.pipelineStages.innerHTML = '<div class="loading-block">No workflow stages available.</div>';
    return;
  }

  elements.pipelineStages.innerHTML = stages.map((stage, index) => `
    <article class="stage ${escapeHtml(stage.status)}">
      <div class="stage-top">
        <span class="stage-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="stage-icon">${stageIcon(stage.status)}</span>
      </div>
      <strong>${escapeHtml(stage.label)}</strong>
      <small>${escapeHtml(prettyStatus(stage.status))}</small>
    </article>
  `).join('');
}

function renderDeployments(deployments = {}) {
  const normalized = (status) => status === 'skipped' ? 'Not configured' : prettyStatus(status || 'pending');

  elements.stagingStatus.textContent = normalized(deployments.staging);
  elements.stagingStatus.className = statusClass(deployments.staging);
  elements.smokeStatus.textContent = normalized(deployments.smokeTest);
  elements.smokeStatus.className = statusClass(deployments.smokeTest);
  elements.productionPathStatus.textContent = normalized(deployments.production);
  elements.productionPathStatus.className = statusClass(deployments.production);
}

function renderHistory(runs = []) {
  if (!runs.length) {
    elements.runHistory.innerHTML = '<tr><td colspan="7" class="table-empty">No runs found.</td></tr>';
    return;
  }

  elements.runHistory.innerHTML = runs.map((run) => {
    const state = run.conclusion || run.status || 'unknown';
    return `
      <tr>
        <td><span class="status-pill ${escapeHtml(state)}">${escapeHtml(prettyStatus(state))}</span></td>
        <td>${escapeHtml(run.title || 'Pipeline')}</td>
        <td class="mono">${escapeHtml(run.shortSha || '—')}</td>
        <td>${escapeHtml(run.branch || '—')}</td>
        <td>${escapeHtml(run.event || '—')}</td>
        <td>${escapeHtml(formatDuration(run.durationSeconds))}</td>
        <td>${escapeHtml(formatDate(run.createdAt))}</td>
      </tr>
    `;
  }).join('');
}

async function loadOverview({ force = false, silent = false } = {}) {
  if (!silent) elements.refreshButton.disabled = true;

  try {
    const response = await fetch(`${OVERVIEW_URL}${force ? '?refresh=true' : ''}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not load SecureShip overview');
    }

    const github = data.github || {};
    elements.repoLink.href = github.repositoryUrl || '#';
    elements.environmentValue.textContent = data.service?.environment || '—';

    renderGate(github);
    renderSecurity(github);
    renderServices(data);
    renderPipeline(github.stages || []);
    renderDeployments(github.deployments || {});
    renderHistory(github.recentRuns || []);

    elements.lastUpdated.textContent = `Updated ${formatDate(data.generatedAt)}${github.cached ? ' · cached' : ''}`;

    if (github.error && !silent) {
      showToast(github.error, 'error');
    }
  } catch (error) {
    if (!silent) showToast(error.message, 'error');
    elements.releaseTitle.textContent = 'Dashboard temporarily unavailable';
    elements.releaseMeta.textContent = error.message;
  } finally {
    elements.refreshButton.disabled = false;
  }
}


const workloadState = { tasks: [], busy: false };

async function workloadRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || 'Workload request failed');
  return body;
}

function renderWorkload() {
  const tasks = workloadState.tasks;
  const open = tasks.filter((task) => !task.completed).length;
  elements.workloadCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${open} open`;
  elements.workloadEmpty.classList.toggle('hidden', tasks.length !== 0);
  elements.workloadError.classList.add('hidden');
  elements.workloadStatus.textContent = 'Connected';
  elements.workloadStatus.className = 'status-pill success';

  elements.workloadTasks.innerHTML = tasks.map((task) => `
    <article class="workload-card${task.completed ? ' done' : ''}" data-workload-id="${escapeHtml(task._id)}">
      <button class="workload-toggle" type="button" data-workload-action="toggle" aria-label="${task.completed ? 'Reopen task' : 'Complete task'}">${task.completed ? '✓' : ''}</button>
      <div>
        <h3 class="workload-task-title">${escapeHtml(task.title)}</h3>
        <p class="workload-task-description">${escapeHtml(task.description || 'No description')}</p>
        <span class="workload-task-meta">${task.completed ? 'Completed' : 'Open'} · ${escapeHtml(formatDate(task.createdAt))}</span>
      </div>
      <button class="workload-delete" type="button" data-workload-action="delete">Delete</button>
    </article>
  `).join('');
}

async function loadWorkload({ silent = false } = {}) {
  try {
    workloadState.tasks = await workloadRequest(TASKS_URL);
    renderWorkload();
  } catch (error) {
    elements.workloadStatus.textContent = 'Unavailable';
    elements.workloadStatus.className = 'status-pill failure';
    elements.workloadError.textContent = error.message;
    elements.workloadError.classList.remove('hidden');
    if (!silent) showToast(`Workload: ${error.message}`, 'error');
  }
}

elements.workloadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (workloadState.busy) return;

  workloadState.busy = true;
  elements.workloadSubmit.disabled = true;

  try {
    await workloadRequest(TASKS_URL, {
      method: 'POST',
      body: JSON.stringify({
        title: elements.workloadTitle.value.trim(),
        description: elements.workloadDescription.value.trim()
      })
    });
    elements.workloadForm.reset();
    showToast('Workload task created');
    await loadWorkload({ silent: true });
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    workloadState.busy = false;
    elements.workloadSubmit.disabled = false;
  }
});

elements.workloadTasks.addEventListener('click', async (event) => {
  const actionButton = event.target.closest('[data-workload-action]');
  const card = event.target.closest('[data-workload-id]');
  if (!actionButton || !card) return;

  const task = workloadState.tasks.find((item) => item._id === card.dataset.workloadId);
  if (!task) return;

  try {
    actionButton.disabled = true;
    if (actionButton.dataset.workloadAction === 'toggle') {
      await workloadRequest(`${TASKS_URL}/${task._id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed })
      });
      showToast(task.completed ? 'Task reopened' : 'Task completed');
    } else if (actionButton.dataset.workloadAction === 'delete') {
      if (!window.confirm(`Delete “${task.title}”?`)) {
        actionButton.disabled = false;
        return;
      }
      await workloadRequest(`${TASKS_URL}/${task._id}`, { method: 'DELETE' });
      showToast('Task deleted');
    }
    await loadWorkload({ silent: true });
  } catch (error) {
    actionButton.disabled = false;
    showToast(error.message, 'error');
  }
});

elements.workloadRefresh.addEventListener('click', async () => {
  elements.workloadRefresh.disabled = true;
  await loadWorkload();
  elements.workloadRefresh.disabled = false;
});

elements.refreshButton.addEventListener('click', () => loadOverview({ force: true }));

Promise.all([loadOverview(), loadWorkload({ silent: true })]);
setInterval(() => loadOverview({ silent: true }), 30_000);
setInterval(() => loadWorkload({ silent: true }), 30_000);
