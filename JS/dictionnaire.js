import axios from 'axios';
import { escapeHTML } from './utils.js';

export let motsComplet = [];
export let mots = [];
export let indexMot = 0;
export let interfaceData = {};
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || (navigator.language || 'fr').slice(0, 2);

export async function chargerDonnees() {
  try {
    const histoireFile = langueInterface === 'ar' ? 'histoire-ar.json' : 'histoire.json';
    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get(`data/${histoireFile}`)
    ]);

    motsComplet = motsRes.data;
    mots.length = 0;
    mots.push(...motsComplet);
    interfaceData = interfaceRes.data;
    window.histoireDocs = histoireRes.data;

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (e) {
    alert("Erreur de chargement des données.");
    console.error(e);
  }
}

export function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  localStorage.setItem('motIndex', indexMot);

  const mot = mots[indexMot];
  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML =
    escapeHTML(mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${escapeHTML(mot.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}
