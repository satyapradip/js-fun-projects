# ⭐ Project 13: Interactive Star Rating Component & Event Delegation

> **Master JavaScript From First Principles to Machine Coding Excellence**  
> *Category:* UI Component Systems, Event Delegation, DOM Traversals, Keyboard Accessibility (WCAG 2.1)  
> *Interview Level:* SDE-1 / SDE-2 Frontend Machine Coding Classic (Uber, Swiggy, Amazon, Flipkart)  
> *Time to Implement in Interview:* 25–35 minutes  

---

## 📌 Table of Contents
1. [Project Overview & Mental Model](#-project-overview--mental-model)
2. [Visual Architecture Flow](#-visual-architecture-flow)
3. [Core JavaScript & Browser Mechanics](#-core-javascript--browser-mechanics)
   - [1. Event Delegation vs $N$ Individual Listeners](#1-event-delegation-vs-n-individual-listeners)
   - [2. `e.target` vs `e.currentTarget` vs `element.closest()`](#2-etarget-vs-ecurrenttarget-vs-elementclosest)
   - [3. Transient Hover State vs Persistent Selection State](#3-transient-hover-state-vs-persistent-selection-state)
   - [4. Keyboard Accessibility & WCAG Standards (`radiogroup`)](#4-keyboard-accessibility--wcag-standards-radiogroup)
4. [Machine Coding Round Playbook (30-Minute Roadmap)](#-machine-coding-round-playbook)
5. [Production-Grade Implementation Analysis](#-production-grade-implementation-analysis)
6. [Senior Engineer Pattern: Reusable Class-Based Component](#-senior-engineer-pattern-reusable-class-based-component)
7. [High-Yield Frontend Interview Questions & Answers](#-high-yield-frontend-interview-questions--answers)
8. [Level-Up Challenges](#-level-up-challenges)

---

## 📖 Project Overview & Mental Model

The **Star Rating Component** is one of the most frequently asked frontend machine coding interview questions because it tests fundamentals that candidates often get wrong:
- Do they bind 5 separate click/hover event listeners, or use **Event Delegation** on the container?
- Do they handle SVG child elements intercepting clicks (`pointer-events: none` vs `closest()`)?
- Do they store state in the DOM (checking CSS classes or innerText) or maintain a clean JavaScript state object?
- Can a blind or motor-impaired user use the component with keyboard arrow keys and screen readers?

---

## 🔄 Visual Architecture Flow

```
                      [ User Interaction ]
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
        [ Mouse Event ]                    [ Keyboard Event ]
      (mouseover / click)               (ArrowRight / Home / 1-5)
              │                                   │
              └─────────────────┬─────────────────┘
                                ▼
                     Event Delegation Container
                  e.target.closest('.star-btn')
                                │
                                ▼
                    Determine State Transition
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
   [ Hover Preview ]                           [ Commit Rating ]
 state.hoveredRating = val                   state.rating = val
         │                                             │
         └──────────────────────┬──────────────────────┘
                                ▼
                       Pure `render(state)`
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        Update Classes    Update Sentiment   Update ARIA
       (.is-filled/hover) (Text & Progress)  (aria-checked)
```

---

## 🧠 Core JavaScript & Browser Mechanics

### 1. Event Delegation vs $N$ Individual Listeners

#### ❌ The Junior Mistake:
```javascript
// Attaching 5+ individual listeners:
document.querySelectorAll('.star-btn').forEach(btn => {
  btn.addEventListener('click', handleStarClick);
  btn.addEventListener('mouseenter', handleHover);
  btn.addEventListener('mouseleave', handleLeave);
});
```
*Problems:*
- Allocates $3 \times N$ listener function references in memory.
- If stars are re-rendered dynamically, old listeners must be manually detached to avoid memory leaks.

#### ✅ The Senior Solution (Event Delegation):
```javascript
// Only 1 listener on the parent container:
starsContainer.addEventListener('mouseover', (e) => {
  const btn = e.target.closest('.star-btn');
  if (!btn) return;
  setHover(Number(btn.dataset.value));
});
```
- **$O(1)$ memory footprint**: Only one listener exists on the parent element.
- Seamlessly supports dynamic star counts (e.g. 5 stars, 10 stars, half-stars).

---

### 2. `e.target` vs `e.currentTarget` vs `element.closest()`

When clicking on a star button containing an `<svg>` and `<path>`:
- `e.target`: The deepest element clicked (often the `<path>` or `<svg>`).
- `e.currentTarget`: The element the listener is attached to (`starsContainer`).
- `e.target.closest('.star-btn')`: Climbs the DOM tree until it finds the matching ancestor button.

```
<button class="star-btn" data-value="3">  <── closest('.star-btn') returns this!
  <svg>
    <path d="..."/>                       <── e.target could be this!
  </svg>
</button>
```

In CSS, adding `pointer-events: none` to `.star-icon` ensures the SVG never intercepts the click, so `e.target` is always the button!

---

### 3. Transient Hover State vs Persistent Selection State

A common candidate blunder is overwriting the selected rating on hover.
The correct architecture maintains **two separate state variables**:

```javascript
const state = {
  rating: 0,        // Permanent committed rating
  hoveredRating: 0  // Temporary preview during mouse hover
};

// Effective display value:
const activeValue = state.hoveredRating || state.rating;
```
When the user moves the mouse away (`mouseleave`), `hoveredRating` resets to `0`, and the UI smoothly reverts to `state.rating`.

---

### 4. Keyboard Accessibility & WCAG Standards (`radiogroup`)

For accessibility compliance:
- Container role: `role="radiogroup"`
- Individual star button role: `role="radio"` with `aria-checked="true|false"`
- Live screen reader announcer: `<div aria-live="polite">`
- Key event handlers:
  - `ArrowRight` / `ArrowUp`: Increment rating (+1)
  - `ArrowLeft` / `ArrowDown`: Decrement rating (-1)
  - `Home`: Min rating (1)
  - `End`: Max rating (5)
  - `1` - `5`: Numeric instant jump

---

## ⏱️ Machine Coding Round Playbook

| Minute | Goal | Key Interview Actions |
| :-: | :--- | :--- |
| **00 - 05** | Requirements Clarification | Clarify star count (5 vs 10), half-stars support, reset behavior, and accessibility. |
| **05 - 10** | HTML & Semantic Scaffold | Setup container with `role="radiogroup"`, SVG star icons, and sentiment indicator. |
| **10 - 20** | JS Architecture & Delegation | Implement `state`, `render()`, and event delegation for `mouseover`, `mouseleave`, and `click`. |
| **20 - 25** | Keyboard Accessibility | Add `keydown` handler for arrow keys and numeric shortcuts. |
| **25 - 30** | Polish & Edge Cases | Test hover leaving the container, re-clicking to toggle reset, and screen reader announcements. |

---

## 🚀 Senior Engineer Pattern: Reusable Class-Based Component

In senior frontend interviews (L5+), interviewers often ask: *"How would you package this as an extensible component for a design system?"*

```javascript
class StarRating {
  constructor(container, options = {}) {
    this.container = container;
    this.maxStars = options.maxStars || 5;
    this.rating = options.initialRating || 0;
    this.hoverRating = 0;
    this.onChange = options.onChange || (() => {});
    
    this.init();
  }

  init() {
    this.buildDOM();
    this.bindEvents();
    this.render();
  }

  buildDOM() {
    this.container.setAttribute('role', 'radiogroup');
    this.container.tabIndex = 0;
    this.container.innerHTML = Array.from({ length: this.maxStars }, (_, i) => `
      <button type="button" class="star-btn" data-value="${i + 1}" role="radio" aria-checked="false">
        ★
      </button>
    `).join('');
    this.stars = Array.from(this.container.querySelectorAll('.star-btn'));
  }

  bindEvents() {
    this.container.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.star-btn');
      if (btn) {
        this.hoverRating = Number(btn.dataset.value);
        this.render();
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this.hoverRating = 0;
      this.render();
    });

    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('.star-btn');
      if (btn) {
        const val = Number(btn.dataset.value);
        this.rating = (this.rating === val) ? 0 : val;
        this.hoverRating = 0;
        this.render();
        this.onChange(this.rating);
      }
    });
  }

  render() {
    const active = this.hoverRating || this.rating;
    this.stars.forEach(btn => {
      const val = Number(btn.dataset.value);
      btn.classList.toggle('active', val <= active);
      btn.setAttribute('aria-checked', val === this.rating ? 'true' : 'false');
    });
  }
}

// Usage:
// const rating = new StarRating(document.querySelector('#myStars'), {
//   maxStars: 5,
//   onChange: (val) => console.log('User rated:', val)
// });
```

---

## ❓ High-Yield Frontend Interview Questions & Answers

### Q1: Why is `closest()` preferred over `e.target` directly in event delegation?
**Answer:** Because `e.target` points to the deepest nested DOM node that was clicked (e.g. `<path>` inside `<svg>` inside `<button>`). If you only check `e.target.dataset.value`, it will return `undefined` on the `<path>`. `element.closest('.star-btn')` ascends the DOM tree to locate the target button reliably.

### Q2: What is the performance difference between CSS class toggling and modifying `element.style.fill` directly?
**Answer:** Modifying inline styles (`element.style.fill = 'gold'`) forces browser style recalculations individually per element and violates the separation of concerns. Toggling a CSS class (`btn.classList.toggle('is-filled', true)`) batches style computations and allows CSS transitions/animations to be handled by the browser engine efficiently.

### Q3: How would you implement Half-Star precision rating?
**Answer:** In the `mousemove` event, calculate the mouse offset relative to the star button:
```javascript
const rect = starBtn.getBoundingClientRect();
const isHalf = (e.clientX - rect.left) < (rect.width / 2);
const rating = isHalf ? val - 0.5 : val;
```
Then use SVG clip paths or a two-layer half-star icon in CSS.

---

## 🏆 Level-Up Challenges
1. **Half-Star Support:** Extend the component to support `0.5`, `1.5`, `2.5`, etc., using `e.clientX` and `getBoundingClientRect()`.
2. **Dynamic Max Stars:** Make the star count configurable via a range slider (e.g., 3 to 10 stars).
3. **Local Storage Sync:** Persist the user's review so it reloads on page refresh.
