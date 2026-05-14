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
    onboarding: document.getElementById('screen-onboarding'),
    home:       document.getElementById('screen-home'),
    logEntry:   document.getElementById('screen-log-entry'),
    profile:    document.getElementById('screen-profile'),
    history:    document.getElementById('screen-history'),
  };

  const bottomNav = document.getElementById('bottom-nav');
  const fab       = document.getElementById('fab');

  // ── Router ─────────────────────────────────────────────────────────────────

  let _currentScreen = null;
  let _activeChildId = null;

  function showScreen(screenId, options = {}) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    const screen = screens[screenId];
    if (!screen) { console.error('Unknown screen:', screenId); return; }
    screen.classList.add('active');
    _currentScreen = screenId;

    // FAB visibility
    const fabScreens = ['home', 'history'];
    fab.classList.toggle('hidden', !fabScreens.includes(screenId));

    // Nav highlighting
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenId);
    });

    // Render screen content
    if (screenId === 'home')    renderHome();
    if (screenId === 'profile' && options.childId) renderProfile(options.childId);
    if (screenId === 'history') renderHistory();
    if (screenId === 'logEntry') renderLogEntry(options);
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
      const colours = profiles.AVATAR_COLOURS;
      container.innerHTML = `
        <div class="onboard-hero" style="padding-top:32px">
          <p class="display" style="font-size:20px;margin-bottom:4px">Add your first child</p>
          <p style="font-size:13px;color:var(--color-muted)">You can add more after setup.</p>
        </div>
        <div class="onboard-step">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--color-muted);margin-bottom:6px">Step 2 of 3</p>
          <div class="form-label" style="margin-top:0">Child's name</div>
          <input class="input-field" id="child-name-input" type="text"
            placeholder="e.g. Layla" autocapitalize="words"
            value="${_onboardChild.name || ''}" />
          <div style="height:12px"></div>
          <div class="form-label">Date of birth</div>
          <input class="input-field" id="child-dob-input" type="date"
            max="${new Date().toISOString().split('T')[0]}"
            value="${_onboardChild.dateOfBirth || ''}" />
          <div style="height:12px"></div>
          <div class="form-label">Choose a colour</div>
          <div class="colour-picker">
            ${colours.map(c => `
              <div class="colour-swatch avatar-${c} ${_onboardChild.avatarColor === c ? 'selected' : ''}"
                   data-colour="${c}" aria-label="${c}" role="button" tabindex="0"></div>
            `).join('')}
          </div>
          <div style="height:20px"></div>
          <button class="btn-primary" id="onboard-next-2">Continue →</button>
        </div>
        <div class="onboard-dots">
          <div class="onboard-dot"></div>
          <div class="onboard-dot active"></div>
          <div class="onboard-dot"></div>
        </div>`;

      document.querySelectorAll('.colour-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          document.querySelectorAll('.colour-swatch').forEach(s => s.classList.remove('selected'));
          swatch.classList.add('selected');
          _onboardChild.avatarColor = swatch.dataset.colour;
        });
      });

      document.getElementById('onboard-next-2').addEventListener('click', () => {
        const name = document.getElementById('child-name-input').value.trim();
        const dob  = document.getElementById('child-dob-input').value;
        if (!name) { showToast('Please enter your child\'s name.', 'error'); return; }
        if (!dob)  { showToast('Please enter a date of birth.', 'error'); return; }
        _onboardChild.name        = name;
        _onboardChild.dateOfBirth = dob;
        renderOnboardStep(3);
      });
    }

    else if (step === 3) {
      // Save everything
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
            ${_onboardFamily.name} is all set.<br>
            Tap below to write your first entry for ${_onboardChild.name}.
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

      document.getElementById('onboard-done').addEventListener('click', () => {
        showScreen('home');
      });
    }
  }

  // ── Home screen ────────────────────────────────────────────────────────────

  async function renderHome() {
    const family  = profiles.getFamily();
    const children = profiles.getChildren();

    // Greeting
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('home-greeting').textContent =
      `"${greeting}, ${family ? family.name : 'family'}"`;

    // Child cards
    const cardRow = document.getElementById('child-card-row');
    if (children.length === 0) {
      cardRow.innerHTML = `
        <div class="empty-state" style="padding:24px">
          <div class="empty-state__icon"><i class="ti ti-users" aria-hidden="true"></i></div>
          <p class="empty-state__desc">No children added yet.</p>
        </div>`;
    } else {
      const cardHtml = await Promise.all(children.map(async child => {
        const total  = await points.getTotalPoints(child.id);
        const streak = await points.getStreakCount(child.id);
        return `
          <div class="child-card avatar-${child.avatarColor}" data-child-id="${child.id}"
               role="button" tabindex="0" aria-label="View ${child.name}'s profile">
            <div class="avatar">
              <i class="ti ti-heart" aria-hidden="true"></i>
            </div>
            <div class="child-name">${_esc(child.name)}</div>
            <div class="child-pts">${total} pts</div>
            ${streak > 0 ? `<div class="child-streak">🔥 ${streak} day${streak > 1 ? 's' : ''}</div>` : ''}
          </div>`;
      }));
      cardRow.innerHTML = cardHtml.join('');

      cardRow.querySelectorAll('.child-card').forEach(card => {
        card.addEventListener('click', () => {
          showScreen('profile', { childId: card.dataset.childId });
        });
      });
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

  // ── Log entry screen ───────────────────────────────────────────────────────

  let _logMode      = 'child';  // 'child' | 'parent'
  let _selectedChildId = null;
  let _selectedMood    = null;
  let _selectedDeed    = null;

  function renderLogEntry(options = {}) {
    _logMode         = 'child';
    _selectedChildId = options.childId || null;
    _selectedMood    = null;
    _selectedDeed    = null;

    const children = profiles.getChildren();

    // Pre-select first child if none specified
    if (!_selectedChildId && children.length > 0) {
      _selectedChildId = children[0].id;
    }

    const logEl = document.getElementById('log-entry-content');
    logEl.innerHTML = `
      <!-- Entry type toggle -->
      <div class="entry-toggle" id="entry-toggle" style="margin-top:4px">
        <button class="entry-toggle__btn active" data-mode="child" aria-pressed="true">About my child</button>
        <button class="entry-toggle__btn" data-mode="parent" aria-pressed="false">About myself</button>
      </div>

      <!-- Child selector (hidden in parent mode) -->
      <div id="child-selector-row" class="chip-scroll" style="padding-bottom:12px">
        ${children.map(c => `
          <button class="chip ${_selectedChildId === c.id ? 'active' : ''}"
                  data-child-id="${c.id}" aria-pressed="${_selectedChildId === c.id}">
            ${_esc(c.name)}
          </button>`).join('')}
      </div>

      <!-- Text area -->
      <div class="form-section">
        <div class="form-label" id="text-label">What happened today?</div>
        <textarea class="input-field" id="log-text" rows="4"
          placeholder="Write what happened…"></textarea>
      </div>

      <!-- Mood selector -->
      <div class="form-section">
        <div class="form-label" id="mood-label">How was the mood?</div>
        <div class="chip-scroll" id="mood-chips" style="padding:0 0 0 0">
          ${_renderMoodChips(logbook.MOOD_TAGS, null)}
        </div>
      </div>

      <!-- Points / prompts area -->
      <div id="deed-or-prompts">
        ${_renderDeedChips()}
      </div>

      <!-- Date -->
      <div class="form-section">
        <div class="form-label">Date</div>
        <input class="input-field" id="log-date" type="date"
          value="${new Date().toISOString().split('T')[0]}"
          max="${new Date().toISOString().split('T')[0]}" />
      </div>

      <div style="padding:0 16px 8px">
        <button class="btn-primary" id="save-entry-btn">Save entry</button>
      </div>`;

    // Wire toggle
    document.getElementById('entry-toggle').addEventListener('click', e => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      _logMode = btn.dataset.mode;
      _switchLogMode(_logMode);
    });

    // Wire child chips
    document.getElementById('child-selector-row').addEventListener('click', e => {
      const btn = e.target.closest('[data-child-id]');
      if (!btn) return;
      _selectedChildId = btn.dataset.childId;
      document.querySelectorAll('#child-selector-row .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.childId === _selectedChildId);
        c.setAttribute('aria-pressed', c.dataset.childId === _selectedChildId);
      });
    });

    // Wire mood chips
    document.getElementById('mood-chips').addEventListener('click', e => {
      const btn = e.target.closest('[data-mood]');
      if (!btn) return;
      _selectedMood = btn.dataset.mood;
      document.querySelectorAll('#mood-chips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.mood === _selectedMood);
        c.setAttribute('aria-pressed', c.dataset.mood === _selectedMood);
      });
    });

    // Wire deed chips
    document.getElementById('deed-or-prompts').addEventListener('click', e => {
      const btn = e.target.closest('[data-deed-id]');
      if (!btn) return;
      _selectedDeed = _selectedDeed && _selectedDeed.id === btn.dataset.deedId
        ? null
        : { id: btn.dataset.deedId, label: btn.dataset.deedLabel, points: parseInt(btn.dataset.deedPts, 10) };
      document.querySelectorAll('[data-deed-id]').forEach(c => {
        const isSelected = _selectedDeed && c.dataset.deedId === _selectedDeed.id;
        c.classList.toggle('active', isSelected);
        c.setAttribute('aria-pressed', isSelected);
      });
    });

    // Wire save
    document.getElementById('save-entry-btn').addEventListener('click', _saveEntry);
  }

  function _switchLogMode(mode) {
    const toggleBtns     = document.querySelectorAll('.entry-toggle__btn');
    const childSelector  = document.getElementById('child-selector-row');
    const moodLabel      = document.getElementById('mood-label');
    const textLabel      = document.getElementById('text-label');
    const deedOrPrompts  = document.getElementById('deed-or-prompts');
    const saveBtn        = document.getElementById('save-entry-btn');
    const moodChips      = document.getElementById('mood-chips');

    toggleBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
      btn.setAttribute('aria-pressed', btn.dataset.mode === mode);
    });

    if (mode === 'parent') {
      childSelector.style.display  = 'none';
      textLabel.textContent         = 'How did you show up as a parent today?';
      moodLabel.textContent         = 'How were you?';
      saveBtn.textContent           = 'Save reflection';
      _selectedMood = null;
      moodChips.innerHTML = _renderMoodChips(reflection.PARENT_MOOD_TAGS, null);

      // Re-wire mood chips for parent tags
      moodChips.addEventListener('click', e => {
        const btn = e.target.closest('[data-mood]');
        if (!btn) return;
        _selectedMood = btn.dataset.mood;
        document.querySelectorAll('#mood-chips .chip').forEach(c => {
          c.classList.toggle('active', c.dataset.mood === _selectedMood);
        });
      });

      // Show prompts instead of deed chips
      const prompts = reflection.getPromptOptions();
      deedOrPrompts.innerHTML = `
        <div class="form-section">
          <div class="form-label">Prompts (optional — tap to use)</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${prompts.map(p => `
              <button class="chip" data-prompt="${_esc(p)}" style="text-align:left;white-space:normal;height:auto;padding:8px 12px;">
                ${_esc(p)}
              </button>`).join('')}
          </div>
        </div>`;

      deedOrPrompts.querySelectorAll('[data-prompt]').forEach(btn => {
        btn.addEventListener('click', () => {
          const textarea = document.getElementById('log-text');
          const prompt   = btn.dataset.prompt;
          if (textarea.value && !textarea.value.endsWith(' ')) textarea.value += ' ';
          textarea.value += prompt;
          textarea.focus();
        });
      });
    } else {
      childSelector.style.display  = '';
      textLabel.textContent         = 'What happened today?';
      moodLabel.textContent         = 'How was the mood?';
      saveBtn.textContent           = 'Save entry';
      _selectedMood = null;
      moodChips.innerHTML = _renderMoodChips(logbook.MOOD_TAGS, null);
      deedOrPrompts.innerHTML = _renderDeedChips();
    }
  }

  async function _saveEntry() {
    const text    = document.getElementById('log-text').value.trim();
    const date    = document.getElementById('log-date').value;
    const saveBtn = document.getElementById('save-entry-btn');

    if (!text)         { showToast('Please write something first.', 'error'); return; }
    if (!_selectedMood){ showToast('Please select a mood.', 'error'); return; }

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Saving…';

    let result;

    if (_logMode === 'parent') {
      result = await reflection.addReflection(text, _selectedMood, null, date);
    } else {
      if (!_selectedChildId) { showToast('Please select a child.', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Save entry'; return; }

      result = await logbook.addEntry(_selectedChildId, text, _selectedMood, [], date);

      // Also award points if a deed was selected
      if (result.success && _selectedDeed) {
        await points.awardPoints(
          _selectedChildId,
          _selectedDeed.id,
          _selectedDeed.label,
          _selectedDeed.points,
          date
        );
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

  // ── Profile screen ─────────────────────────────────────────────────────────

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
        <!-- Back -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <button class="btn-back" id="profile-back" aria-label="Back to home">
            <i class="ti ti-arrow-left" aria-hidden="true"></i>
          </button>
          <span style="font-size:12px;color:var(--color-muted)">Back</span>
        </div>

        <!-- Avatar + name -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
          <div style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px"
               class="avatar-${child.avatarColor}">
            <i class="ti ti-heart" aria-hidden="true"></i>
          </div>
          <div>
            <p class="display" style="font-size:22px">${_esc(child.name)}</p>
            <p style="font-size:12px;color:var(--color-muted)">
              Age ${child.age.years}${child.hasSiblings ? ' · has siblings' : ''}
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div style="display:flex;gap:8px;margin-bottom:14px">
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
        <!-- Badges -->
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
        <!-- Suggestion -->
        <div class="section-label" style="padding:0;margin-bottom:8px">This week's activity idea</div>
        <div class="suggestion-card" id="suggestion-card">
          <div class="suggestion-card__label">Age ${child.age.years} · ${_esc(suggestions[0].category || 'activity')}</div>
          <div class="suggestion-card__title">${_esc(suggestions[0].title)}</div>
          <div class="suggestion-card__desc">${_esc(suggestions[0].description)}</div>
        </div>` : ''}
      </div>`;

    document.getElementById('profile-back').addEventListener('click', () => showScreen('home'));

    // Render chart after DOM is painted
    requestAnimationFrame(() => {
      const canvas = document.getElementById('points-chart');
      if (canvas) charts.renderPointsChart(childId, canvas);
    });
  }

  // ── History screen ─────────────────────────────────────────────────────────

  let _historyFilter = { childId: null, moodTag: null, mode: 'all' };

  async function renderHistory() {
    const children = profiles.getChildren();
    const histEl   = document.getElementById('history-content');

    // Build filter chips
    const childChips = children.map(c => `
      <button class="chip ${_historyFilter.childId === c.id ? 'active' : ''}"
              data-filter-child="${c.id}" aria-pressed="${_historyFilter.childId === c.id}">
        ${_esc(c.name)}
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

    // Wire filters
    document.getElementById('history-filters').addEventListener('click', e => {
      const btn = e.target.closest('[data-filter-all],[data-filter-child],[data-filter-mood],[data-filter-reflection]');
      if (!btn) return;
      if (btn.dataset.filterAll)        { _historyFilter = { childId: null, moodTag: null, mode: 'all' }; }
      if (btn.dataset.filterChild)      { _historyFilter = { childId: btn.dataset.filterChild, moodTag: null, mode: 'all' }; }
      if (btn.dataset.filterMood)       { _historyFilter = { ..._historyFilter, moodTag: btn.dataset.filterMood, mode: 'all' }; }
      if (btn.dataset.filterReflection) { _historyFilter = { childId: null, moodTag: null, mode: 'reflection' }; }
      renderHistory();
    });

    await _renderHistoryList();
  }

  async function _renderHistoryList() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    let items = [];

    if (_historyFilter.mode === 'reflection') {
      const refs = await reflection.getReflections({
        moodTag: _historyFilter.moodTag || undefined,
      });
      items = refs.map(r => ({ ...r, _type: 'reflection' }));
    } else {
      const children = _historyFilter.childId
        ? [profiles.getChild(_historyFilter.childId)].filter(Boolean)
        : profiles.getChildren();

      for (const child of children) {
        const entries = await logbook.getEntries(child.id, {
          moodTag: _historyFilter.moodTag || undefined,
        });
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

    listEl.innerHTML = items.slice(0, 50).map(item => {
      if (item._type === 'reflection') return _buildReflectionCard(item);
      return _buildEntryCard(item, item._child);
    }).join('');
  }

  // ── Card builders ──────────────────────────────────────────────────────────

  function _buildEntryCard(entry, child) {
    const colour = child ? child.avatarColor : 'purple';
    const name   = child ? child.name : 'Unknown';
    const date   = _formatDate(entry.date);
    return `
      <div class="entry-card">
        <div class="entry-card__header">
          <div class="entry-card__who">
            <div class="entry-card__dot dot-${colour}"></div>
            <span class="entry-card__name">${_esc(name)}</span>
          </div>
          <span class="entry-card__date">${date}</span>
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

  // ── UI helpers ─────────────────────────────────────────────────────────────

  function _renderMoodChips(tags, selected) {
    return tags.map(tag => `
      <button class="chip ${selected === tag ? 'active' : ''}"
              data-mood="${tag}" aria-pressed="${selected === tag}">
        ${tag}
      </button>`).join('');
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
    requestAnimationFrame(() => { toast.classList.add('show'); });
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { toast.classList.remove('show'); }, duration);
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '';
    const d     = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff  = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Bottom nav wiring ──────────────────────────────────────────────────────

  document.getElementById('bottom-nav').addEventListener('click', e => {
    const item = e.target.closest('.nav-item');
    if (!item || !item.dataset.screen) return;
    showScreen(item.dataset.screen);
  });

  fab.addEventListener('click', () => showScreen('logEntry'));

  // ── Expose showToast globally (used by service worker update handler) ──────

  window.showToast = showToast;

  // ── Boot ───────────────────────────────────────────────────────────────────

  await init();

})();

