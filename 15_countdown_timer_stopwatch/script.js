/**
 * ⏱️ Machine Coding Interview: Precision Timer & Stopwatch
 * 
 * Key Concepts Demonstrated:
 * 1. Timestamp Delta Time Calculation (Drift-Correction over setInterval)
 * 2. State Machine Transitions (IDLE, RUNNING, PAUSED, FINISHED)
 * 3. SVG Circumference Geometry & Dynamic stroke-dashoffset Animation
 * 4. Synthesizing Sound with Web Audio API (OscillatorNode & GainNode)
 * 5. Laps Analysis (Fastest / Slowest lap detection)
 * 6. Keyboard Shortcuts with focus isolation
 */

(() => {
  'use strict';

  // --- 1. STATE DEFINITION ---
  const state = {
    mode: 'STOPWATCH', // 'STOPWATCH' | 'COUNTDOWN'
    status: 'IDLE',    // 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED'
    
    // Time tracking in milliseconds
    startTime: 0,
    accumulatedTime: 0,
    countdownTotalMs: 90000, // Default 1 min 30 sec
    countdownRemainingMs: 90000,
    
    // Laps
    laps: [],
    lastLapTimeMs: 0
  };

  let animationFrameId = null;
  let intervalId = null;

  // --- 2. DOM ELEMENTS ---
  const tabStopwatch = document.querySelector('#tabStopwatch');
  const tabTimer = document.querySelector('#tabTimer');
  const timeDisplay = document.querySelector('#timeDisplay');
  const msDisplay = document.querySelector('#msDisplay');
  const statusBadge = document.querySelector('#statusBadge');
  const progressRing = document.querySelector('#progressRing');
  const timerInputSection = document.querySelector('#timerInputSection');
  const hoursInput = document.querySelector('#hoursInput');
  const minsInput = document.querySelector('#minsInput');
  const secsInput = document.querySelector('#secsInput');
  const startPauseBtn = document.querySelector('#startPauseBtn');
  const resetBtn = document.querySelector('#resetBtn');
  const lapBtn = document.querySelector('#lapBtn');
  const presetsRow = document.querySelector('#presetsRow');
  const lapsSection = document.querySelector('#lapsSection');
  const lapsList = document.querySelector('#lapsList');

  // --- 3. SVG CIRCUMFERENCE SETUP ---
  const RADIUS = 120;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~753.98 px
  progressRing.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  progressRing.style.strokeDashoffset = '0';

  // --- 4. WEB AUDIO API CHIME SYNTHESIZER ---
  function playBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('AudioContext unavailable or blocked by autoplay policy', e);
    }
  }

  // --- 5. TIME FORMATTING HELPER ---
  function formatTime(totalMs) {
    const totalSecs = Math.floor(totalMs / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hrs = Math.floor(totalSecs / 3600);

    const pad = (n) => String(n).padStart(2, '0');
    return {
      main: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
      ms: `.${pad(ms)}`
    };
  }

  // --- 6. CORE TICK & DRIFT-CORRECTED TIME ENGINE ---
  function tick() {
    const now = Date.now();

    if (state.mode === 'STOPWATCH') {
      const currentElapsed = state.accumulatedTime + (now - state.startTime);
      updateDisplay(currentElapsed);
      
      // Rotate ring once every 60 seconds
      const cycleProgress = (currentElapsed % 60000) / 60000;
      progressRing.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - cycleProgress)}`;
    } else {
      // Countdown mode
      const elapsedSinceStart = now - state.startTime;
      const remaining = Math.max(0, state.countdownRemainingMs - elapsedSinceStart);
      
      updateDisplay(remaining);

      // Ring empties as time approaches zero
      const fractionRemaining = remaining / state.countdownTotalMs;
      progressRing.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - fractionRemaining)}`;

      if (remaining <= 0) {
        completeCountdown();
      }
    }
  }

  function updateDisplay(ms) {
    const formatted = formatTime(ms);
    // Directly update text nodes without destroying child elements
    timeDisplay.firstChild.textContent = formatted.main;
    msDisplay.textContent = formatted.ms;
  }

  // --- 7. STATE TRANSITION ACTIONS ---
  function start() {
    state.status = 'RUNNING';
    state.startTime = Date.now();

    // High frequency interval (10ms) for smooth millisecond digital readout
    intervalId = setInterval(tick, 10);

    render();
  }

  function pause() {
    state.status = 'PAUSED';
    clearInterval(intervalId);

    const now = Date.now();
    if (state.mode === 'STOPWATCH') {
      state.accumulatedTime += now - state.startTime;
    } else {
      state.countdownRemainingMs = Math.max(0, state.countdownRemainingMs - (now - state.startTime));
    }

    render();
  }

  function reset() {
    state.status = 'IDLE';
    clearInterval(intervalId);
    state.startTime = 0;
    state.accumulatedTime = 0;
    state.laps = [];
    state.lastLapTimeMs = 0;

    if (state.mode === 'COUNTDOWN') {
      readInputsToState();
      updateDisplay(state.countdownTotalMs);
      progressRing.style.strokeDashoffset = '0';
    } else {
      updateDisplay(0);
      progressRing.style.strokeDashoffset = '0';
    }

    render();
    renderLaps();
  }

  function recordLap() {
    if (state.status !== 'RUNNING' || state.mode !== 'STOPWATCH') return;

    const currentTotal = state.accumulatedTime + (Date.now() - state.startTime);
    const splitTime = currentTotal - state.lastLapTimeMs;
    state.lastLapTimeMs = currentTotal;

    state.laps.unshift({
      lapNumber: state.laps.length + 1,
      splitMs: splitTime,
      totalMs: currentTotal
    });

    renderLaps();
  }

  function completeCountdown() {
    clearInterval(intervalId);
    state.status = 'FINISHED';
    state.countdownRemainingMs = 0;
    updateDisplay(0);
    progressRing.style.strokeDashoffset = `${CIRCUMFERENCE}`;
    playBeep();
    render();
  }

  function readInputsToState() {
    const hrs = Math.max(0, parseInt(hoursInput.value, 10) || 0);
    const mins = Math.max(0, Math.min(59, parseInt(minsInput.value, 10) || 0));
    const secs = Math.max(0, Math.min(59, parseInt(secsInput.value, 10) || 0));
    
    const totalMs = ((hrs * 3600) + (mins * 60) + secs) * 1000;
    state.countdownTotalMs = totalMs || 1000; // minimum 1 second
    state.countdownRemainingMs = state.countdownTotalMs;
  }

  // --- 8. RENDERING LOGIC ---
  function render() {
    // Status Badge
    statusBadge.textContent = state.status;
    statusBadge.className = 'status-indicator';

    if (state.status === 'RUNNING') {
      statusBadge.style.color = '#34d399';
      statusBadge.style.background = 'rgba(52, 211, 153, 0.15)';
    } else if (state.status === 'PAUSED') {
      statusBadge.style.color = '#fbbf24';
      statusBadge.style.background = 'rgba(251, 191, 36, 0.15)';
    } else if (state.status === 'FINISHED') {
      statusBadge.style.color = '#f87171';
      statusBadge.style.background = 'rgba(248, 113, 113, 0.15)';
    } else {
      statusBadge.style.color = 'var(--text-muted)';
      statusBadge.style.background = 'rgba(255, 255, 255, 0.06)';
    }

    // Buttons
    if (state.status === 'RUNNING') {
      startPauseBtn.textContent = 'Pause';
      startPauseBtn.className = 'btn btn-primary btn-pause';
      resetBtn.disabled = false;
      lapBtn.disabled = state.mode !== 'STOPWATCH';
    } else if (state.status === 'PAUSED') {
      startPauseBtn.textContent = 'Resume';
      startPauseBtn.className = 'btn btn-primary';
      resetBtn.disabled = false;
      lapBtn.disabled = true;
    } else if (state.status === 'FINISHED') {
      startPauseBtn.textContent = 'Restart';
      startPauseBtn.className = 'btn btn-primary';
      resetBtn.disabled = false;
      lapBtn.disabled = true;
    } else {
      // IDLE
      startPauseBtn.textContent = 'Start';
      startPauseBtn.className = 'btn btn-primary';
      resetBtn.disabled = true;
      lapBtn.disabled = true;
    }

    // Inputs visibility
    const isCountdownIdle = state.mode === 'COUNTDOWN' && state.status === 'IDLE';
    timerInputSection.hidden = !isCountdownIdle;
    presetsRow.hidden = !isCountdownIdle;
  }

  function renderLaps() {
    if (state.laps.length === 0) {
      lapsList.innerHTML = '<li class="laps-empty">No laps recorded yet. Press "Lap" while running.</li>';
      return;
    }

    // Find fastest and slowest splits (only if 2+ laps)
    let minSplit = Infinity;
    let maxSplit = -Infinity;

    if (state.laps.length >= 2) {
      state.laps.forEach(lap => {
        if (lap.splitMs < minSplit) minSplit = lap.splitMs;
        if (lap.splitMs > maxSplit) maxSplit = lap.splitMs;
      });
    }

    lapsList.innerHTML = state.laps.map(lap => {
      let modifier = '';
      if (state.laps.length >= 2) {
        if (lap.splitMs === minSplit) modifier = 'lap-fastest';
        else if (lap.splitMs === maxSplit) modifier = 'lap-slowest';
      }

      const splitFormatted = formatTime(lap.splitMs);
      const totalFormatted = formatTime(lap.totalMs);

      return `
        <li class="lap-item ${modifier}">
          <span>Lap ${lap.lapNumber}</span>
          <span>${splitFormatted.main}${splitFormatted.ms}</span>
          <span>${totalFormatted.main}${totalFormatted.ms}</span>
        </li>
      `;
    }).join('');
  }

  // --- 9. EVENT LISTENERS ---
  tabStopwatch.addEventListener('click', () => {
    if (state.mode === 'STOPWATCH') return;
    reset();
    state.mode = 'STOPWATCH';
    tabStopwatch.classList.add('active');
    tabStopwatch.setAttribute('aria-selected', 'true');
    tabTimer.classList.remove('active');
    tabTimer.setAttribute('aria-selected', 'false');
    lapsSection.hidden = false;
    updateDisplay(0);
    render();
  });

  tabTimer.addEventListener('click', () => {
    if (state.mode === 'COUNTDOWN') return;
    reset();
    state.mode = 'COUNTDOWN';
    tabTimer.classList.add('active');
    tabTimer.setAttribute('aria-selected', 'true');
    tabStopwatch.classList.remove('active');
    tabStopwatch.setAttribute('aria-selected', 'false');
    lapsSection.hidden = true;
    readInputsToState();
    updateDisplay(state.countdownTotalMs);
    render();
  });

  startPauseBtn.addEventListener('click', () => {
    if (state.status === 'RUNNING') {
      pause();
    } else {
      if (state.mode === 'COUNTDOWN' && state.status === 'IDLE') {
        readInputsToState();
      }
      start();
    }
  });

  resetBtn.addEventListener('click', reset);
  lapBtn.addEventListener('click', recordLap);

  // Preset buttons
  presetsRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    const secs = parseInt(btn.dataset.secs, 10);
    hoursInput.value = Math.floor(secs / 3600);
    minsInput.value = Math.floor((secs % 3600) / 60);
    secsInput.value = secs % 60;
    readInputsToState();
    updateDisplay(state.countdownTotalMs);
  });

  // Inputs change handler
  [hoursInput, minsInput, secsInput].forEach(inp => {
    inp.addEventListener('input', () => {
      readInputsToState();
      updateDisplay(state.countdownTotalMs);
    });
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Avoid triggering when user is editing input boxes
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      startPauseBtn.click();
    } else if (e.key === 'l' || e.key === 'L') {
      if (!lapBtn.disabled) recordLap();
    } else if (e.key === 'r' || e.key === 'R') {
      if (!resetBtn.disabled) reset();
    }
  });

  // Initial render
  updateDisplay(0);
  render();
})();
