/**
 * reflection.js — parent self-reflection entries
 *
 * Depends on: storage.js ONLY
 * Reads/writes: parentReflections IndexedDB store ONLY
 *
 * RULES (enforced by architecture):
 *   - This module NEVER imports from logbook.js
 *   - This module NEVER writes to logEntries store
 *   - Entries have NO childId field — they belong to the parent
 *   - No scoring, no ratings, no points — descriptive mood tags only
 */

const reflection = (() => {

  // Descriptive, not evaluative — see ADR-006 and ARCHITECTURE.md §8.3
  const PARENT_MOOD_TAGS = ['patient', 'present', 'reactive', 'distracted', 'tired'];

  // Guided prompts — optional, shown below the text field
  // Rotate weekly: promptIndex = weekOfYear % PROMPTS.length
  const PROMPTS = [
    'What went well today as a parent?',
    'What would you do differently tomorrow?',
    'What did your child need from you today that you found hard to give?',
    'What moment today are you most proud of?',
    'When did you feel most connected to your child today?',
    'What drained your energy today, and how did it affect your parenting?',
    'What is one thing you want to remember about today?',
    'If your child described today, what would they say?',
    'What did you learn about yourself as a parent today?',
    'What would you tell a friend in your parenting situation right now?',
    'What boundary or limit did you hold well today?',
    'What would a calm, rested version of you have done differently today?',
  ];

  // ── Create ─────────────────────────────────────────────────────────────────

  /**
   * Add a new parent reflection entry.
   *
   * @param {string} text       - Free text content
   * @param {string} moodTag    - One of PARENT_MOOD_TAGS
   * @param {string} promptUsed - Which prompt was used (or null)
   * @param {string} date       - ISO date string 'YYYY-MM-DD' (defaults to today)
   * @returns {Promise<{success: boolean, id?: number, error?: string}>}
   */
  async function addReflection(text, moodTag, promptUsed = null, date = null) {
    try {
      if (!text || !text.trim()) throw new Error('Reflection text cannot be empty');
      if (!PARENT_MOOD_TAGS.includes(moodTag)) throw new Error(`Invalid parent mood tag: ${moodTag}`);

      const entry = {
        // NO childId — this entry belongs to the parent, not any child
        text:       text.trim(),
        moodTag,
        promptUsed: promptUsed || null,
        date:       date || _today(),
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      };

      const id = await storage.add(storage.STORES.PARENT_REFLECTIONS, entry);
      return { success: true, id };
    } catch (err) {
      console.error('reflection.addReflection:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  /**
   * Get all parent reflections, sorted newest first.
   *
   * @param {object} filters - Optional: { moodTag, dateFrom, dateTo }
   * @returns {Promise<Array>}
   */
  async function getReflections(filters = {}) {
    try {
      let entries = await storage.getAll(storage.STORES.PARENT_REFLECTIONS);

      if (filters.moodTag)  entries = entries.filter(e => e.moodTag === filters.moodTag);
      if (filters.dateFrom) entries = entries.filter(e => e.date >= filters.dateFrom);
      if (filters.dateTo)   entries = entries.filter(e => e.date <= filters.dateTo);

      return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
      console.error('reflection.getReflections:', err);
      return [];
    }
  }

  /**
   * Get a single reflection by ID.
   *
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async function getReflection(id) {
    try {
      return await storage.get(storage.STORES.PARENT_REFLECTIONS, id);
    } catch (err) {
      console.error('reflection.getReflection:', err);
      return null;
    }
  }

  /**
   * Get the guided prompt for the current week (rotates weekly).
   *
   * @returns {string}
   */
  function getWeeklyPrompt() {
    const now         = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff        = now - startOfYear;
    const weekOfYear  = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    return PROMPTS[weekOfYear % PROMPTS.length];
  }

  /**
   * Get all 3 prompt options to show on the entry screen.
   * Returns the weekly prompt + 2 others, no repeats.
   *
   * @returns {string[]}
   */
  function getPromptOptions() {
    const weekly = getWeeklyPrompt();
    const others = PROMPTS.filter(p => p !== weekly);
    // Pick 2 others based on week number for consistency
    const now        = new Date();
    const weekOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (7 * 24 * 60 * 60 * 1000));
    const opt1 = others[(weekOfYear + 1) % others.length];
    const opt2 = others[(weekOfYear + 2) % others.length];
    return [weekly, opt1, opt2];
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  /**
   * Edit an existing reflection.
   *
   * @param {number} id
   * @param {object} updates - Fields to update (text, moodTag, date)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function editReflection(id, updates) {
    try {
      const existing = await storage.get(storage.STORES.PARENT_REFLECTIONS, id);
      if (!existing) throw new Error(`Reflection ${id} not found`);

      if (updates.moodTag && !PARENT_MOOD_TAGS.includes(updates.moodTag)) {
        throw new Error(`Invalid parent mood tag: ${updates.moodTag}`);
      }

      const updated = {
        ...existing,
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };

      await storage.update(storage.STORES.PARENT_REFLECTIONS, updated);
      return { success: true };
    } catch (err) {
      console.error('reflection.editReflection:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  /**
   * Delete a reflection entry.
   *
   * @param {number} id
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function deleteReflection(id) {
    try {
      await storage.remove(storage.STORES.PARENT_REFLECTIONS, id);
      return { success: true };
    } catch (err) {
      console.error('reflection.deleteReflection:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  function _today() {
    return new Date().toISOString().split('T')[0];
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    addReflection,
    getReflections,
    getReflection,
    getWeeklyPrompt,
    getPromptOptions,
    editReflection,
    deleteReflection,
    PARENT_MOOD_TAGS,
    PROMPTS,
  };

})();

