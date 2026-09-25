/**
 * 🔍 Machine Coding Interview: Typeahead & Autocomplete Search Engine
 * 
 * Key Concepts Demonstrated:
 * 1. Debounce implementation via Closures & Timer cleanup
 * 2. Asynchronous Race Condition elimination using AbortController
 * 3. Client-side In-Memory Cache (Map data structure)
 * 4. Full Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
 * 5. Safe Substring Highlighting without XSS vulnerabilities
 * 6. LocalStorage synchronization for Recent Searches
 */

(() => {
  'use strict';

  // --- 1. MOCK DATABASE (Simulating Backend Endpoints) ---
  const MOCK_DATA = [
    { id: 1, title: 'JavaScript', category: 'Language', desc: 'High-level, interpreted scripting language of the web.' },
    { id: 2, title: 'TypeScript', category: 'Language', desc: 'Strict syntactical superset of JavaScript adding static typing.' },
    { id: 3, title: 'Java', category: 'Language', desc: 'Class-based, object-oriented general-purpose programming language.' },
    { id: 4, title: 'Python', category: 'Language', desc: 'Interpreted, high-level language emphasizing code readability.' },
    { id: 5, title: 'React', category: 'Library', desc: 'Frontend UI library maintained by Meta for building component trees.' },
    { id: 6, title: 'Redux', category: 'State', desc: 'Predictable state container for JavaScript apps.' },
    { id: 7, title: 'Next.js', category: 'Framework', desc: 'Full-stack React framework by Vercel with SSR, SSG, and ISR.' },
    { id: 8, title: 'Node.js', category: 'Runtime', desc: 'Asynchronous event-driven JavaScript runtime built on Chrome V8 engine.' },
    { id: 9, title: 'NestJS', category: 'Framework', desc: 'Progressive Node.js framework for building efficient server-side apps.' },
    { id: 10, title: 'GraphQL', category: 'Query API', desc: 'Query language for your API and a server-side runtime for executing queries.' },
    { id: 11, title: 'Go (Golang)', category: 'Language', desc: 'Statically typed, compiled programming language designed at Google.' },
    { id: 12, title: 'Rust', category: 'Language', desc: 'Blazingly fast memory-efficient systems language with zero garbage collection.' },
    { id: 13, title: 'Docker', category: 'DevOps', desc: 'Platform for developing, shipping, and running applications in containers.' },
    { id: 14, title: 'Kubernetes', category: 'DevOps', desc: 'Production-grade container orchestration system automated by CNCF.' },
    { id: 15, title: 'Tailwind CSS', category: 'Styling', desc: 'Utility-first CSS framework for rapid modern UI development.' }
  ];

  // --- 2. DEBOUNCE UTILITY FUNCTION ---
  function debounce(callback, delayMs = 300) {
    let timerId = null;
    return function (...args) {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        callback.apply(this, args);
      }, delayMs);
    };
  }

  // --- 3. STATE MANAGEMENT ---
  const state = {
    query: '',
    results: [],
    highlightedIndex: -1, // -1 means none selected
    isLoading: false,
    selectedItem: null,
    recentSearches: JSON.parse(localStorage.getItem('recent_searches') || '["JavaScript", "React", "Rust"]'),
    stats: {
      networkHits: 0,
      cacheHits: 0,
      abortedCount: 0
    }
  };

  // In-memory LRU / Map cache: Key = query string, Value = results array
  const cache = new Map();

  // Active in-flight AbortController
  let activeAbortController = null;

  // --- 4. DOM ELEMENTS ---
  const combobox = document.querySelector('#combobox');
  const searchInput = document.querySelector('#searchInput');
  const clearBtn = document.querySelector('#clearBtn');
  const loadingSpinner = document.querySelector('#loadingSpinner');
  const suggestionsList = document.querySelector('#suggestionsList');
  const recentSearchesSection = document.querySelector('#recentSearchesSection');
  const recentChips = document.querySelector('#recentChips');
  const clearRecentBtn = document.querySelector('#clearRecentBtn');
  const selectionCard = document.querySelector('#selectionCard');
  const selectionCategory = document.querySelector('#selectionCategory');
  const selectionTitle = document.querySelector('#selectionTitle');
  const selectionDesc = document.querySelector('#selectionDesc');
  const metricNetwork = document.querySelector('#metricNetwork');
  const metricCache = document.querySelector('#metricCache');
  const metricAborted = document.querySelector('#metricAborted');

  // --- 5. ASYNC API FETCH SIMULATION WITH ABORT SIGNAL ---
  function fetchSuggestions(query, signal) {
    state.stats.networkHits++;
    updateMetricsUI();

    return new Promise((resolve, reject) => {
      // Random network latency between 250ms and 500ms
      const delay = Math.floor(Math.random() * 250) + 250;
      const timeoutId = setTimeout(() => {
        const normalized = query.trim().toLowerCase();
        const matches = MOCK_DATA.filter(item =>
          item.title.toLowerCase().includes(normalized) ||
          item.category.toLowerCase().includes(normalized)
        );
        resolve(matches);
      }, delay);

      // Listen for early cancellation from AbortController
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new DOMException('Aborted by user input', 'AbortError'));
        });
      }
    });
  }

  // --- 6. CORE SEARCH HANDLER (RACE-CONDITION RESILIENT) ---
  async function performSearch(rawQuery) {
    const trimmed = rawQuery.trim();

    if (!trimmed) {
      closeDropdown();
      return;
    }

    const cacheKey = trimmed.toLowerCase();

    // 1. Check in-memory cache first
    if (cache.has(cacheKey)) {
      state.stats.cacheHits++;
      updateMetricsUI();
      state.results = cache.get(cacheKey);
      state.highlightedIndex = -1;
      state.isLoading = false;
      renderDropdown();
      return;
    }

    // 2. Abort any previous pending network request
    if (activeAbortController) {
      activeAbortController.abort();
      state.stats.abortedCount++;
      updateMetricsUI();
    }

    // 3. Create fresh AbortController for new request
    activeAbortController = new AbortController();
    state.isLoading = true;
    renderLoading(true);

    try {
      const results = await fetchSuggestions(trimmed, activeAbortController.signal);
      
      // Save in cache (Key: normalized query)
      cache.set(cacheKey, results);

      state.results = results;
      state.highlightedIndex = -1;
      state.isLoading = false;
      renderLoading(false);
      renderDropdown();
    } catch (err) {
      if (err.name === 'AbortError') {
        // Intentionally aborted because user kept typing — silent ignore!
        return;
      }
      console.error('Fetch error:', err);
      state.isLoading = false;
      renderLoading(false);
    }
  }

  // Wrapped with 300ms debounce
  const debouncedSearch = debounce((q) => performSearch(q), 300);

  // --- 7. RENDERING LOGIC ---
  function renderDropdown() {
    const query = state.query.trim();
    if (!query) {
      closeDropdown();
      return;
    }

    suggestionsList.innerHTML = '';

    if (state.results.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-state';
      emptyLi.textContent = `No results found matching "${query}"`;
      suggestionsList.appendChild(emptyLi);
    } else {
      state.results.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'suggestion-item';
        li.id = `suggestion-item-${item.id}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', index === state.highlightedIndex ? 'true' : 'false');
        li.dataset.index = index;

        if (index === state.highlightedIndex) {
          li.classList.add('is-highlighted');
        }

        // Safe substring highlight without XSS risk
        const titleSpan = document.createElement('span');
        titleSpan.className = 'suggestion-title';
        titleSpan.innerHTML = highlightMatch(item.title, query);

        const categorySpan = document.createElement('span');
        categorySpan.className = 'suggestion-category';
        categorySpan.textContent = item.category;

        li.appendChild(titleSpan);
        li.appendChild(categorySpan);
        suggestionsList.appendChild(li);
      });
    }

    suggestionsList.hidden = false;
    combobox.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    suggestionsList.hidden = true;
    combobox.setAttribute('aria-expanded', 'false');
    state.highlightedIndex = -1;
  }

  function renderLoading(loading) {
    loadingSpinner.hidden = !loading;
  }

  function updateMetricsUI() {
    metricNetwork.textContent = state.stats.networkHits;
    metricCache.textContent = state.stats.cacheHits;
    metricAborted.textContent = state.stats.abortedCount;
  }

  // Safe query highlighting function (escapes HTML to prevent XSS)
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function highlightMatch(fullText, query) {
    const escapedText = escapeHTML(fullText);
    const escapedQuery = escapeHTML(query);
    const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapedText.replace(regex, '<span class="highlight-match">$1</span>');
  }

  function renderRecentSearches() {
    recentChips.innerHTML = '';
    if (state.recentSearches.length === 0) {
      recentSearchesSection.hidden = true;
      return;
    }
    recentSearchesSection.hidden = false;

    state.recentSearches.forEach((term) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'recent-chip';
      chip.textContent = term;
      chip.addEventListener('click', () => {
        searchInput.value = term;
        state.query = term;
        clearBtn.hidden = false;
        performSearch(term);
      });
      recentChips.appendChild(chip);
    });
  }

  function selectItem(item) {
    state.selectedItem = item;
    searchInput.value = item.title;
    state.query = item.title;
    closeDropdown();

    // Show selection card
    selectionCategory.textContent = item.category;
    selectionTitle.textContent = item.title;
    selectionDesc.textContent = item.desc;
    selectionCard.hidden = false;

    // Add to recent searches (prevent duplicates, keep max 6)
    state.recentSearches = [item.title, ...state.recentSearches.filter(s => s !== item.title)].slice(0, 6);
    localStorage.setItem('recent_searches', JSON.stringify(state.recentSearches));
    renderRecentSearches();
  }

  // --- 8. EVENT LISTENERS ---

  // Input typing with debounce
  searchInput.addEventListener('input', (e) => {
    state.query = e.target.value;
    clearBtn.hidden = state.query.length === 0;

    if (!state.query.trim()) {
      closeDropdown();
      if (activeAbortController) {
        activeAbortController.abort();
      }
      return;
    }

    debouncedSearch(state.query);
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.query = '';
    clearBtn.hidden = true;
    closeDropdown();
    selectionCard.hidden = true;
    searchInput.focus();
  });

  // Clear recent searches
  clearRecentBtn.addEventListener('click', () => {
    state.recentSearches = [];
    localStorage.removeItem('recent_searches');
    renderRecentSearches();
  });

  // Suggestion click (Event Delegation)
  suggestionsList.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.suggestion-item');
    if (!itemEl) return;
    const index = Number(itemEl.dataset.index);
    const chosen = state.results[index];
    if (chosen) selectItem(chosen);
  });

  // Keyboard Navigation
  searchInput.addEventListener('keydown', (e) => {
    const hasResults = !suggestionsList.hidden && state.results.length > 0;

    switch (e.key) {
      case 'ArrowDown':
        if (!hasResults) return;
        e.preventDefault();
        state.highlightedIndex = (state.highlightedIndex + 1) % state.results.length;
        renderDropdown();
        scrollActiveIntoView();
        break;

      case 'ArrowUp':
        if (!hasResults) return;
        e.preventDefault();
        state.highlightedIndex = state.highlightedIndex <= 0
          ? state.results.length - 1
          : state.highlightedIndex - 1;
        renderDropdown();
        scrollActiveIntoView();
        break;

      case 'Enter':
        if (hasResults && state.highlightedIndex >= 0) {
          e.preventDefault();
          selectItem(state.results[state.highlightedIndex]);
        }
        break;

      case 'Escape':
        closeDropdown();
        break;

      default:
        break;
    }
  });

  function scrollActiveIntoView() {
    const activeEl = suggestionsList.querySelector('.is-highlighted');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!combobox.contains(e.target)) {
      closeDropdown();
    }
  });

  // Initialize
  renderRecentSearches();
  updateMetricsUI();
})();
