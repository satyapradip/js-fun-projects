# 🎯 Project 09: Custom Cursor & Smooth Follower

> **Master JavaScript From First Principles to Machine Coding Excellence**  
> *Category:* Mouse/Pointer Coordinates, Browser Rendering Pipeline, `requestAnimationFrame`, Performance  
> *Interview Level:* SDE-1 / SDE-2 Frontend Machine Coding  
> *Time to Implement in Interview:* 25–30 minutes  

---

## 📌 Table of Contents
1. [Project Overview & Mental Model](#-project-overview--mental-model)
2. [Visual Architecture Flow](#-visual-architecture-flow)
3. [Original Code Breakdown (Line by Line)](#-original-code-breakdown-line-by-line)
4. [Deep-Dive: Core JavaScript Concepts](#-deep-dive-core-javascript-concepts)
   - [1. The 4 Mouse Coordinate Systems (`client` vs `page` vs `screen` vs `offset`)](#1-the-4-mouse-coordinate-systems-client-vs-page-vs-screen-vs-offset)
   - [2. The Browser Rendering Pipeline (Layout Thrashing & Jank)](#2-the-browser-rendering-pipeline-layout-thrashing--jank)
   - [3. `requestAnimationFrame` (rAF) & The 60/120 FPS Screen Refresh Rate](#3-requestanimationframe-raf--the-60120-fps-screen-refresh-rate)
   - [4. Lerping (Linear Interpolation) for Physics-Based Smoothness](#4-lerping-linear-interpolation-for-physics-based-smoothness)
   - [5. Accessibility & Touch Detection (`@media (pointer: fine)`)](#5-accessibility--touch-detection-media-pointer-fine)
5. [Machine Coding Round Playbook](#-machine-coding-round-playbook)
   - [Interview Prompt](#interview-prompt)
   - [Evaluation Checklist](#evaluation-checklist)
   - [Common Mistakes Candidates Make](#common-mistakes-candidates-make)
6. [Senior Engineer Refactored Code (Production Grade)](#-senior-engineer-refactored-code-production-grade)
7. [High-Yield Frontend Interview Questions & Answers](#-high-yield-frontend-interview-questions--answers)
8. [Level-Up Challenges](#-level-up-challenges)

---

## 📖 Project Overview & Mental Model

Custom interactive cursors are ubiquitous in modern award-winning creative websites (Awwwards, Apple, Stripe, Framer). They replace the default OS pointer with custom interactive graphics that expand on links, blend over background colors (`mix-blend-mode: difference`), and exhibit silky smooth trailing physics.

### The Mental Model
```
[User Moves Mouse]
       │
       ▼ (fires up to 120+ times/sec)
[Extract Target Mouse Coordinates (targetX, targetY)]
       │
       ▼ (Decoupled via requestAnimationFrame)
[Interpolate Position: currentX += (targetX - currentX) * 0.15]
       │
       ▼
[Apply CSS transform: translate3d(x, y, 0)] (Compositor Layer)
```

---

## 🔄 Visual Architecture Flow

```
Raw Mousemove Events (Unsynchronized with Monitor)
[Event] [Event] [Event] [Event] [Event] [Event]
    │       │       │       │       │       │
    ▼       ▼       ▼       ▼       ▼       ▼
    Update Target Coordinates (targetX, targetY)
                     │
                     ▼
           ┌───────────────────┐
           │ Monitor V-Sync    │ (e.g. 60Hz / 120Hz)
           └─────────┬─────────┘
                     │
                     ▼
        requestAnimationFrame Tick
                     │
     ┌───────────────┴───────────────┐
     │ 1. Calculate Lerp Position    │
     │ 2. Apply translate3d(x, y, 0) │
     └───────────────────────────────┘
```

---

## 🔍 Original Code Breakdown (Line by Line)

Here is the original code from [script.js](file:///e:/js-fun-projects/09_custom_cursor_project/script.js):

```javascript
1: var main = document.querySelector('#main');
2: var cursor = document.querySelector('.cursor');
3: 
4: main.addEventListener('mousemove', function(dts) {
5:     cursor.style.left = dts.pageX + 'px';
6:     cursor.style.top = dts.pageY + 'px';
7:     
8: })
```

### Detailed Breakdown:
- **Line 1 & 2**: Selects the container `#main` and cursor element `.cursor`.
- **Line 4**: Attaches a `mousemove` event listener. The parameter `dts` (event) carries the mouse event coordinates.
- **Lines 5 & 6**: Sets `cursor.style.left` and `cursor.style.top` directly using `dts.pageX` and `dts.pageY`.
- **⚠️ Performance Critique**:
  1. Setting `top` and `left` repeatedly triggers continuous **Layout (Reflow)** calculations.
  2. If the user moves their mouse rapidly across a 144Hz gaming mouse, `mousemove` fires hundreds of times per second—far faster than the browser can paint—causing severe CPU spikes and frame drops.
  3. `pageX` and `pageY` include scroll offsets; if the page is scrolled, the cursor could be offset if `.cursor` is `position: fixed`.

---

## 🧠 Deep-Dive: Core JavaScript Concepts

### 1. The 4 Mouse Coordinate Systems

Understanding coordinate systems is a classic frontend interview filter:

```
+---------------------------------------------------------+ (Screen top-left: 0, 0)
| Entire Monitor Screen (screenX, screenY)                |
|   +-------------------------------------------------+   |
|   | Browser Viewport Window (clientX, clientY)      |   |
|   |   +-----------------------------------------+   |   |
|   |   | Full Scrollable Webpage (pageX, pageY)  |   |   |
|   |   |    +-----------------------------+      |   |   |
|   |   |    | Target Element (offsetX/Y)  |      |   |   |
|   |   |    +-----------------------------+      |   |   |
+---+---+-----------------------------------------+---+---+
```

| Coordinate | Reference Point | Affected by Scroll? | Best Used For |
| :--- | :--- | :--- | :--- |
| `clientX` / `clientY` | Top-left of the visible **viewport** | ❌ No | Elements with `position: fixed` (like custom cursors) |
| `pageX` / `pageY` | Top-left of the entire **rendered document** | ✅ Yes | Elements positioned relative to the full page document |
| `screenX` / `screenY` | Top-left of the physical **computer monitor** | ❌ No | Multi-window desktop apps, window positioning |
| `offsetX` / `offsetY` | Top-left of the **target element's padding edge** | ❌ No | Drawing on HTML5 Canvas, inner-card clicks |

---

### 2. The Browser Rendering Pipeline (Layout Thrashing & Jank)

Every time a frame is rendered, the browser goes through these stages:

```
[1. JavaScript] ➔ [2. Style Recalc] ➔ [3. Layout (Reflow)] ➔ [4. Paint] ➔ [5. Composite]
```

- When you change `left` / `top`: The browser must recalculate the geometry of elements (**Layout**), re-draw pixels (**Paint**), and blend layers (**Composite**).
- When you use `transform: translate3d(x, y, 0)`: The browser bypasses Layout and Paint entirely, handing the element directly to the **GPU Compositor**.

---

### 3. `requestAnimationFrame` (rAF) & The 60/120 FPS Screen Refresh Rate

Instead of mutating styles inside `mousemove`, we update simple numeric variables in the event listener, and mutate the DOM inside `requestAnimationFrame`:

```javascript
let mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function loop() {
  cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  requestAnimationFrame(loop); // Synchronizes with monitor refresh
}
requestAnimationFrame(loop);
```

---

### 4. Lerping (Linear Interpolation) for Physics-Based Smoothness

To give the cursor that "luxurious, smooth-trailing" aesthetic seen on top-tier agency websites, we use **Linear Interpolation (Lerp)**:

$$\text{current} = \text{current} + (\text{target} - \text{current}) \times \text{factor}$$

```javascript
let currentX = 0, currentY = 0;
let targetX = 0, targetY = 0;
const EASE = 0.15; // Smoothness factor (0.05 = heavy/sluggish, 0.3 = snappy)

function animate() {
  currentX += (targetX - currentX) * EASE;
  currentY += (targetY - currentY) * EASE;

  cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  requestAnimationFrame(animate);
}
```

---

### 5. Accessibility & Touch Detection (`@media (pointer: fine)`)

Custom cursors on mobile touch screens are a terrible UX bug (the cursor gets stuck wherever the user taps).
In CSS and JS, always restrict custom cursors to devices with high-precision pointing devices (mice, trackpads):

```css
/* Only show custom cursor on devices that actually have a fine pointer (mouse) */
@media (pointer: coarse) {
  .custom-cursor {
    display: none !important;
  }
}
```

---

## 💼 Machine Coding Round Playbook

### Interview Prompt
> *"Design and implement a high-performance custom cursor with a trailing follower circle. The cursor should follow the mouse smoothly at 60+ FPS without layout thrashing. When the user hovers over interactive elements (buttons, links), the cursor should scale up and invert colors. It must be disabled gracefully on mobile touch screens."*

### Evaluation Checklist
- [x] **Uses `clientX/clientY` and `translate3d`**: Avoids `pageX/Y` with `top/left`.
- [x] **Decoupled Render Loop**: Uses `requestAnimationFrame` instead of updating styles synchronously in `mousemove`.
- [x] **`pointer-events: none` on cursor**: Ensures the custom cursor element never blocks clicks or hovers on underlying elements!
- [x] **Hover state interactions**: Scales or inverts on hoverable elements.

---

## 🚀 Senior Engineer Refactored Code (Production Grade)

### CSS (`style.css`)
```css
/* Hide default cursor only when custom cursor is active and pointer is fine */
@media (pointer: fine) {
  body {
    cursor: none;
  }
}

/* Base cursor dot */
.cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  pointer-events: none; /* Crucial: clicks pass straight through! */
  z-index: 9999;
  will-change: transform;
  mix-blend-mode: difference;
}

/* Trailing cursor ring */
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  width: 36px;
  height: 36px;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9998;
  will-change: transform;
  transition: width 0.25s ease, height 0.25s ease, background-color 0.25s ease;
  mix-blend-mode: difference;
}

/* Hover state on clickable links or buttons */
.cursor-ring.is-hovering {
  width: 64px;
  height: 64px;
  background-color: rgba(255, 255, 255, 0.2);
  border-color: transparent;
}
```

### JavaScript (`script.js`)
```javascript
/**
 * Production-Ready Custom Cursor with Trailing Lerp Physics
 */
(function initSmoothCursor() {
  'use strict';

  // Guard: If device is touch-based, do not initialize
  if (window.matchMedia('(pointer: coarse)').matches) {
    return;
  }

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');

  if (!dot || !ring) return;

  // State
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  const LERP_FACTOR = 0.15; // Smoothness factor

  // 1. Mouse move updates target coords only (zero layout thrashing)
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // 2. Continuous 60fps render loop
  function renderLoop() {
    // Immediate dot positioning (centered)
    dot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;

    // Interpolated ring positioning (centered)
    ringX += (mouseX - ringX) * LERP_FACTOR;
    ringY += (mouseY - ringY) * LERP_FACTOR;
    ring.style.transform = `translate3d(${ringX - 18}px, ${ringY - 18}px, 0)`;

    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);

  // 3. Hover state expansion on interactive elements
  const interactables = document.querySelectorAll('a, button, input, .interactive');
  interactables.forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'));
  });
})();
```

---

## ❓ High-Yield Frontend Interview Questions & Answers

### Q1: Why is `pointer-events: none` essential on custom cursor elements?
**Answer:**
If you don't set `pointer-events: none` on the custom cursor DOM node, the cursor element itself sits directly under the mouse. When the user tries to click a button, link, or input, the click hits the custom cursor `<div>` instead of the button! `pointer-events: none` makes the element transparent to all mouse and touch events.

### Q2: Why use `translate3d(x, y, 0)` instead of `translate(x, y)`?
**Answer:**
`translate3d(x, y, 0)` forces the browser engine to promote the element to its own dedicated **GPU compositor layer** (hardware acceleration). This ensures that frequent positional updates do not trigger CPU-bound paint cycles.

---

## 🏆 Level-Up Challenges
- **Bronze**: Hide the custom cursor when the mouse leaves the browser window (`mouseleave` on `document`).
- **Silver**: Implement a click reaction where the trailing ring shrinks to half size on `mousedown` and pops back on `mouseup`.
- **Gold**: Implement "Magnetic Buttons"—when the cursor comes within 40px of a button, the button gently pulls towards the cursor.
