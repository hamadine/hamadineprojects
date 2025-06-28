import { escapeHTML } from './utils.js';
import { changerLangueInterface } from './interface.js';
import { afficherMot } from './dictionnaire.js';

export let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;

const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
export let langueTrad = localStorage.getItem('langueTrad') || 'fr';
export let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;

export async function chargerDonnees() {
  try {
    const histoireFile = langueInterface === 'ar' ? 'histoire-ar.json' : 'histoire.json';
    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get(`data/${histoireFile}`)
    ]);

    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;
    window.histoireDocs = histoireRes.data;

    changerLangueInterface(langueInterface);
    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (e) {
    alert("Erreur de chargement des données.");
    console.error(e);
  }
}

export function getMots() {
  return mots;
}

export function setMots(val) {
  mots = val;
}

export function getMotsComplet() {
  return motsComplet;
}

export function getIndexMot() {
  return indexMot;
}

export function setIndexMot(val) {
  indexMot = val;
}
