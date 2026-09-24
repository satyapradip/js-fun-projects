# 🖼️ Project 10: Image Hover & Cursor Follower Effect

> **Master JavaScript From First Principles to Machine Coding Excellence**  
> *Category:* Event Delegation, DOM Geometry (`getBoundingClientRect`), Memory Optimization, Debugging  
> *Interview Level:* SDE-1 / SDE-2 Frontend Machine Coding  
> *Time to Implement in Interview:* 25–35 minutes  

---

## 📌 Table of Contents
1. [Project Overview & Mental Model](#-project-overview--mental-model)
2. [Visual Architecture Flow](#-visual-architecture-flow)
3. [Original Code Breakdown & Bug Analysis](#-original-code-breakdown--bug-analysis)
   - [The Glaring `ReferenceError` Bug](#the-glaring-referenceerror-bug)
   - [The Relative Positioning Problem](#the-relative-positioning-problem)
4. [Deep-Dive: Core JavaScript Concepts](#-deep-dive-core-javascript-concepts)
   - [1. Event Propagation: Capturing, Target, and Bubbling](#1-event-propagation-capturing-target-and-bubbling)
   - [2. Event Delegation: $O(1)$ vs $O(N)$ Listeners](#2-event-delegation-o1-vs-on-listeners)
   - [3. Element Geometry: `getBoundingClientRect()` Explained](#3-element-geometry-getboundingclientrect-explained)
   - [4. `NodeList` vs `HTMLCollection` vs `Array`](#4-nodelist-vs-htmlcollection-vs-array)
   - [5. GPU Positioning vs Layout Trashing](#5-gpu-positioning-vs-layout-trashing)
5. [Machine Coding Round Playbook](#-machine-coding-round-playbook)
   - [Interview Prompt](#interview-prompt)
   - [Evaluation Checklist](#evaluation-checklist)
   - [Common Mistakes Candidates Make](#common-mistakes-candidates-make)
6. [Senior Engineer Refactored Code (Production Grade)](#-senior-engineer-refactored-code-production-grade)
7. [High-Yield Frontend Interview Questions & Answers](#-high-yield-frontend-interview-questions--answers)
8. [Level-Up Challenges](#-level-up-challenges)

---

## 📖 Project Overview & Mental Model

This UI pattern is seen in high-end design agency portfolios (e.g., Cuberto, Locomotive, Apple News):
- A list of text items or headlines is displayed.
- When the user hovers over any row, a rich image preview reveals itself.
- As the mouse moves across the row, the preview image smoothly glides alongside the cursor within the boundaries of that row.
- Moving the mouse away fades the image out cleanly.

---

## 🔄 Visual Architecture Flow

```
User Moves Cursor Inside List Row (.elem)
                     │
                     ▼
       ┌───────────────────────────┐
       │ Capture Mouse Coordinates │ (e.clientX, e.clientY)
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ Calculate Relative Offset │
       │ relX = clientX - rect.left│
       │ relY = clientY - rect.top │
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │  Update Image Position    │
       │  transform: translate3d   │
       └───────────────────────────┘
```

---

## 🔍 Original Code Breakdown & Bug Analysis

Here is the original code from [script.js](file:///e:/js-fun-projects/10_image_howver_project/script.js):

```javascript
1: var elem = document.querySelectorAll('.elem');
2: 
3: elem.forEach(function(val){
4:     var img = val.querySelector('img');
5:     val.addEventListener('mouseenter', function(){
6:         img.style.opacity = 1;
7:     });
8: 
9:     val.addEventListener('mouseleave', function(){
10:         img.style.opacity = 0;
11:     });
12: 
13:     val.addEventListener('mousemove', function(dts){
14:         // var bounds = val.getBoundingClientRect();
15:         // img.style.left = (dets.clientX - bounds.left) + 'px';
16:         // img.style.top = (dets.clientY - bounds.top) + 'px';
17:         img.style.left = dts.pageX + 'px';
18:         cursor.style.top = dts.pageY + 'px';
19:     });
20: });
```

### Critical Code Inspection & Bugs:

#### 1. The Glaring `ReferenceError` Bug (Line 18)
```javascript
cursor.style.top = dts.pageY + 'px';
```
Look closely: **`cursor` is never declared or selected anywhere in this file!**  
When the user moves their mouse over `.elem`, the browser throws:
```
Uncaught ReferenceError: cursor is not defined at HTMLDivElement.<anonymous> (script.js:18)
```
The image fails to follow vertically because the script crashes immediately on line 18!

#### 2. The Relative Positioning Problem (Lines 14–17)
In the commented-out code:
```javascript
// var bounds = val.getBoundingClientRect();
// img.style.left = (dets.clientX - bounds.left) + 'px';
```
Notice the developer wrote `dets.clientX` but the parameter was named `dts` on line 13.
Furthermore, using `pageX` on line 17 places the image at the document's absolute coordinates. But `.elem` has `position: relative` in CSS! This causes the image to fly far outside the element.

#### 3. Memory Inefficiency: Attaching $3 \times N$ Listeners
Attaching 3 listeners (`mouseenter`, `mouseleave`, `mousemove`) on every list item consumes unnecessary memory. In production lists with dozens or hundreds of items, this can degrade performance.

---

## 🧠 Deep-Dive: Core JavaScript Concepts

### 1. Event Propagation: Capturing, Target, and Bubbling

When you interact with an element in the browser, the event travels through 3 phases:

```
                  DOCUMENT
                     │  ▲
    1. CAPTURE PHASE │  │ 3. BUBBLE PHASE
   (window down to   │  │ (target up to window)
        target)      ▼  │
                  <div id="main">
                     │  ▲
                     ▼  │
                  <div class="elem">
                     │  ▲
                     ▼  │
                  <h1>Virat Kohli</h1>  <-- 2. TARGET PHASE
```

1. **Capturing Phase**: The event descends from `window` down to the target.
2. **Target Phase**: The event reaches the actual element clicked/hovered (`e.target`).
3. **Bubbling Phase**: The event bubbles up from the target back to `window`.

> **Note**: `mouseenter` and `mouseleave` **do not bubble**. `mouseover` and `mouseout` **do bubble**. This distinction is critical for Event Delegation!

---

### 2. Event Delegation: $O(1)$ vs $O(N)$ Listeners

Instead of looping through all items:
```javascript
// ❌ O(N) Listeners: 300 items = 900 event listeners!
document.querySelectorAll('.elem').forEach(item => {
  item.addEventListener('mouseover', ...);
});
```

We attach **a single listener** on the parent container (`#main`):
```javascript
// ✅ O(1) Listener: 1 listener handles unlimited items!
const container = document.querySelector('#main');

container.addEventListener('mouseover', (e) => {
  const item = e.target.closest('.elem');
  if (!item) return;
  // Activate preview
});
```

#### Why `e.target.closest('.elem')` is essential:
If the user hovers over the `<h1>` inside `.elem`, `e.target` is the `<h1>`, NOT the `.elem`. `closest('.elem')` traverses up the DOM tree to locate the enclosing `.elem` container reliably!

---

### 3. Element Geometry: `getBoundingClientRect()` Explained

`element.getBoundingClientRect()` returns a `DOMRect` object containing the size of an element and its position relative to the visible viewport:

```
        clientX = 140px
           │
           ▼
┌──────────┼──────────────────────┐ ◄─── rect.top (e.g. 100px)
│ .elem    │                      │
│          ▼                      │
│      (Cursor)                   │
│                                 │
└─────────────────────────────────┘ ◄─── rect.bottom
▲
│
rect.left (e.g. 50px)

Relative X = clientX - rect.left = 140 - 50 = 90px inside .elem
```

---

### 4. `NodeList` vs `HTMLCollection` vs `Array`

| Type | Returned By | Is Live? | Has `.forEach`? | Array Methods (`map`, `filter`)? |
| :--- | :--- | :--- | :--- | :--- |
| `NodeList` | `querySelectorAll()` | ❌ Static (won't update if DOM changes) | ✅ Yes | ❌ Must convert with `[...nodes]` |
| `HTMLCollection` | `getElementsByClassName()` | ✅ Live (auto-updates with DOM changes) | ❌ No | ❌ Must convert |
| `Array` | `Array.from()` or `[...]` | ❌ Static | ✅ Yes | ✅ All (`map`, `filter`, `reduce`) |

---

### 5. GPU Positioning vs Layout Trashing

Setting `img.style.left` and `img.style.top` triggers Layout/Reflow.  
By using `transform: translate3d(relX, relY, 0)`, the image is rendered on the GPU with no reflow penalty!

---

## 💼 Machine Coding Round Playbook

### Interview Prompt
> *"Build an interactive Hover-Image-Follower list. When hovering over any row, that item's image preview should fade in and track the mouse position within that row. The solution must use Event Delegation for optimal memory efficiency and avoid layout thrashing."*

### Evaluation Checklist
- [x] **Zero Bugs / Undefined Variables**: No dangling `cursor` or unhandled exceptions.
- [x] **Event Delegation**: Single listener on the parent container using `e.target.closest()`.
- [x] **Accurate Geometry**: Uses `getBoundingClientRect()` to compute relative positions.
- [x] **Hardware Accelerated Motion**: Uses `transform: translate3d(...)` instead of `left/top`.
- [x] **Image Centering**: Centers the image on the cursor for an elegant feel.

---

## 🚀 Senior Engineer Refactored Code (Production Grade)

### Refactored CSS (`style.css`)
```css
#main {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.elem {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  overflow: visible;
}

.elem h1 {
  font-size: 2.5rem;
  font-weight: 700;
  transition: transform 0.3s ease, opacity 0.3s ease;
  pointer-events: none; /* Events pass through to .elem */
}

/* Floating Preview Image */
.elem img {
  position: absolute;
  top: 0;
  left: 0;
  width: 180px;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  opacity: 0;
  pointer-events: none;
  z-index: 10;
  will-change: transform, opacity;
  transition: opacity 0.3s ease, transform 0.1s ease-out;
}

.elem.is-active img {
  opacity: 1;
}

.elem.is-active h1 {
  opacity: 0.5;
  transform: translateX(12px);
}
```

### Refactored JavaScript (`script.js`)
```javascript
/**
 * Senior-Grade Event-Delegated Image Hover Follower
 * Features: Single container listener (O(1) memory), getBoundingClientRect positioning, GPU acceleration.
 */
(function initImageHover() {
  'use strict';

  const container = document.getElementById('main');
  if (!container) return;

  let activeItem = null;
  let activeImg = null;

  // 1. Mouse Over - Detect Entering a Row (Event Delegation)
  container.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.elem');
    if (!item || item === activeItem) return;

    activeItem = item;
    activeImg = item.querySelector('img');
    item.classList.add('is-active');
  });

  // 2. Mouse Move - Track Cursor within Active Row
  container.addEventListener('mousemove', (e) => {
    if (!activeItem || !activeImg) return;

    const bounds = activeItem.getBoundingClientRect();
    
    // Calculate cursor position relative to the .elem container
    const relativeX = e.clientX - bounds.left;
    const relativeY = e.clientY - bounds.top;

    // Center image on cursor (image width: 180px -> offset 90, height: 220px -> offset 110)
    const offsetX = relativeX - 90;
    const offsetY = relativeY - 110;

    activeImg.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  });

  // 3. Mouse Out - Detect Leaving a Row
  container.addEventListener('mouseout', (e) => {
    const relatedTarget = e.relatedTarget;
    
    // If mouse left activeItem and didn't move to another child within it
    if (activeItem && (!relatedTarget || !activeItem.contains(relatedTarget))) {
      activeItem.classList.remove('is-active');
      activeItem = null;
      activeImg = null;
    }
  });
})();
```

---

## ❓ High-Yield Frontend Interview Questions & Answers

### Q1: Why did the original code fail with `ReferenceError: cursor is not defined`?
**Answer:**
JavaScript throws a `ReferenceError` when an identifier is used without being declared with `var`, `let`, `const`, or as a function parameter. In the original code, the developer copied line 18 from Project 09 (`cursor.style.top = ...`) without defining `cursor` in Project 10.

### Q2: What is the difference between `mouseover/mouseout` and `mouseenter/mouseleave`?
**Answer:**
- `mouseenter` / `mouseleave`: Do **not** bubble. They fire only when entering/leaving the bound element itself, ignoring children.
- `mouseover` / `mouseout`: **Bubble** up the DOM tree. Because they bubble, they are compatible with **Event Delegation** on a parent container!

---

## 🏆 Level-Up Challenges
- **Bronze**: Fix the original script so the image tracks smoothly using `getBoundingClientRect`.
- **Silver**: Add a tilt/rotation effect (`rotate(${deltaX * 0.05}deg)`) so the image tilts dynamically in the direction the mouse is moving!
- **Gold**: Dynamically preload all images on page load to prevent image flash latency on initial hover.
