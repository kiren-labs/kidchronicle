/**
 * profiles.js — family and child profile management
 *
 * Depends on: storage.js
 * Reads/writes: localStorage only (kc_family, kc_children)
 *
 * RULE: Age is NEVER stored. Only dateOfBirth is stored.
 *       Always call calcAge(child.dateOfBirth) to get current age.
 */

const profiles = (() => {

  const MAX_CHILDREN   = 5;
  const AVATAR_COLOURS = ['purple', 'teal', 'coral', 'amber', 'blue'];

  // ── Family ─────────────────────────────────────────────────────────────────

  function saveFamily(familyObj) {
    return storage.saveLocal(storage.KEYS.FAMILY, familyObj);
  }

  function getFamily() {
    return storage.getLocal(storage.KEYS.FAMILY);
  }

  function hasFamily() {
    const family = getFamily();
    return !!(family && family.name);
  }

  // ── Children ───────────────────────────────────────────────────────────────

  function saveChildren(childrenArray) {
    return storage.saveLocal(storage.KEYS.CHILDREN, childrenArray);
  }

  function getChildren() {
    const children = storage.getLocal(storage.KEYS.CHILDREN) || [];
    // Enrich each child with computed age — never stored
    return children.map(child => ({
      ...child,
      age: calcAge(child.dateOfBirth),
    }));
  }

  function getChild(childId) {
    const children = getChildren();
    return children.find(c => c.id === childId) || null;
  }

  function addChild(childData) {
    const children = storage.getLocal(storage.KEYS.CHILDREN) || [];
    if (children.length >= MAX_CHILDREN) {
      throw new Error(`Maximum of ${MAX_CHILDREN} children per family.`);
    }
    const newChild = {
      id:          _generateId('child'),
      name:        childData.name.trim(),
      dateOfBirth: childData.dateOfBirth,  // ISO 8601 string: 'YYYY-MM-DD'
      avatarColor: childData.avatarColor || AVATAR_COLOURS[children.length] || 'purple',
      hasSiblings: false,                  // updated after adding more children
      createdAt:   new Date().toISOString(),
    };
    children.push(newChild);
    // Update hasSiblings flag for all children when > 1
    _updateSiblingFlags(children);
    saveChildren(children);
    return newChild;
  }

  function updateChild(childId, updates) {
    const children = storage.getLocal(storage.KEYS.CHILDREN) || [];
    const index = children.findIndex(c => c.id === childId);
    if (index === -1) throw new Error(`Child ${childId} not found.`);
    children[index] = { ...children[index], ...updates, id: childId };
    _updateSiblingFlags(children);
    saveChildren(children);
    return children[index];
  }

  async function deleteChild(childId) {
    // Cascade: remove all associated IndexedDB records
    try {
      const allEntries     = await storage.getByIndex(storage.STORES.LOG_ENTRIES,   'childId', childId);
      const allPoints      = await storage.getByIndex(storage.STORES.POINTS_EVENTS, 'childId', childId);
      for (const e of allEntries) await storage.remove(storage.STORES.LOG_ENTRIES,   e.id);
      for (const p of allPoints)  await storage.remove(storage.STORES.POINTS_EVENTS, p.id);
    } catch (err) {
      console.error('profiles.deleteChild cascade error:', err);
    }
    // Remove from localStorage
    const children = storage.getLocal(storage.KEYS.CHILDREN) || [];
    const updated  = children.filter(c => c.id !== childId);
    _updateSiblingFlags(updated);
    saveChildren(updated);
    return true;
  }

  // ── Age calculation ────────────────────────────────────────────────────────

  /**
   * Compute a child's current age from their date of birth.
   * Age is NEVER stored — always computed fresh at runtime.
   *
   * @param {string} dateOfBirth - ISO date string 'YYYY-MM-DD'
   * @returns {{ years: number, months: number }}
   */
  function calcAge(dateOfBirth) {
    if (!dateOfBirth) return { years: 0, months: 0 };
    const today = new Date();
    const dob   = new Date(dateOfBirth);
    let years   = today.getFullYear() - dob.getFullYear();
    let months  = today.getMonth()    - dob.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months += 12;
    }
    return { years: Math.max(0, years), months: Math.max(0, months) };
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  function getSettings() {
    return storage.getLocal(storage.KEYS.SETTINGS) || _defaultSettings();
  }

  function saveSettings(updates) {
    const current = getSettings();
    return storage.saveLocal(storage.KEYS.SETTINGS, { ...current, ...updates });
  }

  function _defaultSettings() {
    return {
      pointCategories: [
        { id: 'cat_1', label: 'Helped someone',  defaultPoints: 10 },
        { id: 'cat_2', label: 'Kind words',       defaultPoints: 8  },
        { id: 'cat_3', label: 'Homework done',    defaultPoints: 7  },
        { id: 'cat_4', label: 'Tidied their room', defaultPoints: 5 },
        { id: 'cat_5', label: 'Custom',           defaultPoints: 5  },
      ],
      dismissedSuggestions: {},   // { childId: [suggestionId, ...] }
      lastExportDate:        null,
      onboardingComplete:    false,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  function _updateSiblingFlags(children) {
    const hasSiblings = children.length > 1;
    children.forEach(c => { c.hasSiblings = hasSiblings; });
  }

  function _generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // Family
    saveFamily,
    getFamily,
    hasFamily,
    // Children
    saveChildren,
    getChildren,
    getChild,
    addChild,
    updateChild,
    deleteChild,
    // Age
    calcAge,
    // Settings
    getSettings,
    saveSettings,
    // Constants
    MAX_CHILDREN,
    AVATAR_COLOURS,
  };

})();

