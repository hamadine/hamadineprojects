import { chargerDonnees, afficherMot, getIndexMot, setIndexMot, getMotsComplet, getMots, setMots } from './dictionnaire.js';
import { initialiserMenusLangues } from './interface.js';
import { envoyerMessage, activerMicroEtComparer } from './chatbot.js';
import { nettoyerTexte, debounce } from './utils.js';

window.addEventListener('DOMContentLoaded', () => {
  // Initialisation des données
  chargerDonnees();
  initialiserMenusLangues();

  // Recherche dans le dictionnaire avec debounce
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('input', debounce(() => {
      const query = nettoyerTexte(searchBar.value.trim());
      const motsComplet = getMotsComplet();
      const resultats = query
        ? motsComplet.filter(m =>
            Object.values(m).some(val =>
              typeof val === 'string' && nettoyerTexte(val).includes(query)
            )
          )
        : [...motsComplet];

      setMots(resultats);
      resultats.length ? afficherMot(0) : (
        document.getElementById('motTexte').textContent = "Aucun résultat",
        document.getElementById('definition').textContent = "",
        document.getElementById('compteur').textContent = "0 / 0"
      );
    }));
  }

  // Navigation entre les mots
  document.getElementById('btnPrev')?.addEventListener('click', () => {
    setIndexMot(getIndexMot() - 1);
    afficherMot();
  });

  document.getElementById('btnNext')?.addEventListener('click', () => {
    setIndexMot(getIndexMot() + 1);
    afficherMot();
  });

  // Microphone / reconnaissance vocale
  document.getElementById('btnPrononcer')?.addEventListener('click', activerMicroEtComparer);

  // Envoi dans le chat
  document.getElementById('btnEnvoyer')?.addEventListener('click', envoyerMessage);

  // Gestion des onglets principaux (onglet visuel dans le menu)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
});
