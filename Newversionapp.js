// app.js - version améliorée avec reconnaissance vocale multilingue + traduction complète

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

const phrasesMultilingues = {
  fr: /comment (on )?dit[- ]?on (.+?) en ([a-z]+)/i,
  en: /how (do )?you say (.+?) in ([a-z]+)/i,
  ar: /كيف (نقول|أقول|يقول) (.+?) (بال|في) ([a-z]+)/i
  // Ajouter d'autres langues ici si nécessaire
};

let fuse = null;

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function chargerDonnees() {
  try {
    const histoireFile = langueInterface === 'ar' ? 'histoire-ar.json' : 'histoire.json';

    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get('data/' + histoireFile)
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
function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  localStorage.setItem('motIndex', indexMot);

  const mot = mots[indexMot];
  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML =
    escapeHTML(mot[langueTrad] || '—') +
    (mot.cat ? ` <span style="color:#888;">(${escapeHTML(mot.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

function genererTraductions(motObj) {
  const lignes = [`<strong>Tadaksahak</strong>: ${escapeHTML(motObj.mot)}`];
  for (const [code, nom] of Object.entries(nomsLangues)) {
    if (motObj[code]) {
      lignes.push(`<strong>${nom}</strong>: ${escapeHTML(motObj[code])}`);
    }
  }
  return lignes.join('<br>') + (motObj.cat ? ` <em>(${escapeHTML(motObj.cat)})</em>` : '');
}

function activerMicroEtComparer() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("🎤 Reconnaissance vocale non prise en charge.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.onstart = () => afficherMessage('bot', "🎙️ Parlez maintenant...");
  recognition.onresult = (event) => {
    const result = event.results[0][0].transcript.trim().toLowerCase();
    const motTrouve = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && val.toLowerCase() === result)
    );
    if (motTrouve) {
      afficherMessage('bot', genererTraductions(motTrouve));
    } else {
      rechercherDansHistoire(result);
    }
  };
  recognition.onerror = () => afficherMessage('bot', "❌ Erreur de reconnaissance.");
  recognition.start();
}

function rechercherDansHistoire(message) {
  const resultats = (window.histoireDocs || []).filter(doc =>
    (doc.titre && doc.titre.toLowerCase().includes(message)) ||
    (doc.contenu && doc.contenu.toLowerCase().includes(message)) ||
    (doc.motsCles || []).some(m => message.includes(m.toLowerCase()))
  );

  if (resultats.length) {
    const bloc = resultats.map(doc => {
      const titreSanit = doc.titre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, '-').toLowerCase();
      const audioPath = `audio/${titreSanit}.mp3`;

      return `<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}<br><br><button onclick="jouerAudio('${audioPath}')">🔊 Écouter en Tadaksahak</button>`;
    }).join('<br><br>');
    afficherMessage('bot', bloc);
  } else {
    afficherMessage('bot', "❓ Je ne comprends pas ce mot.");
  }
}
function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;
  afficherMessage('utilisateur', escapeHTML(message));
  input.value = '';

  const data = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  if (!data) return afficherMessage('bot', "Je n'ai pas de réponses pour le moment.");

  const phraseRegex = phrasesMultilingues[langueInterface] || phrasesMultilingues['fr'];
  const match = message.match(phraseRegex);

  if (match) {
    const motCherche = match[2].trim();
    const langueCible = match[3] || match[4] || 'fr';
    const entree = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && val.toLowerCase() === motCherche)
    );

    if (entree && entree[langueCible]) {
      const rep = `<strong>${escapeHTML(motCherche)}</strong> en ${nomsLangues[langueCible]} : <strong>${escapeHTML(entree[langueCible])}</strong><br>Mot Tadaksahak : <strong>${escapeHTML(entree.mot)}</strong>`;
      return afficherMessage('bot', rep);
    } else {
      return afficherMessage('bot', data.inconnu || "Je ne comprends pas.");
    }
  }

  const exacts = motsComplet.filter(m =>
    Object.values(m).some(val => typeof val === 'string' && val.toLowerCase() === message)
  );
  if (exacts.length) {
    return afficherMessage('bot', exacts.map(genererTraductions).join('<br><br>'));
  }

  rechercherDansHistoire(message);
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (window.nomUtilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function jouerAudio(path) {
  const audio = new Audio();
  audio.src = path;

  audio.onerror = () => {
    afficherMessage('bot', `⚠️ Audio indisponible pour ce mot : <code>${path}</code>`);
  };

  audio.oncanplaythrough = () => {
    audio.play().catch(err => {
      console.error("Erreur lecture audio:", err);
      afficherMessage('bot', "⚠️ Impossible de lire l'audio.");
    });
  };
}

window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  document.getElementById('searchBar').addEventListener('input', () => {
    const query = document.getElementById('searchBar').value.trim().toLowerCase();
    if (!query) {
      mots = [...motsComplet];
      afficherMot(0);
      return;
    }
    const resultats = fuse.search(query);
    mots = resultats.map(r => r.item);
    if (mots.length) afficherMot(0);
    else {
      document.getElementById('motTexte').textContent = "Aucun résultat";
      document.getElementById('definition').textContent = "";
      document.getElementById('compteur').textContent = "0 / 0";
    }
  });

  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', () => afficherMot(indexMot - 1));
  document.getElementById('btnNext').addEventListener('click', () => afficherMot(indexMot + 1));
  document.getElementById('btnPrononcer')?.addEventListener('click', activerMicroEtComparer);
});
