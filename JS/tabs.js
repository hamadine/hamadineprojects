export function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabSections = document.querySelectorAll('.tab');

  function activerOnglet(id) {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabSections.forEach(s => s.classList.remove('active'));

    const btn = [...tabButtons].find(b => b.dataset.tab === id);
    const section = document.getElementById(id);

    if (btn && section) {
      btn.classList.add('active');
      section.classList.add('active');
      localStorage.setItem('ongletActif', id);
      history.replaceState(null, '', `#${id}`);
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activerOnglet(btn.dataset.tab);
    });
  });

  // Activer onglet au chargement
  const hash = window.location.hash?.substring(1);
  const ongletMemorise = localStorage.getItem('ongletActif');
  const ongletInitial = hash || ongletMemorise || 'dictionnaire';
  activerOnglet(ongletInitial);
}
