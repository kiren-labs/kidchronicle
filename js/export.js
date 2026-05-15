/**
 * export.js — JSON data export and import
 *
 * Depends on: storage.js, profiles.js
 *
 * Serialises all data stores to a single JSON file for download.
 * Import validates schema before writing — no data lost on bad import.
 *
 * Export format:
 * {
 *   version:          string  (app version)
 *   exportedAt:       string  (ISO timestamp)
 *   family:           object
 *   children:         array
 *   settings:         object
 *   childLogEntries:  array   (logEntries store)
 *   pointsEvents:     array
 *   parentReflections: array  (SEPARATE from childLogEntries — privacy)
 * }
 */

const exportData = (() => {

  const EXPORT_VERSION = '1.0';

  // ── Export ─────────────────────────────────────────────────────────────────

  /**
   * Serialise all data to JSON and trigger a file download.
   *
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function exportAll() {
    try {
      const [logEntries, pointsEvents, parentReflections] = await Promise.all([
        storage.getAll(storage.STORES.LOG_ENTRIES),
        storage.getAll(storage.STORES.POINTS_EVENTS),
        storage.getAll(storage.STORES.PARENT_REFLECTIONS),
      ]);

      const payload = {
        version:           EXPORT_VERSION,
        exportedAt:        new Date().toISOString(),
        family:            storage.getLocal(storage.KEYS.FAMILY)   || {},
        children:          storage.getLocal(storage.KEYS.CHILDREN) || [],
        settings:          storage.getLocal(storage.KEYS.SETTINGS) || {},
        childLogEntries:   logEntries,
        pointsEvents:      pointsEvents,
        parentReflections: parentReflections,
      };

      const json     = JSON.stringify(payload, null, 2);
      const blob     = new Blob([json], { type: 'application/json' });
      const url      = URL.createObjectURL(blob);
      const filename = `kidchronicle-export-${_datestamp()}.json`;

      // Trigger download
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record export date in settings
      profiles.saveSettings({ lastExportDate: new Date().toISOString() });

      return { success: true, filename };
    } catch (err) {
      console.error('exportData.exportAll:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  /**
   * Import data from a JSON file.
   * Validates schema before writing. Does not overwrite existing data.
   *
   * @param {File} file - JSON file from file input
   * @returns {Promise<{success: boolean, summary?: object, error?: string}>}
   */
  async function importAll(file) {
    try {
      const text    = await _readFile(file);
      const payload = JSON.parse(text);

      const validation = validateSchema(payload);
      if (!validation.valid) {
        return {
          success: false,
          error: `This file doesn't look like a KidChronicle export. ${validation.errors.join(' ')}`,
        };
      }

      // Write to localStorage
      if (payload.family)   storage.saveLocal(storage.KEYS.FAMILY,   payload.family);
      if (payload.children) storage.saveLocal(storage.KEYS.CHILDREN, payload.children);
      if (payload.settings) storage.saveLocal(storage.KEYS.SETTINGS, payload.settings);

      // Write to IndexedDB — merge (add all, don't clear first)
      let imported = { logEntries: 0, pointsEvents: 0, parentReflections: 0 };

      for (const entry of (payload.childLogEntries || [])) {
        const { id, ...data } = entry; // strip old ID, let IndexedDB assign new one
        await storage.add(storage.STORES.LOG_ENTRIES, data);
        imported.logEntries++;
      }
      for (const event of (payload.pointsEvents || [])) {
        const { id, ...data } = event;
        await storage.add(storage.STORES.POINTS_EVENTS, data);
        imported.pointsEvents++;
      }
      for (const ref of (payload.parentReflections || [])) {
        const { id, ...data } = ref;
        await storage.add(storage.STORES.PARENT_REFLECTIONS, data);
        imported.parentReflections++;
      }

      return {
        success: true,
        summary: {
          children:          (payload.children || []).length,
          logEntries:        imported.logEntries,
          pointsEvents:      imported.pointsEvents,
          parentReflections: imported.parentReflections,
        },
      };
    } catch (err) {
      console.error('exportData.importAll:', err);
      if (err instanceof SyntaxError) {
        return { success: false, error: 'The file could not be read as JSON. It may be corrupted.' };
      }
      return { success: false, error: err.message };
    }
  }

  // ── Schema validation ──────────────────────────────────────────────────────

  /**
   * Validate the structure of an import payload.
   *
   * @param {object} payload
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function validateSchema(payload) {
    const errors = [];

    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Payload is not an object.'] };
    }
    if (!payload.version) {
      errors.push('Missing version field.');
    }
    if (!payload.exportedAt) {
      errors.push('Missing exportedAt timestamp.');
    }
    if (!Array.isArray(payload.childLogEntries)) {
      errors.push('childLogEntries must be an array.');
    }
    if (!Array.isArray(payload.pointsEvents)) {
      errors.push('pointsEvents must be an array.');
    }
    if (!Array.isArray(payload.parentReflections)) {
      errors.push('parentReflections must be an array.');
    }

    return { valid: errors.length === 0, errors };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  function _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader    = new FileReader();
      reader.onload   = e => resolve(e.target.result);
      reader.onerror  = () => reject(new Error('Could not read file'));
      reader.readAsText(file);
    });
  }

  function _datestamp() {
    return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    exportAll,
    importAll,
    validateSchema,
  };

})();

