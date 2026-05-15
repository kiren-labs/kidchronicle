/* ui-utils.js — shared UI helpers used across app.js and ui-dialogs.js */

const _esc = str =>
  String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const _formatDate = dateStr => {
  if (!dateStr) return '';
  const d     = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff  = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

let _toastTimer = null;
const showToast = (message, type = 'success', duration = 2500) => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
};

window._esc        = _esc;
window._formatDate = _formatDate;
window.showToast   = showToast;
