# 🍞 Project 17: Toast Notification System & Queue Architecture

> **Master JavaScript From First Principles to Machine Coding Excellence**  
> *Category:* Library API Design, Concurrency & FIFO Queuing, Micro-Interactions, Animation Lifecycle, WCAG Accessibility  
> *Interview Level:* SDE-2 Frontend Machine Coding Classic (Meta, Google, Razorpay, Flipkart, Swiggy)  
> *Time to Implement in Interview:* 35–45 minutes  

---

## 📌 Table of Contents
1. [Project Overview & Mental Model](#-project-overview--mental-model)
2. [Visual Architecture Flow](#-visual-architecture-flow)
3. [Deep-Dive: Core JavaScript & Browser Mechanics](#-deep-dive-core-javascript--browser-mechanics)
   - [1. Library API Ergonomics & The Singleton Pattern](#1-library-api-ergonomics--the-singleton-pattern)
   - [2. Viewport Overflow Protection: The FIFO Concurrency Queue](#2-viewport-overflow-protection-the-fifo-concurrency-queue)
   - [3. The Math of Pause-on-Hover Timers](#3-the-math-of-pause-on-hover-timers)
   - [4. Synchronizing CSS Keyframes with `animationend`](#4-synchronizing-css-keyframes-with-animationend)
   - [5. WCAG Screen Reader Semantics (`role="alert"` vs `role="status"`)](#5-wcag-screen-reader-semantics-rolealert-vs-rolestatus)
4. [Machine Coding Round Playbook (40-Minute Roadmap)](#-machine-coding-round-playbook)
5. [Senior Engineer Pattern: Decoupled Pub-Sub Event Bus Architecture](#-senior-engineer-pattern-decoupled-pub-sub-event-bus-architecture)
6. [High-Yield Frontend Interview Questions & Answers](#-high-yield-frontend-interview-questions--answers)
7. [Level-Up Challenges](#-level-up-challenges)

---

## 📖 Project Overview & Mental Model

In frontend machine coding rounds, interviewers often ask: *"Design a toast notification library like react-hot-toast or sonner from scratch in Vanilla JavaScript."*

This problem evaluates:
- **API Ergonomics:** Can other engineers easily call `Toast.success('Saved!')` without needing to configure DOM nodes?
- **Concurrency Management:** What happens if an API error triggers 15 notifications at once? Does it wreck the UI layout, or does a queue throttle them?
- **Animation Teardown:** Do you remove the element immediately (causing a jarring visual snap) or wait for the exit animation to finish?
- **User Control:** Does the auto-dismiss timer pause when the user hovers over the notification to read it?

---

## 🔄 Visual Architecture Flow

```
Toast.show({ title, type, duration })
                 │
                 ▼
      Active Toasts < Max Visible?
     ├── YES ──► Instantiate & Mount Toast DOM
     │                 │
     │                 ▼
     │           Start Auto-Dismiss Timer (e.g. 4000ms)
     │                 │
     │                 ▼
     │           [ Mouse Enters Toast ]
     │                 │
     │                 ▼
     │           Pause Timer & Calculate Remaining Duration:
     │           remaining = duration - (Date.now() - startTime)
     │                 │
     │                 ▼
     │           [ Mouse Leaves Toast ]
     │                 │
     │                 ▼
     │           Resume Timer with `remaining`
     │                 │
     │                 ▼
     │           Timer Expires OR User Clicks Close
     │                 │
     │                 ▼
     │           Add `.toast-closing` Class
     │                 │
     │                 ▼
     │           Wait for `animationend` Event
     │                 │
     │                 ▼
     │           Remove DOM Node & Call `processQueue()`
     │
     └── NO  ──► Push to `this.queue` (FIFO Array)
```

---

## 🧠 Deep-Dive: Core JavaScript & Browser Mechanics

### 1. Library API Ergonomics & The Singleton Pattern

A production notification system should expose an elegant, fluent API:
```javascript
Toast.success('Saved', 'Profile updated successfully.');
Toast.error('Failed', 'Payment gateway unreachable.');
Toast.show({
  title: 'Item Deleted',
  type: 'warning',
  duration: 6000,
  action: { label: 'Undo', onClick: () => restoreItem() }
});
```
Behind the scenes, a single `ToastManager` instance maintains the container DOM node and coordinate placements.

---

### 2. Viewport Overflow Protection: The FIFO Concurrency Queue

When a burst of events fires simultaneously (e.g. 10 network errors), rendering all 10 toasts covers the user's screen.
We enforce a **Concurrency Limit** (`maxVisible = 4`):

```javascript
show(options) {
  if (this.activeToasts.size < this.maxVisible) {
    this.displayToast(options);
  } else {
    this.queue.push(options); // Enqueue in FIFO line
  }
}

dismiss(id) {
  // Teardown active toast...
  this.activeToasts.delete(id);

  // Dequeue next waiting toast
  if (this.queue.length > 0 && this.activeToasts.size < this.maxVisible) {
    const next = this.queue.shift();
    this.displayToast(next);
  }
}
```

---

### 3. The Math of Pause-on-Hover Timers

To pause on hover, we must calculate the exact remaining time:

```javascript
let startTime = Date.now();
let remainingTime = 4000;
let timerId = null;

function startTimer() {
  startTime = Date.now();
  timerId = setTimeout(dismiss, remainingTime);
}

function pauseTimer() {
  clearTimeout(timerId);
  timerId = null;
  // Subtract elapsed time from remaining duration:
  const elapsed = Date.now() - startTime;
  remainingTime = Math.max(0, remainingTime - elapsed);
}

element.addEventListener('mouseenter', pauseTimer);
element.addEventListener('mouseleave', () => {
  if (remainingTime > 0) startTimer();
});
```

---

### 4. Synchronizing CSS Keyframes with `animationend`

#### ❌ The Junior Bug:
```javascript
element.classList.add('slide-out');
element.remove(); // REMOVED INSTANTLY! No animation plays!
```

#### ✅ The Senior Solution:
Wait for the browser's GPU animation to emit `animationend`:
```javascript
element.classList.add('toast-closing');

element.addEventListener('animationend', () => {
  element.remove();
  processQueue();
}, { once: true });
```

---

### 5. WCAG Screen Reader Semantics (`role="alert"` vs `role="status"`)

- **Errors / Warnings:** `role="alert"` (`aria-live="assertive"`). The screen reader interrupts any current reading immediately to announce the urgent issue.
- **Success / Info:** `role="status"` (`aria-live="polite"`). The screen reader waits until the user finishes their current reading before speaking.

---

## ⏱️ Machine Coding Round Playbook

| Minute | Phase | Action Item |
| :-: | :--- | :--- |
| **00 - 05** | Requirements & Edge Cases | Confirm API design (`Toast.show`), concurrency limit, position support, and pause-on-hover. |
| **05 - 12** | CSS Layout & Keyframes | Write fixed container CSS, slide-in/out keyframe animations, and progress bar. |
| **12 - 25** | Singleton & FIFO Queue | Implement `ToastManager` class, `activeToasts` map, and queue processing. |
| **25 - 35** | Pause-on-Hover & Lifecycle | Wire up `mouseenter`/`mouseleave` timestamp delta calculations and `animationend` listener. |
| **35 - 40** | Polish & Accessibility | Add `role="alert"`, action button callbacks, and position switcher. |

---

## ❓ High-Yield Frontend Interview Questions & Answers

### Q1: Why do we use `pointer-events: none` on `.toast-container` and `pointer-events: auto` on `.toast-item`?
**Answer:** The toast container is positioned fixed over the viewport (e.g. covering the top-right corner). If it captures pointer events, users cannot click on buttons, links, or navigation items located underneath empty space in that corner. Setting `pointer-events: none` on the container lets clicks pass through harmlessly, while `pointer-events: auto` on the individual toast cards ensures they remain clickable.

### Q2: What happens if an `animationend` event fails to fire (e.g., if CSS animations are disabled by user's `prefers-reduced-motion`)?
**Answer:** If the user has OS-level reduced motion enabled or the animation fails to trigger, the element might never be removed, stalling the queue. A resilient implementation always adds a fallback `setTimeout(() => cleanup(), animationDuration + 50)`.

---

## 🏆 Level-Up Challenges
1. **Swipe to Dismiss:** Use touch/pointer events to allow swiping toasts off the screen horizontally on mobile.
2. **Stacked Cards Layout:** Implement the modern Sonner-style stacked card deck effect where older toasts shrink and tuck under the latest toast.
3. **Promise Toasts:** Add `Toast.promise(asyncFn, { loading, success, error })` that automatically updates the same toast in place as a promise resolves.
