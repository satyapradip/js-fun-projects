# 🚀 The Ultimate JavaScript Machine Coding & Frontend Interview Masterclass

> **Master Vanilla JavaScript from First Principles to High-Performance Architecture.**  
> Built for beginners, aspiring SDEs, and engineers preparing to crack **Frontend Machine Coding Rounds** at top tech firms (Google, Meta, Uber, Amazon, Razorpay, Swiggy, Flipkart).

---

## 🧭 Repository Overview & Curriculum Matrix

This repository contains 6 hands-on interactive projects designed to teach modern JavaScript mechanics, browser internals, and battle-tested machine coding architectures.

Every single project contains a dedicated, production-grade **`README.md`** with line-by-line breakdowns, browser runtime mechanics, interview pitfalls, and senior-level refactors.

| # | Project Directory | Core JavaScript Concepts | Browser Runtime & Performance | Machine Coding Round Weightage | Deep-Dive Guide |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **07** | [07_Add_friend_project](file:///e:/js-fun-projects/07_Add_friend_project) | State toggles, Scopes (`var`/`let`/`const`), Temporal Dead Zone, DOM Queries | Separation of concerns, Class toggles vs inline styles | 🟢 **SDE-1 Warmup** (15–20 mins) | [Read Guide](file:///e:/js-fun-projects/07_Add_friend_project/README.md) |
| **08** | [08_insta_like_project](file:///e:/js-fun-projects/08_insta_like_project) | Event Loop, Macrotask Queue, `setTimeout` drift, Timer race conditions | GPU Compositor layers, CSS `transform`/`opacity` vs Reflow | 🟡 **SDE-1 / SDE-2** (20–25 mins) | [Read Guide](file:///e:/js-fun-projects/08_insta_like_project/README.md) |
| **09** | [09_custom_cursor_project](file:///e:/js-fun-projects/09_custom_cursor_project) | `mousemove`, Coordinate systems (`client` vs `page` vs `screen` vs `offset`) | 60/120 FPS render loops, `requestAnimationFrame`, Lerping physics, Layout Thrashing | 🟡 **SDE-1 / SDE-2** (25–30 mins) | [Read Guide](file:///e:/js-fun-projects/09_custom_cursor_project/README.md) |
| **10** | [10_image_howver_project](file:///e:/js-fun-projects/10_image_howver_project) | Event Bubbling, Event Capturing, Event Delegation ($O(1)$ memory), Runtime Debugging | `getBoundingClientRect()`, relative container geometry, GPU translations | 🟠 **SDE-2 Core** (25–35 mins) | [Read Guide](file:///e:/js-fun-projects/10_image_howver_project/README.md) |
| **11** | [11_insta_story_project](file:///e:/js-fun-projects/11_insta_story_project) | Data-driven UI, Array methods (`map`, `forEach`), HTML5 `dataset`, XSS prevention | Timers, Hold-to-pause gestures, State Machine architecture | 🔴 **SDE-2 Classic** (35–45 mins) | [Read Guide](file:///e:/js-fun-projects/11_insta_story_project/README.md) |
| **12** | [12_number_guesser_game](file:///e:/js-fun-projects/12_number_guesser_game) | Game loops, Strict validation, Type coercion, IEEE 754 `NaN`, `Math.random` | Form submit lifecycle (`preventDefault`), Preventing listener memory leaks | 🟠 **SDE-1 / SDE-2** (30–40 mins) | [Read Guide](file:///e:/js-fun-projects/12_number_guesser_game/README.md) |

---

## 🏆 The 45-Minute Machine Coding Interview Blueprint

In machine coding rounds (typically 45 to 60 minutes), interviewers evaluate **how you think, structure, and execute**. Use this 5-step framework:

```
[00:00 - 05:00]  Step 1: Clarify Requirements & Edge Cases
       │
       ▼
[05:00 - 12:00]  Step 2: Architecture & State Schema (Single Source of Truth)
       │
       ▼
[12:00 - 25:00]  Step 3: HTML Scaffold & Baseline CSS Layout
       │
       ▼
[25:00 - 40:00]  Step 4: JavaScript Implementation & Event Delegation
       │
       ▼
[40:00 - 45:00]  Step 5: Edge Cases, Accessibility (ARIA), Memory Cleanup
```

### Detailed Execution:
1. **Clarify Requirements (5 mins)**:
   - Ask clarifying questions: *"Should this work on mobile touch devices?", "What are the input boundaries?", "Should state persist on refresh?"*
2. **State Modeling (7 mins)**:
   - **Never store state in the DOM** (e.g. don't read `button.innerText === "Follow"`).
   - Design a pure JavaScript state object:
     ```javascript
     const state = { count: 0, isActive: false, items: [] };
     ```
3. **Semantic HTML Scaffold (10 mins)**:
   - Use semantic elements (`<main>`, `<article>`, `<button>`, `<form>`) rather than nested generic `<div>`s.
   - Add accessible labels (`aria-label`, `aria-live`).
4. **Clean JS Logic (15 mins)**:
   - Use `const` and `let`. No `var`.
   - Use **Event Delegation** on the container instead of looping with $N$ listeners.
   - Decouple your code into: `State` -> `render(state)` -> `Event Handlers`.
5. **Edge Cases & Polish (5 mins)**:
   - Clear dangling timers (`clearTimeout`, `clearInterval`).
   - Remove duplicate event listeners.
   - Guard against invalid user input (`Number.isNaN`, empty strings).

---

## 🧠 Core JavaScript Interview Cheatsheet

### 1. The Browser Event Loop
```
   ┌──────────────────────────────────────────────────┐
   │                    CALL STACK                    │
   │  Executes synchronous JavaScript line by line     │
   └────────────────────────┬─────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   ┌──────────────────────┐    ┌──────────────────────┐
   │   MICROTASK QUEUE    │    │    MACROTASK QUEUE   │
   │  - Promises (.then)  │    │  - setTimeout        │
   │  - MutationObserver  │    │  - setInterval       │
   │  - queueMicrotask    │    │  - DOM Events / I/O  │
   └──────────┬───────────┘    └──────────┬───────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
              ┌───────────────────────────┐
              │        EVENT LOOP         │
              │ 1. Empty Call Stack       │
              │ 2. Flush ALL Microtasks   │
              │ 3. Pick 1 Macrotask       │
              │ 4. Render Frame (rAF)     │
              └───────────────────────────┘
```

### 2. Event Propagation (Capture, Target, Bubble)
```
          WINDOW
            │   ▲
   CAPTION  │   │  BUBBLING
   PHASE    ▼   │  PHASE
          PARENT
            │   ▲
            ▼   │
          CHILD (TARGET PHASE)
```
- **Capture**: Descends from `window` down to target (activated via `{ capture: true }`).
- **Target**: Reaches `e.target`.
- **Bubble**: Climbs up from target back to `window`. Stop with `e.stopPropagation()`.

### 3. Coordinate Systems Reference
- **`clientX / clientY`**: Relative to the current visible viewport window (unaffected by page scroll).
- **`pageX / pageY`**: Relative to the top-left of the entire scrollable document.
- **`screenX / screenY`**: Relative to the physical computer monitor screen.
- **`offsetX / offsetY`**: Relative to the padding edge of the target element.

### 4. DOM Rendering Pipeline & Layout Thrashing
- **Layout (Reflow)**: Triggered by `top`, `left`, `width`, `height`, `margin`, `padding`. (Heavy CPU load)
- **Paint (Repaint)**: Triggered by `color`, `background-color`, `box-shadow`.
- **Composite**: Triggered by `transform: translate3d(...)` and `opacity`. **Zero reflows, handled directly on the GPU!**

---

## 🛠️ How to Run & Practice Locally

### Option 1: VS Code Live Server
1. Open this repository folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click any project's `index.html` (e.g. `07_Add_friend_project/index.html`) and select **"Open with Live Server"**.

### Option 2: Node.js `npx serve`
```bash
# Run any lightweight local static server from the repository root:
npx serve .
```

---

## 🎯 Interview Evaluation Rubric

When engineering managers grade your machine coding interview, you are evaluated across 5 key pillars:

| Pillar | Expectations for Strong Hire (L4 / L5) |
| :--- | :--- |
| **1. Code Organization** | Modular functions, single responsibility principle, clean naming conventions (`isLiked`, `handleClick`, `renderUI`). |
| **2. State Management** | Clear single source of truth; zero "DOM-as-state" anti-patterns. |
| **3. Performance & Memory** | Event delegation used where appropriate; timers cleared; zero layout thrashing; uses `transform` and `requestAnimationFrame`. |
| **4. Edge Cases & Robustness** | Handles rapid clicks, null elements, empty inputs, non-integer inputs, device boundary detection. |
| **5. Accessibility (a11y)** | Semantic HTML tags, keyboard navigability (`Enter` / `Space`), `aria-label`, and `aria-live` for dynamic changes. |

---

*Made with passion for engineering excellence. Dive into each project's folder to begin your journey to mastering JavaScript!*
