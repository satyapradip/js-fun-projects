# 📋 Project 16: Kanban Board & HTML5 Drag and Drop Architecture

> **Master JavaScript From First Principles to Machine Coding Excellence**  
> *Category:* HTML5 Drag and Drop API, DOM Geometry & Positioning, State Immutability, LocalStorage CRUD  
> *Interview Level:* SDE-2 / SDE-3 Frontend Machine Coding Classic (Atlassian, Jira, Trello, Swiggy, Uber)  
> *Time to Implement in Interview:* 40–50 minutes  

---

## 📌 Table of Contents
1. [Project Overview & Mental Model](#-project-overview--mental-model)
2. [Visual Architecture Flow](#-visual-architecture-flow)
3. [Deep-Dive: Core JavaScript & Browser Mechanics](#-deep-dive-core-javascript--browser-mechanics)
   - [1. The HTML5 Drag and Drop Lifecycle](#1-the-html5-drag-and-drop-lifecycle)
   - [2. The Critical Gotcha: Why `dragover` Needs `e.preventDefault()`](#2-the-critical-gotcha-why-dragover-needs-epreventdefault)
   - [3. Precise Reordering: The Vertical Midpoint Algorithm](#3-precise-reordering-the-vertical-midpoint-algorithm)
   - [4. State Immutability vs Direct DOM Mutations](#4-state-immutability-vs-direct-dom-mutations)
   - [5. Keyboard Accessibility Fallback (WCAG)](#5-keyboard-accessibility-fallback-wcag)
4. [Machine Coding Round Playbook (45-Minute Roadmap)](#-machine-coding-round-playbook)
5. [Senior Engineer Refactor: Pointer Events Polyfill for Mobile Touch](#-senior-engineer-refactor-pointer-events-polyfill-for-mobile-touch)
6. [High-Yield Frontend Interview Questions & Answers](#-high-yield-frontend-interview-questions--answers)
7. [Level-Up Challenges](#-level-up-challenges)

---

## 📖 Project Overview & Mental Model

A **Kanban Board** evaluates full-stack frontend capabilities:
- Can the candidate master complex native browser event lifecycles?
- Do they understand DOM geometry and coordinate calculations (`getBoundingClientRect()`, `clientY`)?
- Can they maintain an immutable state architecture where moving, creating, editing, and deleting cards automatically syncs with persistent storage?
- Do they account for users who cannot use a mouse by providing accessible keyboard controls?

---

## 🔄 Visual Architecture Flow

```
User Drags Card "Task-1"
           │
           ▼
[ dragstart event on Card ]
  - Store dragging ID: e.dataTransfer.setData()
  - Set opacity / .is-dragging class
           │
           ▼
User Hovers Over Column "In Progress"
           │
           ▼
[ dragover event on Dropzone ]
  - e.preventDefault()  <── (Mandatory to allow drop!)
  - Set dropzone highlight (.drop-hover)
           │
           ▼
User Releases Mouse
           │
           ▼
[ drop event on Dropzone ]
  - Read dragging ID from e.dataTransfer
  - Loop siblings: Compare e.clientY against vertical midpoints
  - Calculate target array insertion index
           │
           ▼
State Reconciliation
  - Move task in state.tasks array
  - Persist to LocalStorage
  - Trigger pure render(state)
```

---

## 🧠 Deep-Dive: Core JavaScript & Browser Mechanics

### 1. The HTML5 Drag and Drop Lifecycle

The HTML5 DnD API involves two distinct participants: the **dragged source element** and the **target dropzone container**.

| Event | Target | Description |
| :--- | :--- | :--- |
| `dragstart` | Dragged Card | Fired once when drag begins. Set data payload with `e.dataTransfer.setData()`. |
| `drag` | Dragged Card | Continuously fired while dragging. |
| `dragenter` | Dropzone | Fired when the dragged element enters a valid dropzone boundary. |
| `dragover` | Dropzone | Continuously fired as the card moves inside the dropzone. **Must call `e.preventDefault()`.** |
| `dragleave` | Dropzone | Fired when the card leaves the dropzone boundary. |
| `drop` | Dropzone | Fired when the mouse button is released over the dropzone. |
| `dragend` | Dragged Card | Fired on the source card when dragging completes (whether dropped or cancelled). Clean up styles here! |

---

### 2. The Critical Gotcha: Why `dragover` Needs `e.preventDefault()`

By default, web browsers treat all DOM elements as **non-droppable**.
If a user drops an element onto a `<div>`, the browser cancels the drop and triggers its default action (like opening the dragged text or URL).

Calling `e.preventDefault()` inside the `dragover` listener signals to the browser engine: *"This element is an active drop target, permit the `drop` event to fire."*

```javascript
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault(); // MANDATORY!
  e.dataTransfer.dropEffect = 'move';
});
```

---

### 3. Precise Reordering: The Vertical Midpoint Algorithm

How do you know whether a dropped card should be placed above or below existing cards in a column?
We calculate the **vertical midpoint** of each sibling card using `getBoundingClientRect()`:

```javascript
function getInsertionIndex(dropzone, clientY) {
  const cards = Array.from(dropzone.querySelectorAll('.kanban-card:not(.is-dragging)'));

  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    const midpoint = rect.top + (rect.height / 2);

    // If the mouse is above the card's midpoint, insert right before this card!
    if (clientY < midpoint) {
      return i;
    }
  }

  // Otherwise, append to the end of the column
  return cards.length;
}
```

---

### 4. State Immutability vs Direct DOM Mutations

#### ❌ The Junior Anti-Pattern:
Directly appending DOM elements:
```javascript
dropzone.appendChild(draggedCardElement); // DANGEROUS!
```
*Why it fails:*
- The DOM is out of sync with your JavaScript state.
- LocalStorage cannot be updated cleanly.
- Filtering, sorting, or re-rendering destroys the modified order.

#### ✅ The Senior Solution:
Mutate state first, then re-render:
```javascript
// 1. Splice out of old index
state.tasks.splice(oldIndex, 1);
// 2. Update status
task.status = targetColumn;
// 3. Splice into new calculated index
state.tasks.splice(newIndex, 0, task);
// 4. Persist & render
persist();
render();
```

---

## ⏱️ Machine Coding Round Playbook

| Minute | Phase | Action Item |
| :-: | :--- | :--- |
| **00 - 05** | Requirements & Clarifications | Confirm column statuses, card schema, priority levels, persistence, and accessibility. |
| **05 - 12** | Semantic HTML & CSS Grid | Setup 4 column containers with grid layout, card styles, and modal markup. |
| **12 - 25** | HTML5 Drag & Drop Core | Implement `dragstart`, `dragover` (`preventDefault`), `drop`, and `dragend`. |
| **25 - 35** | Midpoint Insertion & State Sync | Calculate `clientY` midpoint, update `state.tasks`, and persist to `localStorage`. |
| **35 - 45** | Modal Dialog CRUD & Polish | Build Add/Edit task modal, delete confirmation, and keyboard arrow move buttons. |

---

## ❓ High-Yield Frontend Interview Questions & Answers

### Q1: Why does HTML5 Drag and Drop fail on mobile touch devices, and how do you resolve it?
**Answer:** The HTML5 Drag and Drop specification was designed specifically for pointer mouse events (`dragstart`, `drop`). Mobile touch browsers (iOS Safari, Android Chrome) trigger `touchstart`, `touchmove`, and `touchend` instead of drag events. To support mobile, either use a lightweight polyfill (like `mobile-drag-drop`) or build a unified drag interaction using **Pointer Events** (`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`).

### Q2: Why does `e.target.classList.add('is-dragging')` need a `setTimeout(..., 0)` inside `dragstart`?
**Answer:** When `dragstart` fires, the browser immediately captures a snapshot bitmap of the element to use as the visual "ghost" dragging under the cursor. If you synchronously set `opacity: 0.3` or hide the element, the ghost preview will also become invisible! Deferring the class addition via macrotask queue (`setTimeout(..., 0)`) lets the browser capture the full-opacity snapshot first.

---

## 🏆 Level-Up Challenges
1. **Column Reordering:** Allow users to drag and reorder entire columns (e.g. swap "In Progress" with "In Review").
2. **Subtasks & Checklist Progress:** Add checklists to cards with a dynamic progress bar (e.g. 2/4 completed).
3. **Undo/Redo History:** Implement an Undo stack (`Ctrl+Z`) using the Command Pattern to revert inadvertent drops.
