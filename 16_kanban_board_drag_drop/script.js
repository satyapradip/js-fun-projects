/**
 * 📋 Machine Coding Interview: Kanban Board & HTML5 Drag and Drop Architecture
 * 
 * Key Concepts Demonstrated:
 * 1. HTML5 Drag and Drop Lifecycle (dragstart, dragover, drop, dragend)
 * 2. Position-aware Drop Insertion (calculating vertical sibling midpoint offsets)
 * 3. Immutable State Operations & LocalStorage Persistence
 * 4. Modal Dialog Lifecycle with Form Validation
 * 5. Full Keyboard Accessibility Fallback (Move Left / Move Right controls)
 * 6. Live Filter / Search across Board Columns
 */

(() => {
  'use strict';

  const COLUMNS = ['backlog', 'in-progress', 'in-review', 'done'];

  // Default seed data for initial view
  const INITIAL_TASKS = [
    {
      id: 'task-1',
      title: 'Implement OAuth2 PKCE Flow',
      desc: 'Secure single-page app authentication with token rotation.',
      priority: 'high',
      status: 'in-progress'
    },
    {
      id: 'task-2',
      title: 'Write Virtual DOM Diffing Engine',
      desc: 'Calculate minimal DOM mutations using key reconciler algorithm.',
      priority: 'high',
      status: 'backlog'
    },
    {
      id: 'task-3',
      title: 'Optimize Core Web Vitals (INP)',
      desc: 'Break up long JavaScript tasks using yield-to-main scheduler.',
      priority: 'medium',
      status: 'in-review'
    },
    {
      id: 'task-4',
      title: 'Setup GitHub Actions CI/CD',
      desc: 'Automate unit tests, bundle analysis, and cloud deployment.',
      priority: 'low',
      status: 'done'
    }
  ];

  // --- 1. STATE DEFINITION ---
  const state = {
    tasks: JSON.parse(localStorage.getItem('kanban_tasks')) || INITIAL_TASKS,
    searchFilter: '',
    draggingTaskId: null
  };

  function persistState() {
    localStorage.setItem('kanban_tasks', JSON.stringify(state.tasks));
  }

  // --- 2. DOM SELECTORS ---
  const kanbanGrid = document.querySelector('#kanbanGrid');
  const taskSearch = document.querySelector('#taskSearch');
  const openAddModalBtn = document.querySelector('#openAddModalBtn');
  const taskModal = document.querySelector('#taskModal');
  const closeModalBtn = document.querySelector('#closeModalBtn');
  const cancelModalBtn = document.querySelector('#cancelModalBtn');
  const taskForm = document.querySelector('#taskForm');
  const modalTitle = document.querySelector('#modalTitle');
  const taskIdInput = document.querySelector('#taskId');
  const taskTitleInput = document.querySelector('#taskTitleInput');
  const taskDescInput = document.querySelector('#taskDescInput');
  const taskPriorityInput = document.querySelector('#taskPriorityInput');
  const taskStatusInput = document.querySelector('#taskStatusInput');

  // --- 3. RENDERING ENGINE ---
  function render() {
    const filter = state.searchFilter.trim().toLowerCase();

    COLUMNS.forEach((colId) => {
      const dropzone = document.querySelector(`#zone-${colId}`);
      const countBadge = document.querySelector(`#count-${colId}`);
      
      const colTasks = state.tasks.filter((t) => {
        if (t.status !== colId) return false;
        if (!filter) return true;
        return (
          t.title.toLowerCase().includes(filter) ||
          t.desc.toLowerCase().includes(filter)
        );
      });

      countBadge.textContent = colTasks.length;
      dropzone.innerHTML = '';

      colTasks.forEach((task) => {
        const cardEl = createCardElement(task);
        dropzone.appendChild(cardEl);
      });
    });
  }

  function createCardElement(task) {
    const card = document.createElement('article');
    card.className = 'kanban-card';
    card.id = task.id;
    card.setAttribute('draggable', 'true');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Task: ${task.title}, Priority: ${task.priority}`);

    const colIndex = COLUMNS.indexOf(task.status);
    const canMoveLeft = colIndex > 0;
    const canMoveRight = colIndex < COLUMNS.length - 1;

    card.innerHTML = `
      <div class="card-top">
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        <div class="card-menu">
          <button type="button" class="btn-card-action edit-task" title="Edit Task" aria-label="Edit task">✏️</button>
          <button type="button" class="btn-card-action delete-task" title="Delete Task" aria-label="Delete task">🗑️</button>
        </div>
      </div>
      <h3 class="card-title">${escapeHTML(task.title)}</h3>
      <p class="card-desc">${escapeHTML(task.desc || 'No description provided.')}</p>
      <footer class="card-footer-controls">
        <div class="keyboard-move-btns">
          <button type="button" class="btn-move move-left" data-id="${task.id}" ${canMoveLeft ? '' : 'disabled'} title="Move Left">←</button>
          <button type="button" class="btn-move move-right" data-id="${task.id}" ${canMoveRight ? '' : 'disabled'} title="Move Right">→</button>
        </div>
      </footer>
    `;

    // Attach Drag Event Listeners to each card
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // --- 4. DRAG & DROP EVENT LIFECYCLE ---
  function handleDragStart(e) {
    state.draggingTaskId = e.target.id;
    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.effectAllowed = 'move';

    // Delay class addition so the dragged snapshot keeps normal appearance
    setTimeout(() => {
      e.target.classList.add('is-dragging');
    }, 0);
  }

  function handleDragEnd(e) {
    e.target.classList.remove('is-dragging');
    state.draggingTaskId = null;

    // Clean up hover states on all dropzones
    document.querySelectorAll('.cards-dropzone').forEach(z => z.classList.remove('drop-hover'));
  }

  // Bind Dropzone Listeners
  COLUMNS.forEach((colId) => {
    const dropzone = document.querySelector(`#zone-${colId}`);

    dropzone.addEventListener('dragover', (e) => {
      // MANDATORY: Calling preventDefault allows dropping
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dropzone.classList.add('drop-hover');
    });

    dropzone.addEventListener('dragleave', (e) => {
      // Only remove if leaving the dropzone boundary itself
      if (!dropzone.contains(e.relatedTarget)) {
        dropzone.classList.remove('drop-hover');
      }
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drop-hover');

      const taskId = e.dataTransfer.getData('text/plain') || state.draggingTaskId;
      if (!taskId) return;

      const targetCol = colId;
      moveTaskToColumn(taskId, targetCol, e.clientY, dropzone);
    });
  });

  // Calculate target insertion index using vertical midpoint
  function moveTaskToColumn(taskId, targetCol, clientY, dropzone) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = state.tasks[taskIndex];
    // Remove task from old array position
    state.tasks.splice(taskIndex, 1);
    task.status = targetCol;

    // Determine insertion position inside target column
    const siblingCards = Array.from(dropzone.querySelectorAll(`.kanban-card:not([id="${taskId}"])`));
    let insertIndexInCol = siblingCards.length;

    for (let i = 0; i < siblingCards.length; i++) {
      const box = siblingCards[i].getBoundingClientRect();
      const midpoint = box.top + box.height / 2;
      if (clientY < midpoint) {
        insertIndexInCol = i;
        break;
      }
    }

    // Insert task into global state array at calculated relative position
    const colTasks = state.tasks.filter(t => t.status === targetCol);
    if (insertIndexInCol >= colTasks.length) {
      state.tasks.push(task);
    } else {
      const targetSibling = colTasks[insertIndexInCol];
      const globalTargetIndex = state.tasks.indexOf(targetSibling);
      state.tasks.splice(globalTargetIndex, 0, task);
    }

    persistState();
    render();
  }

  // --- 5. KEYBOARD / BUTTON ACCESSIBILITY CONTROLS ---
  kanbanGrid.addEventListener('click', (e) => {
    // Move left
    if (e.target.classList.contains('move-left')) {
      const id = e.target.dataset.id;
      shiftTaskColumn(id, -1);
      return;
    }

    // Move right
    if (e.target.classList.contains('move-right')) {
      const id = e.target.dataset.id;
      shiftTaskColumn(id, +1);
      return;
    }

    // Edit task
    if (e.target.classList.contains('edit-task')) {
      const card = e.target.closest('.kanban-card');
      if (card) openEditModal(card.id);
      return;
    }

    // Delete task
    if (e.target.classList.contains('delete-task')) {
      const card = e.target.closest('.kanban-card');
      if (card) deleteTask(card.id);
      return;
    }
  });

  function shiftTaskColumn(taskId, direction) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = COLUMNS.indexOf(task.status);
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      task.status = COLUMNS[newIndex];
      persistState();
      render();
    }
  }

  function deleteTask(taskId) {
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;

    state.tasks = state.tasks.filter(t => t.id !== taskId);
    persistState();
    render();
  }

  // --- 6. MODAL & CRUD LOGIC ---
  function openAddModal() {
    modalTitle.textContent = 'Create New Task';
    taskIdInput.value = '';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskPriorityInput.value = 'medium';
    taskStatusInput.value = 'backlog';
    taskModal.hidden = false;
    taskTitleInput.focus();
  }

  function openEditModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.desc || '';
    taskPriorityInput.value = task.priority;
    taskStatusInput.value = task.status;
    taskModal.hidden = false;
    taskTitleInput.focus();
  }

  function closeModal() {
    taskModal.hidden = true;
    taskForm.reset();
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    if (!title) return;

    const id = taskIdInput.value;
    const desc = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const status = taskStatusInput.value;

    if (id) {
      // Update existing
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.title = title;
        task.desc = desc;
        task.priority = priority;
        task.status = status;
      }
    } else {
      // Create new
      const newTask = {
        id: `task-${Date.now()}`,
        title,
        desc,
        priority,
        status
      };
      state.tasks.unshift(newTask);
    }

    persistState();
    closeModal();
    render();
  });

  openAddModalBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Close modal when clicking backdrop
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  // Filter tasks
  taskSearch.addEventListener('input', (e) => {
    state.searchFilter = e.target.value;
    render();
  });

  // Initialize
  render();
})();
