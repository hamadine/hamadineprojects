let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;

const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;

const nomsLangues = {
  fr: "Français", en: "English", ar: "العربية", tz: "Tamazight",
  tr: "Türkçe", da: "Dansk", de: "Deutsch", nl: "Nederlands",
  sv: "Svenska", ru: "Русский", zh: "中文", cs: "Čeština",
  ha: "Hausa", es: "Español", it: "Italiano"
};

let fuse = null;

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function chargerDonnees() {
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

    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!Object.keys(mots[0] || {}).includes(langueTrad)) langueTrad = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(mots[0]).filter(k => k !== 'cat' && k.length <= 3)],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (e) {
    console.error("❌ Erreur de chargement :", e);
    alert("Erreur de chargement des fichiers JSON. Vérifie le dossier /data/");
  }
}
if (resultats.length) {
  const bloc = resultats.map(doc => {
    const titreSanit = doc.titre
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, '-').toLowerCase();

    const audioPath = `audio/${titreSanit}.mp3`;

    return `
      <strong>${escapeHTML(doc.titre)}</strong><br>
      ${escapeHTML(doc.contenu)}<br><br>
      <button onclick="jouerAudio('${audioPath}')">🔊 Écouter en Tadaksahak</button>
    `;
  }).join('<br><br>');

  return afficherMessage('bot', bloc);
}
function jouerAudio(path) {
  const audio = new Audio(path);
  audio.play().catch(err => {
    alert("⚠️ Impossible de lire l'audio.");
    console.error("Audio error:", err);
  });
}
window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  document.getElementById('searchBar').addEventListener('input', rechercherMotDebounce);
  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', motPrecedent);
  document.getElementById('btnNext').addEventListener('click', motSuivant);
  document.getElementById('btnPrononcer').addEventListener('click', activerMicroEtComparer);
});
