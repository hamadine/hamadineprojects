import {
  chargerDonnees,
  afficherMot,
  indexMot,
  mots,
} from './dictionnaire.js';

import { nettoyerTexte } from './utils.js';

window.addEventListener('DOMContentLoaded', () => {
  // Chargement initial des données dictionnaire + interface
  chargerDonnees();

  // Recherche temps réel dans le dictionnaire
  document.getElementById('searchBar')?.addEventListener('input', () => {
    const query = nettoyerTexte(document.getElementById('searchBar').value.trim());
    if (!query) {
      afficherMot(0);
      return;
    }

    const results = mots.filter(m =>
      Object.values(m).some(val =>
        typeof val === 'string' && nettoyerTexte(val).includes(query)
      )
    );

    if (results.length) {
      mots.length = 0;
      mots.push(...results);
      afficherMot(0);
    } else {
      document.getElementById('motTexte').textContent = "Aucun résultat";
      document.getElementById('definition').textContent = "";
      document.getElementById('compteur').textContent = "0 / 0";
    }
  });

  // Navigation mot précédent/suivant
  document.getElementById('btnPrev')?.addEventListener('click', () => afficherMot(indexMot - 1));
  document.getElementById('btnNext')?.addEventListener('click', () => afficherMot(indexMot + 1));
});
