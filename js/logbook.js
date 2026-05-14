/**
 * logbook.js — child log entry management
 *
 * Depends on: storage.js
 * Reads/writes: logEntries IndexedDB store ONLY
 *
 * RULE: This module NEVER imports from or writes to reflection.js
 *       or the parentReflections store.
 */

const logbook = (() => {

  const MOOD_TAGS = ['great', 'good', 'proud', 'ok', 'tired'];

  // ── Create ─────────────────────────────────────────────────────────────────

  /**
   * Add a new child log entry.
   *
   * @param {string} childId   - ID of the child this entry belongs to
   * @param {string} text      - Free text content
   * @param {string} moodTag   - One of MOOD_TAGS
   * @param {string[]} tags    - Optional freetext tags (max 3)
   * @param {string} date      - ISO date string 'YYYY-MM-DD' (defaults to today)
   * @returns {Promise<{success: boolean, id?: number, error?: string}>}
   */
  async function addEntry(childId, text, moodTag, tags = [], date = null) {
    try {
      if (!childId) throw new Error('childId is required');
      if (!text || !text.trim()) throw new Error('Entry text cannot be empty');
      if (!MOOD_TAGS.includes(moodTag)) throw new Error(`Invalid mood tag: ${moodTag}`);

      const entry = {
        childId,
        text:      text.trim(),
        moodTag,
        tags:      (tags || []).slice(0, 3),
        date:      date || _today(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const id = await storage.add(storage.STORES.LOG_ENTRIES, entry);
      return { success: true, id };
    } catch (err) {
      console.error('logbook.addEntry:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  /**
   * Get all entries for a child, sorted newest first.
   *
   * @param {string} childId
   * @param {object} filters - Optional: { moodTag, dateFrom, dateTo, keyword }
   * @returns {Promise<Array>}
   */
  async function getEntries(childId, filters = {}) {
    try {
      let entries = await storage.getByIndex(storage.STORES.LOG_ENTRIES, 'childId', childId);

      if (filters.moodTag)  entries = entries.filter(e => e.moodTag === filters.moodTag);
      if (filters.dateFrom) entries = entries.filter(e => e.date >= filters.dateFrom);
      if (filters.dateTo)   entries = entries.filter(e => e.date <= filters.dateTo);
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        entries = entries.filter(e =>
          e.text.toLowerCase().includes(kw) ||
          (e.tags || []).some(t => t.toLowerCase().includes(kw))
        );
      }

      return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
      console.error('logbook.getEntries:', err);
      return [];
    }
  }

  /**
   * Get recent entries across ALL children for the Home screen.
   *
   * @param {number} limit - How many to return (default 3)
   * @returns {Promise<Array>}
   */
  async function getRecentEntries(limit = 3) {
    try {
      const all = await storage.getAll(storage.STORES.LOG_ENTRIES);
      return all
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (err) {
      console.error('logbook.getRecentEntries:', err);
      return [];
    }
  }

  /**
   * Get a single entry by ID.
   *
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async function getEntry(id) {
    try {
      return await storage.get(storage.STORES.LOG_ENTRIES, id);
    } catch (err) {
      console.error('logbook.getEntry:', err);
      return null;
    }
  }

  /**
   * Count entries for a child.
   *
   * @param {string} childId
   * @returns {Promise<number>}
   */
  async function getEntryCount(childId) {
    try {
      const entries = await storage.getByIndex(storage.STORES.LOG_ENTRIES, 'childId', childId);
      return entries.length;
    } catch (err) {
      return 0;
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  /**
   * Edit an existing entry.
   *
   * @param {number} id      - Entry ID
   * @param {object} updates - Fields to update (text, moodTag, tags, date)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function editEntry(id, updates) {
    try {
      const existing = await storage.get(storage.STORES.LOG_ENTRIES, id);
      if (!existing) throw new Error(`Entry ${id} not found`);

      if (updates.moodTag && !MOOD_TAGS.includes(updates.moodTag)) {
        throw new Error(`Invalid mood tag: ${updates.moodTag}`);
      }

      const updated = {
        ...existing,
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };

      await storage.update(storage.STORES.LOG_ENTRIES, updated);
      return { success: true };
    } catch (err) {
      console.error('logbook.editEntry:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  /**
   * Delete a log entry.
   *
   * @param {number} id
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function deleteEntry(id) {
    try {
      await storage.remove(storage.STORES.LOG_ENTRIES, id);
      return { success: true };
    } catch (err) {
      console.error('logbook.deleteEntry:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  function _today() {
    return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    addEntry,
    getEntries,
    getRecentEntries,
    getEntry,
    getEntryCount,
    editEntry,
    deleteEntry,
    MOOD_TAGS,
  };

})();

