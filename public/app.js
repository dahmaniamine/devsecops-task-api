const API_URL = '/api/tasks';

const state = {
  tasks: [],
  filter: 'all',
  busy: false
};

const elements = {
  form: document.querySelector('#taskForm'),
  title: document.querySelector('#title'),
  description: document.querySelector('#description'),
  editingTaskId: document.querySelector('#editingTaskId'),
  formHeading: document.querySelector('#formHeading'),
  submitButton: document.querySelector('#submitButton'),
  cancelEditButton: document.querySelector('#cancelEditButton'),
  taskList: document.querySelector('#taskList'),
  loadingState: document.querySelector('#loadingState'),
  errorState: document.querySelector('#errorState'),
  emptyState: document.querySelector('#emptyState'),
  totalCount: document.querySelector('#totalCount'),
  openCount: document.querySelector('#openCount'),
  completedCount: document.querySelector('#completedCount'),
  serviceStatus: document.querySelector('#serviceStatus'),
  refreshButton: document.querySelector('#refreshButton'),
  toast: document.querySelector('#toast')
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
  }, 2600);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || 'Request failed');
  }

  return body;
}

function updateStats() {
  const completed = state.tasks.filter((task) => task.completed).length;
  elements.totalCount.textContent = state.tasks.length;
  elements.completedCount.textContent = completed;
  elements.openCount.textContent = state.tasks.length - completed;
}

function visibleTasks() {
  if (state.filter === 'open') {
    return state.tasks.filter((task) => !task.completed);
  }
  if (state.filter === 'completed') {
    return state.tasks.filter((task) => task.completed);
  }
  return state.tasks;
}

function renderTasks() {
  updateStats();
  const tasks = visibleTasks();

  elements.loadingState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  elements.emptyState.classList.toggle('hidden', tasks.length !== 0);

  elements.taskList.innerHTML = tasks.map((task) => {
    const createdAt = new Date(task.createdAt).toLocaleString();
    const description = task.description
      ? `<p class="task-description">${escapeHtml(task.description)}</p>`
      : '<p class="task-description">No description</p>';

    return `
      <article class="task-card${task.completed ? ' completed' : ''}" data-task-id="${task._id}">
        <button class="check-button" data-action="toggle" aria-label="${task.completed ? 'Mark task as open' : 'Mark task as completed'}">${task.completed ? '✓' : ''}</button>
        <div>
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          ${description}
          <span class="task-meta">Created ${escapeHtml(createdAt)}</span>
        </div>
        <div class="task-actions">
          <button class="button edit" data-action="edit" type="button">Edit</button>
          <button class="button danger" data-action="delete" type="button">Delete</button>
        </div>
      </article>
    `;
  }).join('');
}

async function loadTasks() {
  elements.loadingState.classList.remove('hidden');
  elements.errorState.classList.add('hidden');
  elements.taskList.innerHTML = '';

  try {
    state.tasks = await apiRequest(API_URL);
    renderTasks();
  } catch (error) {
    elements.loadingState.classList.add('hidden');
    elements.errorState.textContent = `Could not load tasks: ${error.message}`;
    elements.errorState.classList.remove('hidden');
  }
}

async function checkHealth() {
  try {
    const health = await apiRequest('/health');
    elements.serviceStatus.className = 'service-status online';
    elements.serviceStatus.innerHTML = '<span class="status-dot"></span><span>API online</span>';
    return health;
  } catch (error) {
    elements.serviceStatus.className = 'service-status offline';
    elements.serviceStatus.innerHTML = '<span class="status-dot"></span><span>API offline</span>';
    return null;
  }
}

function resetForm() {
  elements.form.reset();
  elements.editingTaskId.value = '';
  elements.formHeading.textContent = 'Create a task';
  elements.submitButton.textContent = 'Add task';
  elements.cancelEditButton.classList.add('hidden');
}

function startEditing(task) {
  elements.editingTaskId.value = task._id;
  elements.title.value = task.title;
  elements.description.value = task.description || '';
  elements.formHeading.textContent = 'Edit task';
  elements.submitButton.textContent = 'Save changes';
  elements.cancelEditButton.classList.remove('hidden');
  elements.title.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.busy) return;

  const title = elements.title.value.trim();
  const description = elements.description.value.trim();
  const editingId = elements.editingTaskId.value;

  state.busy = true;
  elements.submitButton.disabled = true;

  try {
    if (editingId) {
      await apiRequest(`${API_URL}/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description })
      });
      showToast('Task updated');
    } else {
      await apiRequest(API_URL, {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
      showToast('Task created');
    }

    resetForm();
    await loadTasks();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    state.busy = false;
    elements.submitButton.disabled = false;
  }
});

elements.cancelEditButton.addEventListener('click', resetForm);

elements.taskList.addEventListener('click', async (event) => {
  const actionButton = event.target.closest('[data-action]');
  const card = event.target.closest('[data-task-id]');
  if (!actionButton || !card) return;

  const task = state.tasks.find((item) => item._id === card.dataset.taskId);
  if (!task) return;

  const action = actionButton.dataset.action;

  if (action === 'edit') {
    startEditing(task);
    return;
  }

  try {
    actionButton.disabled = true;

    if (action === 'toggle') {
      await apiRequest(`${API_URL}/${task._id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed })
      });
      showToast(task.completed ? 'Task reopened' : 'Task completed');
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Delete “${task.title}”?`);
      if (!confirmed) {
        actionButton.disabled = false;
        return;
      }
      await apiRequest(`${API_URL}/${task._id}`, { method: 'DELETE' });
      if (elements.editingTaskId.value === task._id) resetForm();
      showToast('Task deleted');
    }

    await loadTasks();
  } catch (error) {
    showToast(error.message, 'error');
    actionButton.disabled = false;
  }
});

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    renderTasks();
  });
});

elements.refreshButton.addEventListener('click', async () => {
  elements.refreshButton.disabled = true;
  await Promise.all([loadTasks(), checkHealth()]);
  elements.refreshButton.disabled = false;
});

Promise.all([loadTasks(), checkHealth()]);
setInterval(checkHealth, 30000);
