/**
 * charts.js — canvas bar chart rendering
 *
 * Depends on: storage.js, points.js, logbook.js, reflection.js
 *
 * Pure renderers — read data, write to canvas only.
 * No side effects. No storage writes.
 * No charting library — plain Canvas 2D API.
 */

const charts = (() => {

  // Design tokens — kept in sync with css/themes.css
  const COLOURS = {
    barActive:   '#2C2C2A',
    barInactive: '#D3D1C7',
    barBg:       '#F1EFE8',
    label:       '#888780',
    axis:        '#E8E6DF',
    // Parent mood
    patient:     '#1D9E75',
    present:     '#378ADD',
    reactive:    '#D85A30',
    distracted:  '#BA7517',
    tired:       '#888780',
  };

  const MOOD_COLOURS = {
    great: '#1D9E75',
    good:  '#378ADD',
    proud: '#7F77DD',
    ok:    '#888780',
    tired: '#D3D1C7',
  };

  const PARENT_MOOD_COLOURS = {
    patient:    COLOURS.patient,
    present:    COLOURS.present,
    reactive:   COLOURS.reactive,
    distracted: COLOURS.distracted,
    tired:      COLOURS.tired,
  };

  // ── Points history chart (child profile screen) ────────────────────────────

  /**
   * Render an 8-week rolling points bar chart.
   *
   * @param {string}            childId  - Child whose data to show
   * @param {HTMLCanvasElement} canvasEl - Target canvas element
   * @param {number}            weeks    - Number of weeks (default 8)
   */
  async function renderPointsChart(childId, canvasEl, weeks = 8) {
    try {
      const data = await points.getPointsHistory(childId, weeks);
      _renderBarChart(canvasEl, data.map(d => ({
        label: d.weekLabel,
        value: d.total,
      })), { highlightMax: true });
    } catch (err) {
      console.error('charts.renderPointsChart:', err);
      _renderEmpty(canvasEl, 'No points yet');
    }
  }

  // ── Mood trend chart (child profile screen) ────────────────────────────────

  /**
   * Render a 30-day mood distribution chart for a child.
   *
   * @param {string}            childId  - Child whose data to show
   * @param {HTMLCanvasElement} canvasEl - Target canvas element
   * @param {number}            days     - Rolling window (default 30)
   */
  async function renderMoodChart(childId, canvasEl, days = 30) {
    try {
      const cutoff  = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const dateFrom = cutoff.toISOString().split('T')[0];

      const entries  = await logbook.getEntries(childId, { dateFrom });
      const counts   = {};
      logbook.MOOD_TAGS.forEach(tag => { counts[tag] = 0; });
      entries.forEach(e => { if (counts[e.moodTag] !== undefined) counts[e.moodTag]++; });

      const data = logbook.MOOD_TAGS.map(tag => ({
        label: tag,
        value: counts[tag],
        color: MOOD_COLOURS[tag] || COLOURS.barInactive,
      }));

      _renderBarChart(canvasEl, data, { coloured: true, showZero: true });
    } catch (err) {
      console.error('charts.renderMoodChart:', err);
      _renderEmpty(canvasEl, 'No entries yet');
    }
  }

  // ── Parent mood trend chart (My Journey view) ──────────────────────────────

  /**
   * Render a 30-day parent mood distribution chart.
   *
   * @param {HTMLCanvasElement} canvasEl - Target canvas element
   * @param {number}            days     - Rolling window (default 30)
   */
  async function renderParentMoodChart(canvasEl, days = 30) {
    try {
      const cutoff   = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const dateFrom = cutoff.toISOString().split('T')[0];

      const entries  = await reflection.getReflections({ dateFrom });
      const counts   = {};
      reflection.PARENT_MOOD_TAGS.forEach(tag => { counts[tag] = 0; });
      entries.forEach(e => { if (counts[e.moodTag] !== undefined) counts[e.moodTag]++; });

      const data = reflection.PARENT_MOOD_TAGS.map(tag => ({
        label: tag,
        value: counts[tag],
        color: PARENT_MOOD_COLOURS[tag] || COLOURS.barInactive,
      }));

      _renderBarChart(canvasEl, data, { coloured: true, showZero: true });
    } catch (err) {
      console.error('charts.renderParentMoodChart:', err);
      _renderEmpty(canvasEl, 'No reflections yet');
    }
  }

  // ── Core bar chart renderer ────────────────────────────────────────────────

  /**
   * Render a bar chart on a canvas element.
   *
   * @param {HTMLCanvasElement} canvasEl
   * @param {Array} data          - [{ label, value, color? }]
   * @param {object} options
   * @param {boolean} options.highlightMax  - Highlight the tallest bar in dark ink
   * @param {boolean} options.coloured      - Use per-bar colour from data.color
   * @param {boolean} options.showZero      - Render zero-value bars as tiny stubs
   */
  function _renderBarChart(canvasEl, data, options = {}) {
    if (!canvasEl || !canvasEl.getContext) return;

    const ctx    = canvasEl.getContext('2d');
    const W      = canvasEl.offsetWidth  || canvasEl.width  || 300;
    const H      = canvasEl.offsetHeight || canvasEl.height || 80;

    // Set actual canvas resolution to avoid blur on retina displays
    const dpr    = window.devicePixelRatio || 1;
    canvasEl.width  = W * dpr;
    canvasEl.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    if (!data || data.length === 0) {
      _renderEmpty(canvasEl, 'No data');
      return;
    }

    const PADDING_TOP    = 8;
    const PADDING_BOTTOM = 22;
    const PADDING_SIDE   = 4;
    const chartH = H - PADDING_TOP - PADDING_BOTTOM;
    const chartW = W - PADDING_SIDE * 2;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barW   = (chartW / data.length) * 0.65;
    const gap    = (chartW / data.length) * 0.35;
    const radius = Math.min(3, barW / 4);

    data.forEach((d, i) => {
      const barH  = options.showZero && d.value === 0
        ? 3
        : Math.max((d.value / maxVal) * chartH, d.value > 0 ? 4 : 0);
      const x = PADDING_SIDE + i * (barW + gap) + gap / 2;
      const y = PADDING_TOP + chartH - barH;

      // Bar colour
      if (options.coloured && d.color) {
        ctx.fillStyle = d.value === 0 ? COLOURS.barBg : d.color;
      } else if (options.highlightMax && d.value === maxVal && d.value > 0) {
        ctx.fillStyle = COLOURS.barActive;
      } else {
        ctx.fillStyle = d.value === 0 ? COLOURS.barBg : COLOURS.barInactive;
      }

      // Draw rounded-top bar
      _roundedBar(ctx, x, y, barW, barH, radius);

      // Label
      ctx.fillStyle    = COLOURS.label;
      ctx.font         = `9px -apple-system, sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      const labelY     = H - PADDING_BOTTOM + 4;
      ctx.fillText(d.label, x + barW / 2, labelY);
    });
  }

  function _roundedBar(ctx, x, y, w, h, r) {
    if (h < r * 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function _renderEmpty(canvasEl, message) {
    if (!canvasEl || !canvasEl.getContext) return;
    const ctx = canvasEl.getContext('2d');
    const W   = canvasEl.offsetWidth  || 300;
    const H   = canvasEl.offsetHeight || 80;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle    = COLOURS.label;
    ctx.font         = '12px -apple-system, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, W / 2, H / 2);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    renderPointsChart,
    renderMoodChart,
    renderParentMoodChart,
  };

})();

