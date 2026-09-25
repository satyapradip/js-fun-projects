/**
 * 🌟 Machine Coding Interview: Star Rating Component
 * 
 * Key Concepts Demonstrated:
 * 1. State Machine Architecture (Single source of truth: selected vs hovered)
 * 2. Event Delegation (1 listener on parent container vs 5 individual listeners)
 * 3. Event Bubbling & closest() element traversal
 * 4. Keyboard Navigation (WCAG 2.1 AA Compliance)
 * 5. Dynamic ARIA Live Announcements for Screen Readers
 */

(() => {
  'use strict';

  // --- 1. STATE SCHEMA ---
  const state = {
    rating: 0,         // Permanent selected rating (0 to 5)
    hoveredRating: 0,  // Transient hover/preview rating (0 to 5)
    isSubmitted: false
  };

  const SENTIMENT_LABELS = {
    0: 'Select your rating',
    1: 'Disappointing 😞',
    2: 'Needs Improvement 😐',
    3: 'Average Experience 🙂',
    4: 'Great Quality! 😊',
    5: 'Outstanding Experience! 🚀'
  };

  // --- 2. DOM QUERY SELECTORS ---
  const starsContainer = document.querySelector('#starsContainer');
  const starButtons = Array.from(document.querySelectorAll('.star-btn'));
  const sentimentText = document.querySelector('#sentimentText');
  const ratingMetric = document.querySelector('#ratingMetric');
  const progressFill = document.querySelector('#progressFill');
  const resetBtn = document.querySelector('#resetBtn');
  const submitBtn = document.querySelector('#submitBtn');
  const confirmationBox = document.querySelector('#confirmationBox');
  const srFeedback = document.querySelector('#srFeedback');

  // --- 3. PURE RENDER FUNCTION (STATE -> DOM) ---
  function render() {
    // Current effective display value: preview hover has precedence over selected rating
    const activeValue = state.hoveredRating || state.rating;

    // Update each star appearance and ARIA state
    starButtons.forEach((btn) => {
      const starValue = Number(btn.dataset.value);
      const isFilled = starValue <= activeValue;
      const isHovered = Boolean(state.hoveredRating && starValue <= state.hoveredRating);
      const isSelected = Boolean(!state.hoveredRating && starValue <= state.rating);

      btn.classList.toggle('is-filled', isFilled);
      btn.classList.toggle('is-hovered', isHovered);
      btn.classList.toggle('is-selected', isSelected);

      // Accessibility: update aria-checked for the exact selected value
      const isCurrentSelected = starValue === state.rating;
      btn.setAttribute('aria-checked', isCurrentSelected ? 'true' : 'false');
    });

    // Update sentiment label & numeric metric
    sentimentText.textContent = SENTIMENT_LABELS[activeValue];
    ratingMetric.textContent = `${activeValue} / 5`;

    // Update progress track percentage
    const fillPercent = (activeValue / 5) * 100;
    progressFill.style.width = `${fillPercent}%`;

    // Control button interactive states
    const hasSelection = state.rating > 0;
    resetBtn.disabled = !hasSelection || state.isSubmitted;
    submitBtn.disabled = !hasSelection || state.isSubmitted;

    // Accessibility live region announcement
    if (state.rating > 0) {
      srFeedback.textContent = `Selected ${state.rating} out of 5 stars: ${SENTIMENT_LABELS[state.rating]}`;
    } else {
      srFeedback.textContent = 'No rating selected';
    }
  }

  // --- 4. STATE MUTATION HANDLERS ---
  function setHover(val) {
    if (state.isSubmitted) return;
    state.hoveredRating = val;
    render();
  }

  function clearHover() {
    if (state.isSubmitted) return;
    state.hoveredRating = 0;
    render();
  }

  function setRating(val) {
    if (state.isSubmitted) return;
    // Toggle off if clicking the same rating
    state.rating = state.rating === val ? 0 : val;
    state.hoveredRating = 0;
    render();
  }

  function resetRating() {
    state.rating = 0;
    state.hoveredRating = 0;
    state.isSubmitted = false;
    confirmationBox.hidden = true;
    render();
  }

  function submitRating() {
    if (state.rating === 0) return;
    state.isSubmitted = true;
    confirmationBox.hidden = false;
    render();
  }

  // --- 5. EVENT DELEGATION ON CONTAINER ---
  // Using event delegation: One listener handles mouseenter/click for all child buttons
  starsContainer.addEventListener('mouseover', (e) => {
    const starBtn = e.target.closest('.star-btn');
    if (!starBtn) return;
    const val = Number(starBtn.dataset.value);
    setHover(val);
  });

  starsContainer.addEventListener('mouseleave', () => {
    clearHover();
  });

  starsContainer.addEventListener('click', (e) => {
    const starBtn = e.target.closest('.star-btn');
    if (!starBtn) return;
    const val = Number(starBtn.dataset.value);
    setRating(val);
  });

  // --- 6. KEYBOARD ACCESSIBILITY (WCAG 2.1 AA) ---
  starsContainer.addEventListener('keydown', (e) => {
    if (state.isSubmitted) return;

    let targetRating = state.rating;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        targetRating = Math.min(5, (state.rating || 0) + 1);
        setRating(targetRating);
        break;

      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        targetRating = Math.max(1, (state.rating || 1) - 1);
        setRating(targetRating);
        break;

      case 'Home':
        e.preventDefault();
        setRating(1);
        break;

      case 'End':
        e.preventDefault();
        setRating(5);
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        e.preventDefault();
        setRating(Number(e.key));
        break;

      default:
        break;
    }
  });

  // --- 7. BUTTON ACTION LISTENERS ---
  resetBtn.addEventListener('click', resetRating);
  submitBtn.addEventListener('click', submitRating);

  // Initialize UI
  render();
})();
