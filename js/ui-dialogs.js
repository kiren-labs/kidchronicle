/* ui-dialogs.js — action sheet and confirm dialog
 * Depends on: ui-utils.js (_esc)
 */

const showActionSheet = (title, actions) => {
  document.getElementById('action-sheet-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'action-sheet-overlay';
  overlay.className = 'action-sheet-overlay';
  overlay.innerHTML = `
    <div class="action-sheet" role="dialog" aria-modal="true" aria-label="${_esc(title)}">
      <div class="action-sheet__title">${_esc(title)}</div>
      ${actions.map((a, i) => `
        <button class="action-sheet__btn ${a.danger ? 'action-sheet__btn--danger' : ''}"
                data-action-index="${i}">
          <i class="ti ${a.icon}" aria-hidden="true"></i> ${_esc(a.label)}
        </button>`).join('')}
      <button class="action-sheet__btn" data-action-cancel>
        <i class="ti ti-x" aria-hidden="true"></i> Cancel
      </button>
    </div>`;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.closest('[data-action-cancel]')) {
      overlay.remove();
      return;
    }
    const btn = e.target.closest('[data-action-index]');
    if (!btn) return;
    overlay.remove();
    actions[parseInt(btn.dataset.actionIndex, 10)].handler();
  });
};

const showConfirm = (title, message, confirmLabel, onConfirm) => {
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
};

window.showActionSheet = showActionSheet;
window.showConfirm     = showConfirm;
