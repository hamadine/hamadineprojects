export function initSubtabs() {
  document.querySelectorAll('nav.subtabs > .subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.ressource-section') || btn.closest('.livre-bloc') || document;
      if (!parent) return;

      const id = btn.dataset.subtab;
      parent.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = parent.querySelector(`#${id}`);
      if (target) target.classList.add('active');

      // Sauvegarde dans localStorage si besoin
      const zone = parent.id || 'subtab';
      localStorage.setItem(`subtab-${zone}`, id);
    });
  });

  // Activer sous-onglets mémorisés
  document.querySelectorAll('.ressource-section, .livre-bloc').forEach(section => {
    const zone = section.id || 'subtab';
    const id = localStorage.getItem(`subtab-${zone}`);
    if (!id) return;

    const btn = section.querySelector(`.subtab-btn[data-subtab="${id}"]`);
    const content = section.querySelector(`#${id}`);
    if (btn && content) {
      section.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      section.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      content.classList.add('active');
    }
  });

  // Gestion spéciale des sous-onglets par fonction
  window.openSubtab = function (evt, tabId) {
    const section = document.getElementById('idaksahak-emancipation');
    if (!section) return;
    section.querySelectorAll('.subtab-content').forEach(el => el.classList.remove('active'));
    section.querySelectorAll('.subtab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
    evt.currentTarget?.classList.add('active');
  };
}
