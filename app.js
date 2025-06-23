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

    const [motsRes, interfaceRes, histoireRes, reponsesAudioRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get(`data/${histoireFile}`),
      axios.get('data/reponses-audio.json')
    ]);

    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;
    window.histoireDocs = histoireRes.data;
    window.reponsesAudio = reponsesAudioRes.data;

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

function jouerAudio(path) {
  const audio = new Audio(path);
  audio.play().catch(err => {
    alert("⚠️ Impossible de lire l'audio.");
    console.error("Audio error:", err);
  });
}

function activerMicroEtComparer() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("🎤 Reconnaissance vocale non prise en charge sur ce navigateur.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    recoActive = true;
    afficherMessage('bot', "🎙️ Parlez maintenant...");
  };

  recognition.onresult = (event) => {
    const result = event.results[0][0].transcript.trim().toLowerCase();
    console.log("Tu as dit :", result);

    const matchAudio = (window.reponsesAudio || []).find(entry =>
      entry.entree.some(e => e.toLowerCase() === result)
    );

    if (matchAudio) {
      afficherMessage('bot', escapeHTML(matchAudio.reponseTexte));
      jouerAudio(`audio/${matchAudio.fichierAudio}`);
      return;
    }

    const entree = motsComplet.find(m =>
      Object.entries(m).some(([langue, mot]) =>
        langue !== 'cat' && typeof mot === 'string' && mot.toLowerCase() === result
      )
    );

    if (entree) {
      const langueTrouvee = Object.entries(entree).find(([langue, mot]) =>
        langue !== 'cat' && typeof mot === 'string' && mot.toLowerCase() === result
      )?.[0];

      let message = `🗣️ Mot reconnu : <strong>${escapeHTML(result)}</strong><br>`;
      message += `🌍 Langue : <strong>${nomsLangues[langueTrouvee] || langueTrouvee}</strong><br>`;
      message += `🔁 Traductions :<br>`;
      Object.entries(entree).forEach(([k, v]) => {
        if (k !== 'cat') {
          message += `<strong>${k.toUpperCase()}</strong> : ${escapeHTML(v)}<br>`;
        }
      });
      afficherMessage('bot', message);
    } else {
      const docs = (window.histoireDocs || []).filter(doc =>
        (doc.titre && doc.titre.toLowerCase().includes(result)) ||
        (doc.contenu && doc.contenu.toLowerCase().includes(result)) ||
        (doc.motsCles || []).some(m => m.toLowerCase() === result)
      );

      if (docs.length) {
        const msg = docs.map(doc =>
          `<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}`
        ).join('<br><br>');
        afficherMessage('bot', msg);
      } else {
        afficherMessage('bot', `❌ Aucun mot ou document trouvé pour : <strong>${escapeHTML(result)}</strong>`);
      }
    }
  };

  recognition.onerror = () => {
    afficherMessage('bot', "❌ Erreur de reconnaissance vocale.");
  };

  recognition.onend = () => {
    recoActive = false;
  };

  recognition.start();
}

window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  document.getElementById('searchBar').addEventListener('input', rechercherMotDebounce);
  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', motPrecedent);
  document.getElementById('btnNext').addEventListener('click', motSuivant);
  document.getElementById('btnPrononcer').addEventListener('click', activerMicroEtComparer);
});
