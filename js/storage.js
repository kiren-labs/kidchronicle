/**
 * storage.js — KidChronicle storage layer
 *
 * Single source of truth for ALL reads and writes.
 * No other module touches IndexedDB or localStorage directly.
 *
 * IndexedDB stores:
 *   logEntries        — child log entries
 *   pointsEvents      — points award events
 *   parentReflections — parent self-reflection entries
 *
 * localStorage keys (all prefixed kc_):
 *   kc_family    — family profile object
 *   kc_children  — array of child profiles
 *   kc_settings  — app preferences
 *   kc_error_log — last 10 errors (internal)
 */

const storage = (() => {

  // ── Constants ──────────────────────────────────────────────────────────────

  const DB_NAME    = 'kidchronicle';
  const DB_VERSION = 1;

  const STORES = {
    LOG_ENTRIES:        'logEntries',
    POINTS_EVENTS:      'pointsEvents',
    PARENT_REFLECTIONS: 'parentReflections',
  };

  const KEYS = {
    FAMILY:    'kc_family',
    CHILDREN:  'kc_children',
    SETTINGS:  'kc_settings',
    ERROR_LOG: 'kc_error_log',
  };

  // ── Database init ──────────────────────────────────────────────────────────

  let _db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        if (oldVersion < 1) {
          // logEntries — indexed by childId and date
          const logStore = db.createObjectStore(STORES.LOG_ENTRIES, {
            autoIncrement: true, keyPath: 'id'
          });
          logStore.createIndex('childId', 'childId', { unique: false });
          logStore.createIndex('date',    'date',    { unique: false });
          logStore.createIndex('childId_date', ['childId', 'date'], { unique: false });

          // pointsEvents — indexed by childId and date
          const ptsStore = db.createObjectStore(STORES.POINTS_EVENTS, {
            autoIncrement: true, keyPath: 'id'
          });
          ptsStore.createIndex('childId', 'childId', { unique: false });
          ptsStore.createIndex('date',    'date',    { unique: false });

          // parentReflections — indexed by date only (no childId)
          const refStore = db.createObjectStore(STORES.PARENT_REFLECTIONS, {
            autoIncrement: true, keyPath: 'id'
          });
          refStore.createIndex('date', 'date', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        _db = event.target.result;
        resolve(_db);
      };

      request.onerror = (event) => {
        _logError('openDB', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // ── IndexedDB CRUD ─────────────────────────────────────────────────────────

  async function add(storeName, data) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readwrite');
        const store   = tx.objectStore(storeName);
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result); // returns new id
        request.onerror   = () => { _logError('add:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('add:' + storeName, err);
      throw err;
    }
  }

  async function get(storeName, id) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readonly');
        const store   = tx.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror   = () => { _logError('get:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('get:' + storeName, err);
      throw err;
    }
  }

  async function getAll(storeName) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readonly');
        const store   = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror   = () => { _logError('getAll:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('getAll:' + storeName, err);
      throw err;
    }
  }

  async function getByIndex(storeName, indexName, value) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readonly');
        const store   = tx.objectStore(storeName);
        const index   = store.index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror   = () => { _logError('getByIndex:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('getByIndex:' + storeName, err);
      throw err;
    }
  }

  async function countByIndex(storeName, indexName, value) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readonly');
        const store   = tx.objectStore(storeName);
        const index   = store.index(indexName);
        const request = index.count(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror   = () => { _logError('countByIndex:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('countByIndex:' + storeName, err);
      throw err;
    }
  }

  async function update(storeName, data) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readwrite');
        const store   = tx.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror   = () => { _logError('update:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('update:' + storeName, err);
      throw err;
    }
  }

  async function remove(storeName, id) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readwrite');
        const store   = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror   = () => { _logError('remove:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('remove:' + storeName, err);
      throw err;
    }
  }

  async function clearStore(storeName) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, 'readwrite');
        const store   = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror   = () => { _logError('clearStore:' + storeName, request.error); reject(request.error); };
      });
    } catch (err) {
      _logError('clearStore:' + storeName, err);
      throw err;
    }
  }

  // ── localStorage helpers ───────────────────────────────────────────────────

  function saveLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      _logError('saveLocal:' + key, err);
      return false;
    }
  }

  function getLocal(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      _logError('getLocal:' + key, err);
      return null;
    }
  }

  function removeLocal(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      _logError('removeLocal:' + key, err);
      return false;
    }
  }

  // ── Error logging ──────────────────────────────────────────────────────────

  function _logError(context, err) {
    try {
      const log = JSON.parse(localStorage.getItem(KEYS.ERROR_LOG) || '[]');
      log.unshift({
        context,
        message: err ? (err.message || String(err)) : 'Unknown error',
        time: Date.now(),
      });
      localStorage.setItem(KEYS.ERROR_LOG, JSON.stringify(log.slice(0, 10)));
    } catch (_) {
      // If error logging itself fails, silently ignore — don't recurse
    }
  }

  function getErrorLog() {
    return JSON.parse(localStorage.getItem(KEYS.ERROR_LOG) || '[]');
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // IndexedDB
    openDB,
    add,
    get,
    getAll,
    getByIndex,
    countByIndex,
    update,
    remove,
    clearStore,
    // localStorage
    saveLocal,
    getLocal,
    removeLocal,
    // Debug
    getErrorLog,
    // Constants (exposed so modules can reference without hard-coding)
    STORES,
    KEYS,
  };

})();

