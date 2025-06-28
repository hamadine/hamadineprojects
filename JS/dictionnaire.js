import { escapeHTML } from './utils.js';
import { getMots, getMotsComplet, setMots, getIndexMot, setIndexMot, langueTrad } from './data-loader.js';

export function afficherMot(motIndex = getIndexMot()) {
  const mots = getMots();
  if (!mots.length) return;
  const idx = Math.max(0, Math.min(mots.length - 1, motIndex));
  setIndexMot(idx);
  localStorage.setItem('motIndex', idx);

  const mot = mots[idx];
  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML =
    escapeHTML(mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${escapeHTML(mot.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${idx + 1} / ${mots.length}`;
}

export function filtrerEtAfficherMot(query) {
  const motsComplet = getMotsComplet();
  const nettoyerTexte = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const motsFiltres = query
    ? motsComplet.filter(m =>
        Object.values(m).some(val => typeof val === 'string' && nettoyerTexte(val).includes(nettoyerTexte(query)))
      )
    : [...motsComplet];

  setMots(motsFiltres);
  motsFiltres.length ? afficherMot(0) : afficherAucunResultat();
}

function afficherAucunResultat() {
  document.getElementById('motTexte').textContent = "Aucun résultat";
  document.getElementById('definition').textContent = "";
  document.getElementById('compteur').textContent = "0 / 0";
}
