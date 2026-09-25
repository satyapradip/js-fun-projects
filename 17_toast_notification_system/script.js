/**
 * 🍞 Machine Coding Interview: Production Toast Notification Architecture
 * 
 * Key Concepts Demonstrated:
 * 1. Singleton Library API Design (Toast.show, Toast.success, etc.)
 * 2. FIFO Queue & Concurrency Limiting (Prevents viewport flooding)
 * 3. Pause-on-Hover Timer Math (Accurate remaining duration preservation)
 * 4. CSS Animation Lifecycle Synchronization (animationend vs DOM removal)
 * 5. Screen Reader Accessibility (role="alert" vs role="status")
 */

(() => {
  'use strict';

  // --- SVG ICONS MAPPING ---
  const ICONS = {
    success: `<svg viewBox="0 0 24 24" width="20" height="20" class="toast-icon"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    error: `<svg viewBox="0 0 24 24" width="20" height="20" class="toast-icon"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" width="20" height="20" class="toast-icon"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    info: `<svg viewBox="0 0 24 24" width="20" height="20" class="toast-icon"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
  };

  // --- 1. TOAST MANAGER SINGLETON CLASS ---
  class ToastManager {
    constructor() {
      this.container = document.querySelector('#toastContainer');
      this.queue = [];          // Overflow FIFO queue
      this.activeToasts = new Map(); // id -> Toast instance
      this.maxVisible = 4;
      this.defaultDuration = 4000;
      this.totalDispatched = 0;
      this.position = 'top-right';
    }

    setPosition(pos) {
      this.position = pos;
      this.container.className = `toast-container ${pos}`;
    }

    setMaxVisible(limit) {
      this.maxVisible = Math.max(1, limit);
      this.processQueue();
    }

    setDefaultDuration(duration) {
      this.defaultDuration = Math.max(500, duration);
    }

    /**
     * Public Dispatcher API
     */
    show(options) {
      this.totalDispatched++;
      const config = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: options.title || 'Notification',
        message: options.message || '',
        type: options.type || 'info', // 'success' | 'error' | 'warning' | 'info'
        duration: options.duration || this.defaultDuration,
        action: options.action || null // { label: string, onClick: fn }
      };

      if (this.activeToasts.size < this.maxVisible) {
        this.displayToast(config);
      } else {
        // Enforce FIFO queue when limit reached
        this.queue.push(config);
      }

      this.updateDiagnostics();
      return config.id;
    }

    success(title, message, options = {}) {
      return this.show({ ...options, title, message, type: 'success' });
    }

    error(title, message, options = {}) {
      return this.show({ ...options, title, message, type: 'error' });
    }

    warning(title, message, options = {}) {
      return this.show({ ...options, title, message, type: 'warning' });
    }

    info(title, message, options = {}) {
      return this.show({ ...options, title, message, type: 'info' });
    }

    /**
     * Instantiate and Mount Toast into DOM
     */
    displayToast(config) {
      const toastEl = document.createElement('div');
      toastEl.id = config.id;
      toastEl.className = `toast-item toast-${config.type}`;
      
      // Accessibility
      const isUrgent = config.type === 'error' || config.type === 'warning';
      toastEl.setAttribute('role', isUrgent ? 'alert' : 'status');

      toastEl.innerHTML = `
        ${ICONS[config.type] || ICONS.info}
        <div class="toast-content">
          <h4 class="toast-title">${escapeHTML(config.title)}</h4>
          ${config.message ? `<p class="toast-msg">${escapeHTML(config.message)}</p>` : ''}
          ${config.action ? `<button type="button" class="toast-action-btn">${escapeHTML(config.action.label)}</button>` : ''}
        </div>
        <button type="button" class="toast-dismiss-btn" aria-label="Dismiss">&times;</button>
        <div class="toast-progress" style="animation-duration: ${config.duration}ms;"></div>
      `;

      // Mount into container
      this.container.appendChild(toastEl);

      // Timer & Pause-on-Hover Controller
      const controller = {
        element: toastEl,
        timerId: null,
        remainingTime: config.duration,
        startTime: Date.now()
      };

      const startTimer = () => {
        controller.startTime = Date.now();
        controller.timerId = setTimeout(() => {
          this.dismiss(config.id);
        }, controller.remainingTime);
      };

      const pauseTimer = () => {
        if (controller.timerId) {
          clearTimeout(controller.timerId);
          controller.timerId = null;
          const elapsed = Date.now() - controller.startTime;
          controller.remainingTime = Math.max(0, controller.remainingTime - elapsed);
        }
      };

      // Listeners
      toastEl.addEventListener('mouseenter', pauseTimer);
      toastEl.addEventListener('mouseleave', () => {
        if (controller.remainingTime > 0) startTimer();
      });

      // Dismiss button
      const dismissBtn = toastEl.querySelector('.toast-dismiss-btn');
      dismissBtn.addEventListener('click', () => this.dismiss(config.id));

      // Action button
      if (config.action) {
        const actionBtn = toastEl.querySelector('.toast-action-btn');
        actionBtn.addEventListener('click', () => {
          config.action.onClick();
          this.dismiss(config.id);
        });
      }

      this.activeToasts.set(config.id, controller);
      startTimer();
      this.updateDiagnostics();
    }

    /**
     * Dismiss with exit animation & process next queued item
     */
    dismiss(toastId) {
      const controller = this.activeToasts.get(toastId);
      if (!controller) return;

      if (controller.timerId) clearTimeout(controller.timerId);
      this.activeToasts.delete(toastId);

      const el = controller.element;
      el.classList.add('toast-closing');

      // Wait for slide-out animation to complete before removing from DOM
      const handleAnimationEnd = () => {
        el.removeEventListener('animationend', handleAnimationEnd);
        if (el.parentNode) el.parentNode.removeChild(el);
        this.processQueue();
        this.updateDiagnostics();
      };

      el.addEventListener('animationend', handleAnimationEnd);

      // Fallback timer in case animationend fails
      setTimeout(handleAnimationEnd, 300);
    }

    /**
     * FIFO queue processor
     */
    processQueue() {
      if (this.queue.length > 0 && this.activeToasts.size < this.maxVisible) {
        const nextToast = this.queue.shift();
        this.displayToast(nextToast);
      }
      this.updateDiagnostics();
    }

    updateDiagnostics() {
      const diagActive = document.querySelector('#diagActive');
      const diagQueued = document.querySelector('#diagQueued');
      const diagTotal = document.querySelector('#diagTotal');

      if (diagActive) diagActive.textContent = this.activeToasts.size;
      if (diagQueued) diagQueued.textContent = this.queue.length;
      if (diagTotal) diagTotal.textContent = this.totalDispatched;
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Instantiate Toast singleton
  const Toast = new ToastManager();

  // --- 2. PLAYGROUND UI HANDLERS ---
  const btnSuccess = document.querySelector('#btnSuccess');
  const btnError = document.querySelector('#btnError');
  const btnWarning = document.querySelector('#btnWarning');
  const btnInfo = document.querySelector('#btnInfo');
  const btnActionToast = document.querySelector('#btnActionToast');
  const btnBurstToast = document.querySelector('#btnBurstToast');
  const positionSelect = document.querySelector('#positionSelect');
  const durationInput = document.querySelector('#durationInput');
  const maxQueueInput = document.querySelector('#maxQueueInput');

  btnSuccess.addEventListener('click', () => {
    Toast.success('Deployment Succeeded', 'Production artifacts built and deployed to edge nodes.');
  });

  btnError.addEventListener('click', () => {
    Toast.error('Database Sync Failed', 'Connection timed out while replicating to us-east cluster.');
  });

  btnWarning.addEventListener('click', () => {
    Toast.warning('Rate Limit Approaching', 'You have consumed 85% of your hourly API quota.');
  });

  btnInfo.addEventListener('click', () => {
    Toast.info('New Update Available', 'Version 3.4.0 is ready to install.');
  });

  btnActionToast.addEventListener('click', () => {
    Toast.show({
      title: 'Item Deleted',
      message: 'Product "Pro Headphones" moved to trash.',
      type: 'warning',
      action: {
        label: 'Undo Action',
        onClick: () => {
          Toast.success('Restored!', 'Item has been recovered back to catalog.');
        }
      }
    });
  });

  btnBurstToast.addEventListener('click', () => {
    for (let i = 1; i <= 8; i++) {
      setTimeout(() => {
        Toast.info(`Burst Event #${i}`, `Queued notification item index ${i}`);
      }, i * 35);
    }
  });

  positionSelect.addEventListener('change', (e) => {
    Toast.setPosition(e.target.value);
  });

  durationInput.addEventListener('input', (e) => {
    Toast.setDefaultDuration(Number(e.target.value));
  });

  maxQueueInput.addEventListener('input', (e) => {
    Toast.setMaxVisible(Number(e.target.value));
  });

  // Initial update
  Toast.updateDiagnostics();
})();
