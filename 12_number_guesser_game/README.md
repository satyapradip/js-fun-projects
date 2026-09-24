# 🎲 Project 12: Number Guesser Game & Game Loop Architecture

> **Master JavaScript From First Principles to Machine Coding Excellence**  
> *Category:* Game State Machine, Form Handling, DOM Mutation, Memory Leak Prevention, Pseudo-Randomness  
> *Interview Level:* SDE-1 / SDE-2 Frontend Machine Coding Classic  
> *Time to Implement in Interview:* 30–40 minutes  

---

## 📌 Table of Contents
1. [Project Overview & Mental Model](#-project-overview--mental-model)
2. [Visual Architecture Flow](#-visual-architecture-flow)
3. [Original Code Breakdown & Bug Analysis](#-original-code-breakdown--bug-analysis)
   - [The Memory Leak Bug: Accumulating Duplicate Listeners](#the-memory-leak-bug-accumulating-duplicate-listeners)
   - [The `parseInt` vs `Math.floor` Math Precision Pitfall](#the-parseint-vs-mathfloor-math-precision-pitfall)
4. [Deep-Dive: Core JavaScript Concepts](#-deep-dive-core-javascript-concepts)
   - [1. `Math.random()` & Generating Safe Integer Ranges](#1-mathrandom--generating-safe-integer-ranges)
   - [2. Forms, `submit` vs `click`, and `e.preventDefault()`](#2-forms-submit-vs-click-and-epreventdefault)
   - [3. Type Coercion: `parseInt` vs `Number` vs Unary `+`](#3-type-coercion-parseint-vs-number-vs-unary-)
   - [4. The `NaN` Gotcha: Why `NaN === NaN` is `false`](#4-the-nan-gotcha-why-nan--nan-is-false)
   - [5. Clean MVC (Model-View-Controller) in Vanilla JavaScript](#5-clean-mvc-model-view-controller-in-vanilla-javascript)
5. [Machine Coding Round Playbook](#-machine-coding-round-playbook)
   - [Interview Prompt](#interview-prompt)
   - [Evaluation Checklist](#evaluation-checklist)
   - [Common Mistakes Candidates Make](#common-mistakes-candidates-make)
6. [Senior Engineer Refactored Code (Production Grade)](#-senior-engineer-refactored-code-production-grade)
7. [High-Yield Frontend Interview Questions & Answers](#-high-yield-frontend-interview-questions--answers)
8. [Level-Up Challenges](#-level-up-challenges)

---

## 📖 Project Overview & Mental Model

The Number Guesser is an iconic machine coding problem. It evaluates a candidate's ability to:
- Generate and manage secret state (`randomNumber`).
- Capture and validate user input under strict constraints ($1 \le \text{guess} \le 100$).
- Maintain turn-based game progression (10 attempts).
- Mutate the DOM cleanly across multiple game sessions without memory leaks or state pollution.

---

## 🔄 Visual Architecture Flow

```
                      [ Initial Game State ]
             secret = random(1..100), attempts = 10, history = []
                                │
                                ▼
                       User Submits Guess
                                │
                                ▼
                      Validate Input?
                     ├── Invalid (NaN, <1, >100) ➔ Show Inline Error
                     │
                     └── Valid Input:
                           │
                           ▼
                  Record Guess & Decrement
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
       Guess == Secret?           Attempts == 0?
       ├── YES ➔ [WON STATE]      ├── YES ➔ [LOST STATE]
       │                          │
       └── NO:                    └── NO:
           Show "High" or "Low"       Ready for Next Guess
```

---

## 🔍 Original Code Breakdown & Bug Analysis

Here is the original code from [script.js](file:///e:/js-fun-projects/12_number_guesser_game/script.js):

```javascript
1: let randomNumber = parseInt(Math.random() * 100 + 1);
2: const submit = document.querySelector('#subt');
3: const userInput = document.querySelector('#guessField');
...
73: function endGame() {
74:   userInput.value = '';
75:   userInput.setAttribute('disabled', '');
76:   p.classList.add('button');
77:   p.innerHTML = `<h2 id="newGame">Start new Game</h2>`;
78:   startOver.appendChild(p);
79:   playGame = false;
80:   newGame();
81: }
82: 
83: function newGame() {
84:   const newGameButton = document.querySelector('#newGame');
85:   newGameButton.addEventListener('click', function (e) {
86:     randomNumber = parseInt(Math.random() * 100 + 1);
...
89:   });
90: }
```

### Critical Code Inspection & Bugs:

#### 1. The Duplicate Listener Memory Leak (Line 80 & 85)
Every time a game ends:
1. `endGame()` calls `newGame()`.
2. `newGame()` attaches a `click` listener to `#newGame`.
3. If the user plays 4 rounds, `#newGame` accumulates multiple listeners!
4. Clicking it triggers the restart logic 4 times simultaneously!

#### 2. `parseInt` vs `Math.floor`
```javascript
// ❌ Sub-optimal:
let randomNumber = parseInt(Math.random() * 100 + 1);

// ✅ Correct mathematical formulation:
const randomNumber = Math.floor(Math.random() * 100) + 1;
```
`parseInt` converts its argument to a string first (`"98.4234"`), then parses the string back into an integer! This incurs unnecessary string serialization overhead.

#### 3. Listening to Button Click Instead of Form Submit
```javascript
submit.addEventListener('click', ...);
```
If the user presses the `Enter` key inside the text input, a standard HTML `<form>` submits via `Enter`, which might bypass the click listener or cause unexpected form refreshes. Always listen to `form.addEventListener('submit', ...)`.

---

## 🧠 Deep-Dive: Core JavaScript Concepts

### 1. `Math.random()` & Generating Safe Integer Ranges

`Math.random()` returns a pseudo-random floating-point number in the range $[0, 1)$ (inclusive of 0, exclusive of 1).

To get a random integer in any inclusive range $[\text{min}, \text{max}]$:
```javascript
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

---

### 2. Forms, `submit` vs `click`, and `e.preventDefault()`

When a button inside a `<form>` is clicked:
1. The browser's default behavior is to construct an HTTP request and reload the page with form data in the URL query string.
2. In Single Page Applications (SPAs) and interactive widgets, `e.preventDefault()` cancels this default navigation, allowing JS to handle validation and rendering smoothly in-place.

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Stop page reload!
  processGuess();
});
```

---

### 3. Type Coercion: `parseInt` vs `Number` vs Unary `+`

| Method | `"42"` | `"42px"` | `""` (Empty string) | `null` |
| :--- | :--- | :--- | :--- | :--- |
| `parseInt(val, 10)` | `42` | `42` (extracts leading digits) | `NaN` | `NaN` |
| `Number(val)` | `42` | `NaN` (strict) | `0` ⚠️ | `0` ⚠️ |
| `+val` | `42` | `NaN` (strict) | `0` ⚠️ | `0` ⚠️ |

> **Interview Best Practice**: When validating user text inputs, use `parseInt(val.trim(), 10)` with a radix of 10, or strict `Number()` with an explicit check for empty strings (`val.trim() === ''`).

---

### 4. The `NaN` Gotcha: Why `NaN === NaN` is `false`

In JavaScript, IEEE 754 specifies that `NaN` is not equal to any value, including itself:
```javascript
console.log(NaN === NaN); // false!
```

To check if a parsed input is invalid:
```javascript
// ❌ Never do this:
if (guess === NaN) { ... }

// ✅ Modern standard: Number.isNaN()
if (Number.isNaN(guess)) {
  alert('Please enter a valid number');
}
```

---

### 5. Clean MVC (Model-View-Controller) in Vanilla JavaScript

In an interview, separating your code into **State**, **UI/Renderer**, and **Handlers** will immediately earn you top marks:

```javascript
// MODEL (State)
const state = {
  secretNumber: generateSecret(),
  attemptsLeft: 10,
  history: [],
  status: 'PLAYING' // 'PLAYING' | 'WON' | 'LOST'
};

// VIEW (DOM Updater)
function renderUI(state) {
  guessesDisplay.textContent = state.history.join(', ');
  remainingDisplay.textContent = state.attemptsLeft;
  // ...
}

// CONTROLLER (Game Rules)
function handleGuess(guess) {
  // Update state, then call renderUI(state)
}
```

---

## 💼 Machine Coding Round Playbook

### Interview Prompt
> *"Build a Number Guessing Game. The computer picks a secret number from 1 to 100. The player has 10 attempts. For each guess, validate the input, output 'Too High' or 'Too Low', show past guesses, and update remaining attempts. On game end (win or loss), disable the input and offer a 'Start New Game' button that resets everything without memory leaks."*

### Evaluation Checklist
- [x] **Strict Input Validation**: Rejects empty strings, decimals, characters, and out-of-range numbers.
- [x] **Form Submit Handling**: Uses `form.addEventListener('submit', ...)` with `e.preventDefault()`.
- [x] **No Duplicate Event Listeners**: Attaches restart handler once during initialization or cleans it up properly.
- [x] **Semantic Accessibility**: Accessible form labels (`<label for="...">`), aria live regions (`aria-live="polite"`).

---

## 🚀 Senior Engineer Refactored Code (Production Grade)

### Refactored HTML (`index.html` snippet)
```html
<main id="wrapper">
  <h1>Number Guessing Game</h1>
  <p>Guess a number between 1 and 100. You have 10 attempts.</p>

  <form id="guessForm" class="form" novalidate>
    <label for="guessInput" id="guessLabel">Enter your guess:</label>
    <input 
      type="number" 
      id="guessInput" 
      min="1" 
      max="100" 
      required 
      autocomplete="off"
      placeholder="e.g. 42" />
    <button type="submit" id="submitBtn">Submit Guess</button>
  </form>

  <section class="resultParas" aria-live="polite">
    <p>Previous Guesses: <span class="guesses">None</span></p>
    <p>Guesses Remaining: <span class="lastResult">10</span></p>
    <p class="lowOrHi"></p>
  </section>

  <div id="restartContainer"></div>
</main>
```

### Refactored JavaScript (`script.js`)
```javascript
/**
 * Senior-Grade Number Guesser Game
 * Features: Pure state machine, zero listener leaks, strict validation, clean restart logic.
 */
(function initGame() {
  'use strict';

  // 1. DOM Elements
  const form = document.querySelector('#guessForm');
  const input = document.querySelector('#guessInput');
  const submitBtn = document.querySelector('#submitBtn');
  const guessesSlot = document.querySelector('.guesses');
  const remainingSlot = document.querySelector('.lastResult');
  const feedbackSlot = document.querySelector('.lowOrHi');
  const restartContainer = document.querySelector('#restartContainer');

  const MAX_ATTEMPTS = 10;

  // 2. State
  let state = {
    secret: getRandomNumber(),
    attemptsLeft: MAX_ATTEMPTS,
    history: [],
    isGameOver: false
  };

  function getRandomNumber() {
    return Math.floor(Math.random() * 100) + 1;
  }

  // 3. Render View
  function render() {
    guessesSlot.textContent = state.history.length ? state.history.join(', ') : 'None';
    remainingSlot.textContent = state.attemptsLeft;

    if (state.isGameOver) {
      input.disabled = true;
      submitBtn.disabled = true;
      showRestartButton();
    } else {
      input.disabled = false;
      submitBtn.disabled = false;
      restartContainer.innerHTML = '';
    }
  }

  function setFeedback(msg, colorClass = '') {
    feedbackSlot.textContent = msg;
    feedbackSlot.className = `lowOrHi ${colorClass}`;
  }

  function showRestartButton() {
    restartContainer.innerHTML = `<button type="button" id="restartBtn" class="button">Play Again</button>`;
  }

  // 4. Game Rules
  function processGuess(guess) {
    state.history.push(guess);
    state.attemptsLeft--;

    if (guess === state.secret) {
      setFeedback(`🎉 Correct! The number was ${state.secret}. You won!`, 'text-success');
      state.isGameOver = true;
    } else if (state.attemptsLeft <= 0) {
      setFeedback(`💀 Game Over! The secret number was ${state.secret}.`, 'text-danger');
      state.isGameOver = true;
    } else if (guess < state.secret) {
      setFeedback('📉 Too low! Try a higher number.');
    } else {
      setFeedback('📈 Too high! Try a lower number.');
    }

    render();
  }

  // 5. Form Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.isGameOver) return;

    const rawValue = input.value.trim();
    const guess = parseInt(rawValue, 10);

    // Validation
    if (Number.isNaN(guess) || guess < 1 || guess > 100) {
      setFeedback('⚠️ Please enter an integer between 1 and 100.', 'text-warning');
      return;
    }

    if (state.history.includes(guess)) {
      setFeedback(`⚠️ You already guessed ${guess}! Try another number.`, 'text-warning');
      return;
    }

    input.value = '';
    input.focus();
    processGuess(guess);
  });

  // 6. Restart Button Event Delegation (Attached ONCE to restartContainer!)
  restartContainer.addEventListener('click', (e) => {
    if (e.target.id === 'restartBtn') {
      state = {
        secret: getRandomNumber(),
        attemptsLeft: MAX_ATTEMPTS,
        history: [],
        isGameOver: false
      };
      setFeedback('');
      render();
      input.focus();
    }
  });

  // Initialize
  render();
})();
```

---

## ❓ High-Yield Frontend Interview Questions & Answers

### Q1: Why should you use `Number.isNaN(val)` instead of global `isNaN(val)`?
**Answer:**
Global `isNaN(val)` coerces its argument to a number before checking:
```javascript
isNaN("hello");        // true (coerces "hello" to NaN)
Number.isNaN("hello"); // false (checks if value is of type Number AND is NaN)
```
`Number.isNaN()` is strictly typed and prevents false positives on string arguments.

### Q2: Why is attaching event listeners repeatedly inside a function like `endGame()` an anti-pattern?
**Answer:**
It creates a **Dangling Listener Memory Leak**. Each call to `addEventListener` appends an additional callback to the element's internal event table unless cleaned up. In long-running Single Page Apps, this leads to sluggish memory performance and bugs where handlers fire multiple times for a single user action.

---

## 🏆 Level-Up Challenges
- **Bronze**: Add duplicate guess detection (warn the user without deducting an attempt).
- **Silver**: Add difficulty levels (Easy: 1–50 with 10 guesses, Hard: 1–200 with 7 guesses).
- **Gold**: Implement High Score persistence using `localStorage` (fewest guesses to win).
