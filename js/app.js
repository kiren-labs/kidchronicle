/**
 * app.js — KidChronicle router and app initialisation
 *
 * Depends on: all other modules (loaded before this via <script> tags)
 *
 * Responsibilities:
 *   - Detect first launch vs returning user
 *   - Route between screens
 *   - Register service worker
 *   - Wire up global UI events (nav, FAB, toasts)
 *   - Child management: add, edit, delete
 */

(async () => {

  // ── Service worker registration ────────────────────────────────────────────

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Update available — reload to get the latest version.', 'success', 5000);
            }
          });
        });
      })
      .catch(err => console.warn('SW registration failed:', err));
  }

  // ── Screen references ──────────────────────────────────────────────────────

  const screens = {
    onboarding:   document.getElementById('screen-onboarding'),
    home:         document.getElementById('screen-home'),
    logEntry:     document.getElementById('screen-log-entry'),
    profile:      document.getElementById('screen-profile'),
    history:      document.getElementById('screen-history'),
    childForm:    document.getElementById('screen-child-form'),
  };

  const fab = document.getElementById('fab');

  // ── Router ─────────────────────────────────────────────────────────────────

  let _currentScreen = null;
  let _activeChildId = null;

  function showScreen(screenId, options = {}) {
    Object.values(screens).forEach(s => { if (s) s.classList.remove('active'); });
    const screen = screens[screenId];
    if (!screen) { console.error('Unknown screen:', screenId); return; }
    screen.classList.add('active');
    _currentScreen = screenId;

    // FAB visibility — shown on Home and History only
    const fabScreens = ['home', 'history'];
    fab.classList.toggle('hidden', !fabScreens.includes(screenId));

    // Nav highlighting
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenId);
    });

    // Render screen content
    if (screenId === 'home')                              renderHome();
    if (screenId === 'profile' && options.childId)        renderProfile(options.childId);
    if (screenId === 'history')                           renderHistory();
    if (screenId === 'logEntry')                          renderLogEntry(options);
    if (screenId === 'childForm')                         renderChildForm(options);
  }

  // ── First launch detection ─────────────────────────────────────────────────

  async function init() {
    await storage.openDB();
    if (!profiles.hasFamily()) {
      showOnboarding();
    } else {
      showScreen('home');
    }
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────

  let _onboardStep   = 1;
  let _onboardFamily = {};
  let _onboardChild  = { avatarColor: 'purple' };

  function showOnboarding() {
    showScreen('onboarding');
    renderOnboardStep(1);
  }

  function renderOnboardStep(step) {
    _onboardStep = step;
    const container = document.getElementById('onboard-content');

    if (step === 1) {
      container.innerHTML = `
        <div class="onboard-hero">
          <p class="display" style="font-size:28px;margin-bottom:6px">KidChronicle</p>
          <p class="display-italic" style="font-size:15px;color:var(--color-muted)">your child's story, one day at a time</p>
        </div>
        <div class="onboard-step">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--color-muted);margin-bottom:6px">Step 1 of 3</p>
          <p class="display" style="font-size:20px;margin-bottom:16px">What's your family name?</p>
          <input class="input-field" id="family-name-input" type="text"
            placeholder="e.g. The Johnsons" autocapitalize="words" autocomplete="off"
            value="${_onboardFamily.name || ''}" />
          <div style="height:20px"></div>
          <button class="btn-primary" id="onboard-next-1">Continue →</button>
        </div>
        <div class="onboard-dots">
          <div class="onboard-dot active"></div>
          <div class="onboard-dot"></div>
          <div class="onboard-dot"></div>
        </div>`;

      document.getElementById('onboard-next-1').addEventListener('click', () => {
        const name = document.getElementById('family-name-input').value.trim();
        if (!name) { showToast('Please enter your family name.', 'error'); return; }
        _onboardFamily.name = name;
        renderOnboardStep(2);
      });
    }

    else if (step === 2) {
      container.innerHTML = `
        <div class="onboard-hero" style="padding-top:32px">
          <p class="display" style="font-size:20px;margin-bottom:4px">Add your first child</p>
          <p style="font-size:13px;color:var(--color-muted)">You can add more after setup.</p>
        </div>
        <div class="onboard-step">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--color-muted);margin-bottom:6px">Step 2 of 3</p>
          ${_renderChildFormFields(_onboardChild)}
          <div style="height:20px"></div>
          <button class="btn-primary" id="onboard-next-2">Continue →</button>
        </div>
        <div class="onboard-dots">
          <div class="onboard-dot"></div>
          <div class="onboard-dot active"></div>
          <div class="onboard-dot"></div>
        </div>`;

      _wireColourPicker(colour => { _onboardChild.avatarColor = colour; });

      document.getElementById('onboard-next-2').addEventListener('click', () => {
        const name = document.getElementById('child-name-input').value.trim();
        const dob  = document.getElementById('child-dob-input').value;
        if (!name) { showToast("Please enter your child's name.", 'error'); return; }
        if (!dob)  { showToast('Please enter a date of birth.', 'error'); return; }
        _onboardChild.name        = name;
        _onboardChild.dateOfBirth = dob;
        renderOnboardStep(3);
      });
    }

    else if (step === 3) {
      profiles.saveFamily({ name: _onboardFamily.name, createdAt: new Date().toISOString() });
      profiles.addChild(_onboardChild);
      profiles.saveSettings({ onboardingComplete: true });

      const colour = _onboardChild.avatarColor;
      container.innerHTML = `
        <div class="onboard-hero" style="padding-top:48px">
          <div style="width:64px;height:64px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px"
               class="avatar-${colour}">🌟</div>
          <p class="display" style="font-size:22px;margin-bottom:8px">Welcome!</p>
          <p style="font-size:14px;color:var(--color-muted);line-height:1.6">
            ${_esc(_onboardFamily.name)} is all set.<br>
            Tap below to write your first entry for ${_esc(_onboardChild.name)}.
          </p>
        </div>
        <div class="onboard-step">
          <div class="onboard-dots" style="margin-bottom:24px">
            <div class="onboard-dot"></div>
            <div class="onboard-dot"></div>
            <div class="onboard-dot active"></div>
          </div>
          <button class="btn-primary" id="onboard-done">Start logging →</button>
        </div>`;

      document.getElementById('onboard-done').addEventListener('click', () => showScreen('home'));
    }
  }

  // ── Child form — shared for ADD and EDIT ───────────────────────────────────

  /**
   * Renders the Add / Edit child screen.
   * options.childId = existing child to edit (omit for add)
   * options.returnTo = screen to go back to after save (default: 'home')
   */
  function renderChildForm(options = {}) {
    const existingChild = options.childId ? profiles.getChild(options.childId) : null;
    const isEdit        = !!existingChild;
    const returnTo      = options.returnTo || 'home';
    const formEl        = document.getElementById('child-form-content');

    document.getElementById('child-form-title').textContent = isEdit ? 'Edit child' : 'Add child';

    formEl.innerHTML = `
      ${_renderChildFormFields(existingChild || { avatarColor: 'purple' })}

      ${isEdit ? `
      <div style="padding:0 16px;margin-top:8px">
        <button class="btn-primary" id="save-child-btn">Save changes</button>
      </div>
      <div style="padding:10px 16px 8px">
        <button id="delete-child-btn" style="width:100%;padding:12px;border-radius:var(--radius-md);border:0.5px solid var(--color-border);background:white;color:var(--color-red-tx);font-family:var(--font-body);font-size:14px;font-weight:500;">
          Delete ${_esc(existingChild.name)}'s profile
        </button>
      </div>` : `
      <div style="padding:0 16px 8px;margin-top:8px">
        <button class="btn-primary" id="save-child-btn">Add child</button>
      </div>`}`;

    // Wire colour picker
    let selectedColour = existingChild ? existingChild.avatarColor : 'purple';
    _wireColourPicker(colour => { selectedColour = colour; });

    // Save / update
    document.getElementById('save-child-btn').addEventListener('click', async () => {
      const name = document.getElementById('child-name-input').value.trim();
      const dob  = document.getElementById('child-dob-input').value;
      const nick = document.getElementById('child-nick-input')?.value.trim() || '';
      const note = document.getElementById('child-note-input')?.value.trim() || '';

      if (!name) { showToast("Please enter the child's name.", 'error'); return; }
      if (!dob)  { showToast('Please enter a date of birth.',  'error'); return; }

      const childData = { name, dateOfBirth: dob, avatarColor: selectedColour, nickname: nick, note };

      try {
        if (isEdit) {
          profiles.updateChild(options.childId, childData);
          showToast(`${name} updated.`, 'success');
        } else {
          profiles.addChild(childData);
          showToast(`${name} added to your family.`, 'success');
        }
        setTimeout(() => showScreen(returnTo, returnTo === 'profile' ? { childId: options.childId } : {}), 300);
      } catch (err) {
        showToast(err.message || 'Could not save.', 'error');
      }
    });

    // Delete (edit mode only)
    if (isEdit) {
      document.getElementById('delete-child-btn').addEventListener('click', () => {
        showConfirm(
          `Delete ${existingChild.name}'s profile?`,
          `This will permanently remove all log entries, points, and data for ${existingChild.name}. This cannot be undone.`,
          'Delete',
          async () => {
            await profiles.deleteChild(options.childId);
            showToast(`${existingChild.name}'s profile deleted.`, 'success');
            showScreen('home');
          }
        );
      });
    }

    // Back button
    document.getElementById('child-form-back').onclick = () =>
      showScreen(returnTo, returnTo === 'profile' ? { childId: options.childId } : {});
  }

  // ── Shared child form fields ───────────────────────────────────────────────

  function _renderChildFormFields(child = {}) {
    const colours = profiles.AVATAR_COLOURS;
    const selectedColour = child.avatarColor || 'purple';
    return `
      <div class="form-section">
        <div class="form-label">Name *</div>
        <input class="input-field" id="child-name-input" type="text"
          placeholder="e.g. Layla" autocapitalize="words"
          value="${_esc(child.name || '')}" />
      </div>
      <div class="form-section">
        <div class="form-label">Nickname (optional)</div>
        <input class="input-field" id="child-nick-input" type="text"
          placeholder="e.g. Lay-Lay"
          value="${_esc(child.nickname || '')}" />
      </div>
      <div class="form-section">
        <div class="form-label">Date of birth *</div>
        <input class="input-field" id="child-dob-input" type="date"
          max="${new Date().toISOString().split('T')[0]}"
          value="${_esc(child.dateOfBirth || '')}" />
      </div>
      <div class="form-section">
        <div class="form-label">Profile colour</div>
        <div class="colour-picker">
          ${colours.map(c => `
            <div class="colour-swatch avatar-${c} ${selectedColour === c ? 'selected' : ''}"
                 data-colour="${c}" aria-label="${c} colour" role="button" tabindex="0"
                 style="width:32px;height:32px;"></div>
          `).join('')}
        </div>
      </div>
      <div class="form-section">
        <div class="form-label">Notes (optional)</div>
        <textarea class="input-field" id="child-note-input" rows="2"
          placeholder="Allergies, school, anything useful…">${_esc(child.note || '')}</textarea>
      </div>`;
  }

  function _wireColourPicker(onChange) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      document.querySelectorAll('.colour-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          document.querySelectorAll('.colour-swatch').forEach(s => s.classList.remove('selected'));
          swatch.classList.add('selected');
          onChange(swatch.dataset.colour);
        });
      });
    }, 50);
  }

  // ── Home screen ────────────────────────────────────────────────────────────

  async function renderHome() {
    const family   = profiles.getFamily();
    const children = profiles.getChildren();

    // Greeting
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('home-greeting').textContent =
      `"${greeting}, ${family ? _esc(family.name) : 'family'}"`;

    // Child cards
    const cardRow = document.getElementById('child-card-row');
    const cardHtml = await Promise.all(children.map(async child => {
      const total  = await points.getTotalPoints(child.id);
      const streak = await points.getStreakCount(child.id);
      return `
        <div class="child-card avatar-${child.avatarColor}" data-child-id="${child.id}"
             role="button" tabindex="0" aria-label="View ${_esc(child.name)}'s profile">
          <div class="avatar">
            <i class="ti ti-heart" aria-hidden="true"></i>
          </div>
          <div class="child-name">${_esc(child.nickname || child.name)}</div>
          <div class="child-pts">${total} pts</div>
          ${streak > 0 ? `<div class="child-streak">🔥 ${streak} day${streak !== 1 ? 's' : ''}</div>` : ''}
        </div>`;
    }));

    // Add child button (shown when < MAX_CHILDREN)
    const addBtn = children.length < profiles.MAX_CHILDREN ? `
      <div class="child-card" style="background:var(--color-surface);border:1.5px dashed var(--color-mid);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;"
           id="add-child-card" role="button" tabindex="0" aria-label="Add a child">
        <i class="ti ti-plus" style="font-size:22px;color:var(--color-muted)" aria-hidden="true"></i>
        <span style="font-size:11px;color:var(--color-muted)">Add child</span>
      </div>` : '';

    if (children.length === 0) {
      cardRow.innerHTML = `
        <div style="padding:8px 0">
          <div class="empty-state" style="padding:16px 0">
            <div class="empty-state__icon"><i class="ti ti-users" aria-hidden="true"></i></div>
            <p class="empty-state__desc" style="margin-bottom:12px">No children added yet.</p>
          </div>
        </div>
        ${addBtn}`;
    } else {
      cardRow.innerHTML = cardHtml.join('') + addBtn;
    }

    // Wire child card taps → profile screen
    cardRow.querySelectorAll('[data-child-id]').forEach(card => {
      card.addEventListener('click', () => showScreen('profile', { childId: card.dataset.childId }));
    });

    // Wire add child card
    const addCard = document.getElementById('add-child-card');
    if (addCard) {
      addCard.addEventListener('click', () => showScreen('childForm'));
    }

    // Recent logs
    const logList = document.getElementById('recent-log-list');
    const recent  = await logbook.getRecentEntries(3);

    if (recent.length === 0) {
      logList.innerHTML = `
        <div style="padding:16px;text-align:center;color:var(--color-muted);font-size:13px">
          No entries yet — tap <strong>+</strong> to write your first entry.
        </div>`;
    } else {
      logList.innerHTML = recent.map(entry => {
        const child = profiles.getChild(entry.childId);
        return _buildEntryCard(entry, child);
      }).join('');
    }
  }

  // ── Child profile screen ───────────────────────────────────────────────────

  async function renderProfile(childId) {
    _activeChildId = childId;
    const child    = profiles.getChild(childId);
    if (!child) { showScreen('home'); return; }

    const [total, streak, entryCount, badges, suggestions] = await Promise.all([
      points.getTotalPoints(childId),
      points.getStreakCount(childId),
      logbook.getEntryCount(childId),
      points.getEarnedBadges(childId),
      psychology.getSuggestions(child.age.years, child.hasSiblings, childId),
    ]);

    const profileEl = document.getElementById('profile-content');
    profileEl.innerHTML = `
      <div style="padding:16px">
        <!-- Header row: back + edit -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn-back" id="profile-back" aria-label="Back to home">
              <i class="ti ti-arrow-left" aria-hidden="true"></i>
            </button>
            <span style="font-size:12px;color:var(--color-muted)">Back</span>
          </div>
          <button id="edit-child-btn"
            style="display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:var(--radius-full);border:0.5px solid var(--color-border);background:white;font-size:12px;color:var(--color-ink);"
            aria-label="Edit ${_esc(child.name)}'s profile">
            <i class="ti ti-pencil" style="font-size:14px" aria-hidden="true"></i> Edit
          </button>
        </div>

        <!-- Avatar + name + details -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:4px">
          <div style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0"
               class="avatar-${child.avatarColor}">
            <i class="ti ti-heart" aria-hidden="true"></i>
          </div>
          <div>
            <p class="display" style="font-size:22px">${_esc(child.name)}</p>
            ${child.nickname ? `<p style="font-size:12px;color:var(--color-muted)">"${_esc(child.nickname)}"</p>` : ''}
            <p style="font-size:12px;color:var(--color-muted);margin-top:2px">
              Age ${child.age.years}${child.age.months > 0 && child.age.years < 3 ? ` & ${child.age.months}mo` : ''}
              ${child.hasSiblings ? ' · has siblings' : ''}
            </p>
          </div>
        </div>

        ${child.note ? `
        <div style="background:var(--color-surface);border-radius:var(--radius-sm);padding:8px 12px;margin:10px 0;font-size:12px;color:var(--color-muted)">
          ${_esc(child.note)}
        </div>` : ''}

        <!-- Stats -->
        <div style="display:flex;gap:8px;margin:14px 0">
          <div class="stat-box"><div class="stat-value">${total}</div><div class="stat-label">Points</div></div>
          <div class="stat-box"><div class="stat-value">${entryCount}</div><div class="stat-label">Logs</div></div>
          <div class="stat-box"><div class="stat-value">${streak > 0 ? '🔥 ' + streak : '—'}</div><div class="stat-label">Streak</div></div>
        </div>

        <!-- Points chart -->
        <div style="background:white;border:0.5px solid var(--color-border);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px">
          <div class="form-label" style="padding:0;margin-bottom:8px">Points — last 8 weeks</div>
          <canvas id="points-chart" style="width:100%;height:64px" aria-label="Points chart for ${_esc(child.name)}"></canvas>
        </div>

        ${badges.length > 0 ? `
        <div style="margin-bottom:14px">
          <div class="section-label" style="padding:0;margin-bottom:8px">Badges earned</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${badges.map(b => `
              <div style="display:flex;align-items:center;gap:5px;background:var(--color-surface);border-radius:var(--radius-full);padding:4px 10px;font-size:12px">
                <i class="ti ${b.icon}" aria-hidden="true"></i> ${_esc(b.label)}
              </div>`).join('')}
          </div>
        </div>` : ''}

        ${suggestions.length > 0 ? `
        <div class="section-label" style="padding:0;margin-bottom:8px">This week's activity idea</div>
        <div class="suggestion-card">
          <div class="suggestion-card__label">Age ${child.age.years} · ${_esc(suggestions[0].category || 'activity')}</div>
          <div class="suggestion-card__title">${_esc(suggestions[0].title)}</div>
          <div class="suggestion-card__desc">${_esc(suggestions[0].description)}</div>
        </div>` : ''}

        <!-- Log entry for this child shortcut -->
        <div style="margin-top:16px">
          <button class="btn-primary" id="log-for-child-btn">
            + Write today's entry for ${_esc(child.nickname || child.name)}
          </button>
        </div>
      </div>`;

    document.getElementById('profile-back').addEventListener('click', () => showScreen('home'));

    document.getElementById('edit-child-btn').addEventListener('click', () =>
      showScreen('childForm', { childId, returnTo: 'profile' })
    );

    document.getElementById('log-for-child-btn').addEventListener('click', () =>
      showScreen('logEntry', { childId })
    );

    requestAnimationFrame(() => {
      const canvas = document.getElementById('points-chart');
      if (canvas) charts.renderPointsChart(childId, canvas);
    });
  }

  // ── Log entry screen ───────────────────────────────────────────────────────

  let _logMode         = 'child';
  let _selectedChildId = null;
  let _selectedMood    = null;
  let _selectedDeed    = null;

  function renderLogEntry(options = {}) {
    _logMode         = 'child';
    _selectedChildId = options.childId || null;
    _selectedMood    = null;
    _selectedDeed    = null;

    const children = profiles.getChildren();
    if (!_selectedChildId && children.length > 0) _selectedChildId = children[0].id;

    const logEl = document.getElementById('log-entry-content');
    logEl.innerHTML = `
      <div class="entry-toggle" id="entry-toggle" style="margin-top:4px">
        <button class="entry-toggle__btn active" data-mode="child" aria-pressed="true">About my child</button>
        <button class="entry-toggle__btn" data-mode="parent" aria-pressed="false">About myself</button>
      </div>

      <div id="child-selector-row" class="chip-scroll" style="padding-bottom:12px">
        ${children.map(c => `
          <button class="chip ${_selectedChildId === c.id ? 'active' : ''}"
                  data-child-id="${c.id}" aria-pressed="${_selectedChildId === c.id}">
            ${_esc(c.nickname || c.name)}
          </button>`).join('')}
      </div>

      <div class="form-section">
        <div class="form-label" id="text-label">What happened today?</div>
        <textarea class="input-field" id="log-text" rows="4" placeholder="Write what happened…"></textarea>
      </div>

      <div class="form-section">
        <div class="form-label" id="mood-label">How was the mood?</div>
        <div class="chip-scroll" id="mood-chips">${_renderMoodChips(logbook.MOOD_TAGS, null)}</div>
      </div>

      <div id="deed-or-prompts">${_renderDeedChips()}</div>

      <div class="form-section">
        <div class="form-label">Date</div>
        <input class="input-field" id="log-date" type="date"
          value="${new Date().toISOString().split('T')[0]}"
          max="${new Date().toISOString().split('T')[0]}" />
      </div>

      <div style="padding:0 16px 8px">
        <button class="btn-primary" id="save-entry-btn">Save entry</button>
      </div>`;

    document.getElementById('entry-toggle').addEventListener('click', e => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      _logMode = btn.dataset.mode;
      _switchLogMode(_logMode);
    });

    document.getElementById('child-selector-row').addEventListener('click', e => {
      const btn = e.target.closest('[data-child-id]');
      if (!btn) return;
      _selectedChildId = btn.dataset.childId;
      document.querySelectorAll('#child-selector-row .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.childId === _selectedChildId);
        c.setAttribute('aria-pressed', c.dataset.childId === _selectedChildId);
      });
    });

    document.getElementById('mood-chips').addEventListener('click', e => {
      const btn = e.target.closest('[data-mood]');
      if (!btn) return;
      _selectedMood = btn.dataset.mood;
      document.querySelectorAll('#mood-chips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.mood === _selectedMood);
        c.setAttribute('aria-pressed', c.dataset.mood === _selectedMood);
      });
    });

    document.getElementById('deed-or-prompts').addEventListener('click', e => {
      const btn = e.target.closest('[data-deed-id]');
      if (!btn) return;
      _selectedDeed = _selectedDeed && _selectedDeed.id === btn.dataset.deedId
        ? null
        : { id: btn.dataset.deedId, label: btn.dataset.deedLabel, points: parseInt(btn.dataset.deedPts, 10) };
      document.querySelectorAll('[data-deed-id]').forEach(c => {
        const sel = _selectedDeed && c.dataset.deedId === _selectedDeed.id;
        c.classList.toggle('active', sel);
        c.setAttribute('aria-pressed', sel);
      });
    });

    document.getElementById('save-entry-btn').addEventListener('click', _saveEntry);
  }

  function _switchLogMode(mode) {
    document.querySelectorAll('.entry-toggle__btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
      btn.setAttribute('aria-pressed', btn.dataset.mode === mode);
    });

    const childSelector = document.getElementById('child-selector-row');
    const moodChips     = document.getElementById('mood-chips');
    const deedOrPrompts = document.getElementById('deed-or-prompts');
    const saveBtn       = document.getElementById('save-entry-btn');

    if (mode === 'parent') {
      childSelector.style.display = 'none';
      document.getElementById('text-label').textContent  = 'How did you show up as a parent today?';
      document.getElementById('mood-label').textContent  = 'How were you?';
      saveBtn.textContent  = 'Save reflection';
      _selectedMood = null;
      moodChips.innerHTML = _renderMoodChips(reflection.PARENT_MOOD_TAGS, null);
      moodChips.addEventListener('click', e => {
        const btn = e.target.closest('[data-mood]');
        if (!btn) return;
        _selectedMood = btn.dataset.mood;
        document.querySelectorAll('#mood-chips .chip').forEach(c =>
          c.classList.toggle('active', c.dataset.mood === _selectedMood));
      });
      const prompts = reflection.getPromptOptions();
      deedOrPrompts.innerHTML = `
        <div class="form-section">
          <div class="form-label">Prompts (optional — tap to use)</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${prompts.map(p => `
              <button class="chip" data-prompt="${_esc(p)}"
                style="text-align:left;white-space:normal;height:auto;padding:8px 12px;">
                ${_esc(p)}
              </button>`).join('')}
          </div>
        </div>`;
      deedOrPrompts.querySelectorAll('[data-prompt]').forEach(btn => {
        btn.addEventListener('click', () => {
          const ta = document.getElementById('log-text');
          if (ta.value && !ta.value.endsWith(' ')) ta.value += ' ';
          ta.value += btn.dataset.prompt;
          ta.focus();
        });
      });
    } else {
      childSelector.style.display = '';
      document.getElementById('text-label').textContent = 'What happened today?';
      document.getElementById('mood-label').textContent = 'How was the mood?';
      saveBtn.textContent = 'Save entry';
      _selectedMood = null;
      moodChips.innerHTML = _renderMoodChips(logbook.MOOD_TAGS, null);
      deedOrPrompts.innerHTML = _renderDeedChips();
    }
  }

  async function _saveEntry() {
    const text    = document.getElementById('log-text').value.trim();
    const date    = document.getElementById('log-date').value;
    const saveBtn = document.getElementById('save-entry-btn');

    if (!text)          { showToast('Please write something first.', 'error'); return; }
    if (!_selectedMood) { showToast('Please select a mood.', 'error'); return; }

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Saving…';

    let result;

    if (_logMode === 'parent') {
      result = await reflection.addReflection(text, _selectedMood, null, date);
    } else {
      if (!_selectedChildId) {
        showToast('Please select a child.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save entry';
        return;
      }
      result = await logbook.addEntry(_selectedChildId, text, _selectedMood, [], date);
      if (result.success && _selectedDeed) {
        await points.awardPoints(_selectedChildId, _selectedDeed.id, _selectedDeed.label, _selectedDeed.points, date);
      }
    }

    saveBtn.disabled    = false;
    saveBtn.textContent = _logMode === 'parent' ? 'Save reflection' : 'Save entry';

    if (result.success) {
      showToast(_logMode === 'parent' ? 'Reflection saved.' : 'Entry saved.', 'success');
      setTimeout(() => showScreen('home'), 400);
    } else {
      showToast('Could not save — please try again.', 'error');
    }
  }

  // ── History screen ─────────────────────────────────────────────────────────

  let _historyFilter = { childId: null, moodTag: null, mode: 'all' };

  async function renderHistory() {
    const children = profiles.getChildren();
    const histEl   = document.getElementById('history-content');

    const childChips = children.map(c => `
      <button class="chip ${_historyFilter.childId === c.id ? 'active' : ''}"
              data-filter-child="${c.id}" aria-pressed="${_historyFilter.childId === c.id}">
        ${_esc(c.nickname || c.name)}
      </button>`).join('');

    const moodChips = logbook.MOOD_TAGS.map(m => `
      <button class="chip ${_historyFilter.moodTag === m ? 'active' : ''}"
              data-filter-mood="${m}" aria-pressed="${_historyFilter.moodTag === m}">
        ${m}
      </button>`).join('');

    histEl.innerHTML = `
      <div style="padding:14px 16px 8px">
        <p class="display" style="font-size:20px;margin-bottom:10px">History</p>
        <div class="chip-scroll" id="history-filters">
          <button class="chip ${!_historyFilter.childId && _historyFilter.mode === 'all' ? 'active' : ''}"
                  data-filter-all="true">All</button>
          ${childChips}
          ${moodChips}
          <button class="chip ${_historyFilter.mode === 'reflection' ? 'active' : ''}"
                  data-filter-reflection="true">My journey</button>
        </div>
      </div>
      <div id="history-list"></div>`;

    document.getElementById('history-filters').addEventListener('click', e => {
      const btn = e.target.closest('[data-filter-all],[data-filter-child],[data-filter-mood],[data-filter-reflection]');
      if (!btn) return;
      if (btn.dataset.filterAll)        _historyFilter = { childId: null, moodTag: null, mode: 'all' };
      if (btn.dataset.filterChild)      _historyFilter = { childId: btn.dataset.filterChild, moodTag: null, mode: 'all' };
      if (btn.dataset.filterMood)       _historyFilter = { ..._historyFilter, moodTag: btn.dataset.filterMood, mode: 'all' };
      if (btn.dataset.filterReflection) _historyFilter = { childId: null, moodTag: null, mode: 'reflection' };
      renderHistory();
    });

    await _renderHistoryList();
  }

  async function _renderHistoryList() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;
    let items = [];

    if (_historyFilter.mode === 'reflection') {
      const refs = await reflection.getReflections({ moodTag: _historyFilter.moodTag || undefined });
      items = refs.map(r => ({ ...r, _type: 'reflection' }));
    } else {
      const children = _historyFilter.childId
        ? [profiles.getChild(_historyFilter.childId)].filter(Boolean)
        : profiles.getChildren();
      for (const child of children) {
        const entries = await logbook.getEntries(child.id, { moodTag: _historyFilter.moodTag || undefined });
        items.push(...entries.map(e => ({ ...e, _type: 'log', _child: child })));
      }
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon"><i class="ti ti-calendar-off" aria-hidden="true"></i></div>
          <p class="empty-state__title">No entries found</p>
          <p class="empty-state__desc">Try a different filter.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = items.slice(0, 50).map(item =>
      item._type === 'reflection' ? _buildReflectionCard(item) : _buildEntryCard(item, item._child)
    ).join('');
  }

  // ── Card builders ──────────────────────────────────────────────────────────

  function _buildEntryCard(entry, child) {
    const colour = child ? child.avatarColor : 'purple';
    const name   = child ? (child.nickname || child.name) : 'Unknown';
    return `
      <div class="entry-card">
        <div class="entry-card__header">
          <div class="entry-card__who">
            <div class="entry-card__dot dot-${colour}"></div>
            <span class="entry-card__name">${_esc(name)}</span>
          </div>
          <span class="entry-card__date">${_formatDate(entry.date)}</span>
        </div>
        <div class="entry-card__text">${_esc(entry.text)}</div>
        <div class="entry-card__footer">
          <span class="mood-chip">${entry.moodTag}</span>
        </div>
      </div>`;
  }

  function _buildReflectionCard(entry) {
    return `
      <div class="entry-card">
        <div class="entry-card__header">
          <div class="entry-card__who">
            <i class="ti ti-user" style="font-size:14px;color:var(--color-muted)" aria-hidden="true"></i>
            <span class="entry-card__name" style="color:var(--color-muted)">My reflection</span>
          </div>
          <span class="entry-card__date">${_formatDate(entry.date)}</span>
        </div>
        <div class="entry-card__text">${_esc(entry.text)}</div>
        <div class="entry-card__footer">
          <span class="mood-chip">${entry.moodTag}</span>
        </div>
      </div>`;
  }

  // ── Confirm dialog ─────────────────────────────────────────────────────────

  function showConfirm(title, message, confirmLabel, onConfirm) {
    // Remove existing dialog
    document.getElementById('confirm-dialog')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'confirm-dialog';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:300;
      display:flex;align-items:flex-end;justify-content:center;padding:0 0 20px;`;
    overlay.innerHTML = `
      <div style="background:white;border-radius:var(--radius-lg);padding:20px;width:calc(100% - 32px);max-width:440px">
        <p style="font-size:16px;font-weight:500;color:var(--color-ink);margin-bottom:8px">${_esc(title)}</p>
        <p style="font-size:13px;color:var(--color-muted);line-height:1.5;margin-bottom:20px">${_esc(message)}</p>
        <div style="display:flex;gap:8px">
          <button id="confirm-cancel" style="flex:1;padding:12px;border-radius:var(--radius-md);border:0.5px solid var(--color-border);background:white;font-family:var(--font-body);font-size:14px">
            Cancel
          </button>
          <button id="confirm-ok" style="flex:1;padding:12px;border-radius:var(--radius-md);background:var(--color-red-tx);color:white;border:none;font-family:var(--font-body);font-size:14px;font-weight:500">
            ${_esc(confirmLabel)}
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.getElementById('confirm-cancel').addEventListener('click', () => overlay.remove());
    document.getElementById('confirm-ok').addEventListener('click', () => { overlay.remove(); onConfirm(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  function _renderMoodChips(tags, selected) {
    return tags.map(tag => `
      <button class="chip ${selected === tag ? 'active' : ''}"
              data-mood="${tag}" aria-pressed="${selected === tag}">${tag}</button>`).join('');
  }

  function _renderDeedChips() {
    const cats = profiles.getSettings().pointCategories || [];
    return `
      <div class="form-section">
        <div class="form-label">Award points? (optional)</div>
        <div class="chip-scroll" style="padding:0 0 4px 0">
          ${cats.map(cat => `
            <button class="chip" data-deed-id="${cat.id}"
                    data-deed-label="${_esc(cat.label)}"
                    data-deed-pts="${cat.defaultPoints}"
                    aria-pressed="false">
              ${_esc(cat.label)} +${cat.defaultPoints}
            </button>`).join('')}
        </div>
      </div>`;
  }

  let _toastTimer = null;
  function showToast(message, type = 'success', duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className   = `toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '';
    const d     = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff  = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Navigation wiring ──────────────────────────────────────────────────────

  document.getElementById('bottom-nav').addEventListener('click', e => {
    const item = e.target.closest('.nav-item');
    if (!item || !item.dataset.screen) return;
    showScreen(item.dataset.screen);
  });

  fab.addEventListener('click', () => showScreen('logEntry'));
  window.showToast = showToast;

  // ── Boot ───────────────────────────────────────────────────────────────────

  await init();

})();
