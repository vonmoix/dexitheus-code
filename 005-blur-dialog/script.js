const dialog = document.querySelector('.dlg');
const opener = document.querySelector('[data-open]');

const open = () => {
  if (!dialog.open) dialog.showModal();
};

opener.addEventListener('click', open);

// Open with the X key (ignored while typing)
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'x' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  open();
});

// Close when clicking outside the panel
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close('dismiss');
});
