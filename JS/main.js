import { initTabs } from './tabs.js';
import { initSubtabs } from './subtabs.js';
import { chargerDonnees, afficherMot, motsComplet, mots, indexMot } from './dictionnaire.js';
import { envoyerMessage } from './chat.js';
import { activerMicroEtComparer } from './audio.js';
import { initCarousel } from './carousel.js';
import { debounce, nettoyerTexte } from './utils.js'; // ✅ Nouvel import

window.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSubtabs();
  initCarousel();
  chargerDonnees();

  // 🔍 Recherche dans le dictionnaire
  document.getElementById('searchBar')?.addEventListener('input', debounce(() => {
    const query = nettoyerTexte(document.getElementById('searchBar').value.trim());
    const filtrés = query
      ? motsComplet.filter(m =>
          Object.values(m).some(val => typeof val === 'string' && nettoyerTexte(val).includes(query))
        )
      : [...motsComplet];

    if (filtrés.length) {
      mots.length = 0;
      mots.push(...filtrés);
      afficherMot(0);
    } else {
      document.getElementById('motTexte').textContent = "Aucun résultat";
      document.getElementById('definition').textContent = "";
      document.getElementById('compteur').textContent = "0 / 0";
    }
  }));

  // 💬 Chat
  document.getElementById('btnEnvoyer')?.addEventListener('click', envoyerMessage);

  // ⬅️➡️ Navigation dictionnaire
  document.getElementById('btnPrev')?.addEventListener('click', () => afficherMot(indexMot - 1));
  document.getElementById('btnNext')?.addEventListener('click', () => afficherMot(indexMot + 1));

  // 🎙️ Reconnaissance vocale
  document.getElementById('btnPrononcer')?.addEventListener('click', activerMicroEtComparer);
});
