/**
 * points.js — points awards, totals, streaks, and badges
 *
 * Depends on: storage.js, profiles.js
 * Reads/writes: pointsEvents IndexedDB store
 *               kc_settings localStorage (for categories)
 *
 * RULE: Running totals are NEVER stored as fields.
 *       getTotalPoints() always computes from events at read time.
 */

const points = (() => {

  // Badge thresholds
  const BADGES = [
    { id: 'first_entry',  label: 'First entry!',     icon: 'ti-star',        threshold: null,  type: 'entry_count',  value: 1   },
    { id: 'pts_50',       label: '50 points',         icon: 'ti-award',       threshold: 50,    type: 'total_points', value: 50  },
    { id: 'pts_100',      label: '100 points',        icon: 'ti-trophy',      threshold: 100,   type: 'total_points', value: 100 },
    { id: 'pts_250',      label: '250 points',        icon: 'ti-medal',       threshold: 250,   type: 'total_points', value: 250 },
    { id: 'streak_7',     label: '7-day streak',      icon: 'ti-flame',       threshold: 7,     type: 'streak',       value: 7   },
  ];

  // ── Award points ───────────────────────────────────────────────────────────

  /**
   * Award points to a child for a named deed.
   * Points are additive only — no deductions in v1 (see ADR-005).
   *
   * @param {string} childId    - Child receiving the points
   * @param {string} categoryId - Category ID from settings.pointCategories
   * @param {string} label      - Display label for this deed
   * @param {number} pts        - Number of points to award (must be > 0)
   * @param {string} date       - ISO date string (defaults to today)
   * @returns {Promise<{success: boolean, id?: number, error?: string}>}
   */
  async function awardPoints(childId, categoryId, label, pts, date = null) {
    try {
      if (!childId)      throw new Error('childId is required');
      if (!label)        throw new Error('label is required');
      if (pts <= 0)      throw new Error('Points must be greater than zero');
      if (!Number.isInteger(pts)) throw new Error('Points must be a whole number');

      const event = {
        childId,
        categoryId: categoryId || 'cat_custom',
        label:      label.trim(),
        points:     pts,
        date:       date || _today(),
        awardedAt:  new Date().toISOString(),
      };

      const id = await storage.add(storage.STORES.POINTS_EVENTS, event);
      return { success: true, id };
    } catch (err) {
      console.error('points.awardPoints:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Read totals ────────────────────────────────────────────────────────────

  /**
   * Get total points for a child.
   * Computed at read time — NEVER stored as a field.
   *
   * @param {string} childId
   * @returns {Promise<number>}
   */
  async function getTotalPoints(childId) {
    try {
      const events = await storage.getByIndex(storage.STORES.POINTS_EVENTS, 'childId', childId);
      return events.reduce((sum, e) => sum + (e.points || 0), 0);
    } catch (err) {
      console.error('points.getTotalPoints:', err);
      return 0;
    }
  }

  /**
   * Get all points events for a child, sorted newest first.
   *
   * @param {string} childId
   * @returns {Promise<Array>}
   */
  async function getPointsEvents(childId) {
    try {
      const events = await storage.getByIndex(storage.STORES.POINTS_EVENTS, 'childId', childId);
      return events.sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));
    } catch (err) {
      console.error('points.getPointsEvents:', err);
      return [];
    }
  }

  /**
   * Get weekly point totals for chart rendering.
   * Returns array of { weekLabel, total } for the last N weeks.
   *
   * @param {string} childId
   * @param {number} weeks - How many weeks to include (default 8)
   * @returns {Promise<Array<{weekLabel: string, total: number}>>}
   */
  async function getPointsHistory(childId, weeks = 8) {
    try {
      const events = await storage.getByIndex(storage.STORES.POINTS_EVENTS, 'childId', childId);
      const result = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = _weekStart(i);
        const weekEnd   = _weekEnd(i);
        const total     = events
          .filter(e => e.date >= weekStart && e.date <= weekEnd)
          .reduce((sum, e) => sum + (e.points || 0), 0);
        result.push({
          weekLabel: i === 0 ? 'This week' : `${i}w ago`,
          total,
        });
      }

      return result;
    } catch (err) {
      console.error('points.getPointsHistory:', err);
      return [];
    }
  }

  // ── Streak ─────────────────────────────────────────────────────────────────

  /**
   * Count consecutive days with at least one log entry OR points event.
   * Streak breaks if a day has neither.
   *
   * @param {string} childId
   * @returns {Promise<number>}
   */
  async function getStreakCount(childId) {
    try {
      const [entries, pointEvents] = await Promise.all([
        storage.getByIndex(storage.STORES.LOG_ENTRIES,   'childId', childId),
        storage.getByIndex(storage.STORES.POINTS_EVENTS, 'childId', childId),
      ]);

      // Build a set of all dates with activity
      const activeDates = new Set([
        ...entries.map(e => e.date),
        ...pointEvents.map(e => e.date),
      ]);

      if (activeDates.size === 0) return 0;

      let streak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (err) {
      console.error('points.getStreakCount:', err);
      return 0;
    }
  }

  // ── Badges ─────────────────────────────────────────────────────────────────

  /**
   * Get all earned badges for a child.
   *
   * @param {string} childId
   * @returns {Promise<Array>} - Array of earned badge objects
   */
  async function getEarnedBadges(childId) {
    try {
      const [total, streak, entryCount] = await Promise.all([
        getTotalPoints(childId),
        getStreakCount(childId),
        _getLogEntryCount(childId),
      ]);

      return BADGES.filter(badge => {
        if (badge.type === 'total_points') return total >= badge.value;
        if (badge.type === 'streak')       return streak >= badge.value;
        if (badge.type === 'entry_count')  return entryCount >= badge.value;
        return false;
      });
    } catch (err) {
      console.error('points.getEarnedBadges:', err);
      return [];
    }
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  function getCategories() {
    const settings = profiles.getSettings();
    return settings.pointCategories || [];
  }

  function saveCategories(categories) {
    return profiles.saveSettings({ pointCategories: categories });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function deletePointsEvent(id) {
    try {
      await storage.remove(storage.STORES.POINTS_EVENTS, id);
      return { success: true };
    } catch (err) {
      console.error('points.deletePointsEvent:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  function _today() {
    return new Date().toISOString().split('T')[0];
  }

  function _weekStart(weeksAgo) {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() - weeksAgo * 7); // Sunday
    return d.toISOString().split('T')[0];
  }

  function _weekEnd(weeksAgo) {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() - weeksAgo * 7 + 6); // Saturday
    return d.toISOString().split('T')[0];
  }

  async function _getLogEntryCount(childId) {
    try {
      const entries = await storage.getByIndex(storage.STORES.LOG_ENTRIES, 'childId', childId);
      return entries.length;
    } catch (_) {
      return 0;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    awardPoints,
    getTotalPoints,
    getPointsEvents,
    getPointsHistory,
    getStreakCount,
    getEarnedBadges,
    getCategories,
    saveCategories,
    deletePointsEvent,
    BADGES,
  };

})();

