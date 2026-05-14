/**
 * psychology.js — age-appropriate activity suggestion engine
 *
 * Depends on: storage.js, profiles.js
 * Reads: assets/data/suggestions.json (bundled, no network call after first load)
 *
 * Uses Piaget cognitive stages and Erikson psychosocial stages
 * to filter age-appropriate suggestions.
 *
 * DISCLAIMER: Suggestions are general guidance based on child development
 * research — not personalised clinical advice.
 */

const psychology = (() => {

  const SUGGESTION_COUNT = 3;
  const RECENCY_WEEKS    = 4;

  // Cache loaded suggestions in memory to avoid repeated fetch
  let _cachedSuggestions = null;

  // ── Age band mapping (for UI display only) ─────────────────────────────────

  const AGE_BANDS = [
    { min: 0,  max: 3,  label: 'Toddler',      erikson: 'Autonomy vs. shame',          piaget: 'Sensorimotor' },
    { min: 4,  max: 6,  label: 'Pre-school',   erikson: 'Initiative vs. guilt',        piaget: 'Pre-operational' },
    { min: 7,  max: 11, label: 'School age',   erikson: 'Industry vs. inferiority',    piaget: 'Concrete operational' },
    { min: 12, max: 14, label: 'Early teen',   erikson: 'Identity vs. role confusion', piaget: 'Formal operational' },
    { min: 15, max: 99, label: 'Teen',         erikson: 'Identity vs. role confusion', piaget: 'Formal operational' },
  ];

  function getAgeBand(ageInYears) {
    return AGE_BANDS.find(b => ageInYears >= b.min && ageInYears <= b.max) || AGE_BANDS[0];
  }

  // ── Load suggestions ───────────────────────────────────────────────────────

  async function _loadSuggestions() {
    if (_cachedSuggestions) return _cachedSuggestions;
    try {
      const response = await fetch('/assets/data/suggestions.json');
      const data     = await response.json();
      _cachedSuggestions = data.suggestions || [];
      return _cachedSuggestions;
    } catch (err) {
      console.error('psychology._loadSuggestions: could not load suggestions.json', err);
      return [];
    }
  }

  // ── Main suggestion engine ─────────────────────────────────────────────────

  /**
   * Get up to 3 age-appropriate suggestions for a child.
   * Excludes suggestions shown to this child in the last 4 weeks.
   *
   * @param {number}  childAgeYears - Child's age in years (from profiles.calcAge)
   * @param {boolean} hasSiblings   - Whether child has siblings
   * @param {string}  childId       - Used for recency exclusion
   * @returns {Promise<Array>}
   */
  async function getSuggestions(childAgeYears, hasSiblings, childId) {
    try {
      const all = await _loadSuggestions();
      if (!all.length) return _fallbackSuggestions(childAgeYears);

      // 1. Filter by age
      let pool = all.filter(s => childAgeYears >= s.ageMin && childAgeYears <= s.ageMax);

      // 2. Filter by sibling requirement
      //    siblingRequired: true  → only show if child has siblings
      //    siblingRequired: false → always show
      pool = pool.filter(s => !s.siblingRequired || hasSiblings);

      // 3. Exclude recently shown suggestions
      const recentIds = _getRecentSuggestionIds(childId);
      const fresh     = pool.filter(s => !recentIds.includes(s.id));

      // 4. Use fresh pool if possible, fall back to full pool
      const source = fresh.length >= SUGGESTION_COUNT ? fresh : pool;

      // 5. Shuffle and pick SUGGESTION_COUNT
      const shuffled = _shuffle([...source]);
      const picked   = shuffled.slice(0, SUGGESTION_COUNT);

      // 6. Record as shown
      _recordShownSuggestions(childId, picked.map(s => s.id));

      return picked;
    } catch (err) {
      console.error('psychology.getSuggestions:', err);
      return _fallbackSuggestions(childAgeYears);
    }
  }

  /**
   * Dismiss a suggestion (parent tapped "not now").
   *
   * @param {string} childId
   * @param {string} suggestionId
   */
  function dismissSuggestion(childId, suggestionId) {
    const settings   = profiles.getSettings();
    const dismissed  = settings.dismissedSuggestions || {};
    dismissed[childId] = [...(dismissed[childId] || []), suggestionId].slice(-50);
    profiles.saveSettings({ dismissedSuggestions: dismissed });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  function _getRecentSuggestionIds(childId) {
    const settings  = profiles.getSettings();
    const dismissed = (settings.dismissedSuggestions || {})[childId] || [];

    // Also exclude any shown in the last RECENCY_WEEKS weeks
    const shown     = (settings.shownSuggestions || {})[childId] || [];
    const cutoff    = new Date();
    cutoff.setDate(cutoff.getDate() - RECENCY_WEEKS * 7);

    const recentlyShown = shown
      .filter(s => new Date(s.shownAt) > cutoff)
      .map(s => s.id);

    return [...new Set([...dismissed, ...recentlyShown])];
  }

  function _recordShownSuggestions(childId, suggestionIds) {
    const settings = profiles.getSettings();
    const shown    = settings.shownSuggestions || {};
    shown[childId] = [
      ...(shown[childId] || []),
      ...suggestionIds.map(id => ({ id, shownAt: new Date().toISOString() })),
    ].slice(-100); // keep last 100 entries per child
    profiles.saveSettings({ shownSuggestions: shown });
  }

  function _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Fallback suggestions when suggestions.json is not yet populated
  function _fallbackSuggestions(ageYears) {
    const band = getAgeBand(ageYears);
    return [
      {
        id: 'fallback_1',
        title: 'Tell me about your day',
        description: 'Ask your child to describe their favourite part of today in 3 sentences.',
        category: 'connection',
        eriksonTheme: band.erikson,
        piagetConcept: band.piaget,
      },
      {
        id: 'fallback_2',
        title: 'Drawing time',
        description: 'Give your child paper and crayons and let them draw whatever they want. Ask them to tell you about it afterwards.',
        category: 'creativity',
        eriksonTheme: band.erikson,
        piagetConcept: band.piaget,
      },
      {
        id: 'fallback_3',
        title: 'Help with something real',
        description: 'Find a simple household task your child can genuinely help with — folding, sorting, watering a plant.',
        category: 'responsibility',
        eriksonTheme: band.erikson,
        piagetConcept: band.piaget,
      },
    ];
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    getSuggestions,
    dismissSuggestion,
    getAgeBand,
    AGE_BANDS,
  };

})();

