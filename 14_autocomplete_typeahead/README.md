# 🔍 Project 14: Debounced Autocomplete / Typeahead Search Engine

> **Master JavaScript From First Principles to Machine Coding Excellence**  
> *Category:* Asynchronous JavaScript, Debouncing & Closures, Race Condition Mitigation (`AbortController`), Client-Side Caching, Keyboard Navigation  
> *Interview Level:* SDE-2 / SDE-3 Frontend Machine Coding Classic (Google, Meta, Razorpay, Flipkart, Uber, Atlassian)  
> *Time to Implement in Interview:* 35–45 minutes  

---

## 📌 Table of Contents
1. [Project Overview & Mental Model](#-project-overview--mental-model)
2. [Visual Architecture Flow](#-visual-architecture-flow)
3. [Deep-Dive: Core JavaScript & Browser Mechanics](#-deep-dive-core-javascript--browser-mechanics)
   - [1. Debounce from First Principles (Closures & Timers)](#1-debounce-from-first-principles-closures--timers)
   - [2. The Silent Killer: Asynchronous Race Conditions](#2-the-silent-killer-asynchronous-race-conditions)
   - [3. Eliminating Race Conditions with `AbortController`](#3-eliminating-race-conditions-with-abortcontroller)
   - [4. High-Performance Client Caching (`Map` vs Object)](#4-high-performance-client-caching-map-vs-object)
   - [5. Safe Substring Highlighting Without XSS](#5-safe-substring-highlighting-without-xss)
4. [Machine Coding Round Playbook (45-Minute Roadmap)](#-machine-coding-round-playbook)
5. [Senior Engineer Refactor: Production-Grade Search Service](#-senior-engineer-refactor-production-grade-search-service)
6. [High-Yield Frontend Interview Questions & Answers](#-high-yield-frontend-interview-questions--answers)
7. [Level-Up Challenges](#-level-up-challenges)

---

## 📖 Project Overview & Mental Model

The **Typeahead Autocomplete Search** is universally regarded as the premier benchmark in frontend machine coding interviews. It evaluates whether an engineer understands:
- How the **Browser Event Loop** schedules timers vs network I/O.
- How to throttle high-frequency DOM events (`input`) to prevent API server flooding.
- How to handle asynchronous ordering bugs where earlier requests resolve *after* subsequent ones.
- How to navigate items seamlessly using only a keyboard (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`).

---

## 🔄 Visual Architecture Flow

```
User types "rea" ──► [ input event ]
                           │
                           ▼
                   debounce(300ms)
       (Cancels timer if user types next key within 300ms)
                           │
                           ▼
                  Check In-Memory Cache
               ├── Hit? ──► Return Cached Results (0ms!)
               │
               └── Miss:
                     │
                     ▼
           Cancel In-Flight Request
         activeAbortController.abort()
                     │
                     ▼
            Dispatch Fresh Fetch
        fetch(url, { signal: newSignal })
                     │
                     ▼
            Receive & Cache Data
             cache.set(query, data)
                     │
                     ▼
           Highlight & Render UI
        (Accessible listbox & focus)
```

---

## 🧠 Deep-Dive: Core JavaScript & Browser Mechanics

### 1. Debounce from First Principles (Closures & Timers)

#### What is Debounce?
Debounce ensures that a function is executed only after a specified period of inactivity.

```javascript
function debounce(fn, delayMs = 300) {
  let timerId = null; // Captured in the closure scope

  return function (...args) {
    if (timerId) clearTimeout(timerId); // Reset timer on each invocation

    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delayMs);
  };
}
```

#### Why Not Throttle?
- **Throttle:** Guarantees execution at regular intervals (e.g. once every 300ms). Used for scroll or resize listeners.
- **Debounce:** Waits until the user *stops* typing. Autocomplete requires debounce so we do not query the server while the user is mid-word!

---

### 2. The Silent Killer: Asynchronous Race Conditions

Suppose a user types `"react"`.
1. User stops at `"re"` ➔ Request 1 fired to server (takes 600ms due to network latency).
2. User types `"react"` ➔ Request 2 fired to server (takes 150ms).
3. Request 2 finishes at $T = 150\text{ms}$ ➔ Screen renders results for `"react"`.
4. Request 1 finishes late at $T = 600\text{ms}$ ➔ Overwrites the screen with old results for `"re"`!

This critical bug fails candidates immediately in SDE-2+ interviews.

---

### 3. Eliminating Race Conditions with `AbortController`

Modern browsers provide the standard `AbortController` API to terminate HTTP requests directly at the network layer:

```javascript
let activeController = null;

async function search(query) {
  // 1. Abort any previous pending request
  if (activeController) {
    activeController.abort();
  }

  // 2. Instantiate a fresh controller for the latest request
  activeController = new AbortController();

  try {
    const res = await fetch(`/api/search?q=${query}`, {
      signal: activeController.signal
    });
    const data = await res.json();
    render(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      // Expected! Do nothing when superseded by newer user input.
      return;
    }
    console.error(err);
  }
}
```

---

### 4. High-Performance Client Caching (`Map` vs Object)

JavaScript's `Map` is superior to plain `{}` objects for caching:
1. `Map` preserves insertion order, making it trivial to implement an **LRU (Least Recently Used) cache**.
2. Keys can be any type, and `Map` does not have prototype collision risks (e.g., `hasOwnProperty`, `constructor`).
3. Direct `.has()` and `.get()` operations execute in $O(1)$ amortized time.

```javascript
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    // Refresh position to mark as recently used:
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete the oldest entry (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}
```

---

### 5. Safe Substring Highlighting Without XSS

Highlighting matched letters (e.g., **Java**Script) using naive `element.innerHTML` opens cross-site scripting vulnerabilities if the server returns user-generated content.
Always escape HTML entities before applying regex highlighting:

```javascript
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function highlightMatch(fullText, query) {
  const safeText = escapeHTML(fullText);
  const safeQuery = escapeHTML(query);
  const regex = new RegExp(`(${safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return safeText.replace(regex, '<mark class="highlight-match">$1</mark>');
}
```

---

## ⏱️ Machine Coding Round Playbook

| Minute | Phase | Action Item |
| :-: | :--- | :--- |
| **00 - 05** | Requirements & Edge Cases | Clarify: Debounce delay (300ms), Cache strategy, Keyboard support, Minimum characters to trigger search. |
| **05 - 12** | HTML Scaffold & CSS | Build `<input>`, dropdown `<ul>`, loading spinner, and dark theme. |
| **12 - 22** | Core JS & Debounce | Write `debounce()` from scratch; implement `performSearch()` with async/await. |
| **22 - 32** | Race Conditions & Caching | Integrate `AbortController` and in-memory `Map` caching. |
| **32 - 40** | Keyboard Navigation | Handle `ArrowUp`, `ArrowDown`, `Enter`, `Escape`, and `scrollIntoView()`. |
| **40 - 45** | Polish & Metrics | Add recent searches chip list and XSS string sanitizer. |

---

## ❓ High-Yield Frontend Interview Questions & Answers

### Q1: What is the difference between microtasks and macrotasks in the context of `setTimeout` used in debounce?
**Answer:** `setTimeout` delegates its timer to the browser's host environment and places its callback into the **Macrotask Queue** once the timer expires. Microtasks (`Promise.then`, `queueMicrotask`, `MutationObserver`) run with higher priority immediately after the call stack clears and before the next macrotask is dequeued. Because debounce uses `setTimeout`, it yields execution to the main thread, allowing the UI to remain smooth and responsive.

### Q2: Why is `new RegExp(query, 'gi')` dangerous if the query contains special regex characters?
**Answer:** If the user types characters like `(`, `[`, `*`, `+`, or `?`, constructing `new RegExp(query)` will throw an unhandled `SyntaxError: Invalid regular expression`. We must escape all regex control characters using `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` prior to instantiating the regular expression.

### Q3: How do you handle keyboard selection when the dropdown has a long list with a scrollbar?
**Answer:** Call `element.scrollIntoView({ block: 'nearest' })` on the newly highlighted item. This ensures the element automatically scrolls into view without jarring jumps.

---

## 🏆 Level-Up Challenges
1. **Fuzzy Search:** Integrate a Levenshtein distance algorithm for typo-tolerant suggestions (e.g. searching "typecrip" still finds "TypeScript").
2. **Infinite Scroll within Dropdown:** Paginate results inside the dropdown when the list contains over 100 entries.
3. **Local Storage LRU Cache:** Persist the client-side cache across browser sessions with expiration timestamps (TTL).
