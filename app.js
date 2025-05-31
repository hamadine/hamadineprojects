let motsComplet = [];
let mots = [];
let interfaceLangue = {};
let indexMot = 0;
let langueTrad = 'fr';
let langueInterface = 'fr';
let fuse;

// Chargement initial de toutes les données
async function chargerDonnees() {
  try {
    // Chargement du dictionnaire
    const motsData = await fetch('./data/mots.json').then(r => r.json());
    motsComplet = motsData;
    mots = motsData.slice();

    // Chargement des textes d'interface
    const interfaceData = await fetch('./data/interface-langue.json').then(r => r.json());
    interfaceLangue = interfaceData;

    // Initialiser Fuse.js pour la recherche floue
    fuse = new Fuse(motsComplet, {
      keys: ['mot', ...Object.keys(motsComplet[0]).filter(k => !['mot', 'cat'].includes(k))],
      threshold: 0.3
    });

    // Appliquer la langue de l'interface détectée
    changerLangueInterface(langueInterface);

    // Afficher le premier mot
    afficherMot();
 (motIndex = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  const mot = mots[indexMot];

  document.getElementById('motTexte').textContent = mot.mot || '';
  document.getElementById('definition').innerHTML =
    (mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '');

  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;

  // Désactive audio (à activer selon tes besoins)
  ['btnPlay', 'btnReplay', 'btnAuto'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });
}

// Navigation
function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1);
}
function motSuivant() {
  if (indexMot < mots.length - 1) afficherMot(indexMot + 1);
}

// Recherche floue avec Fuse.js
function rechercherMot() {
  const query = document.getElementById('searchBar').value.trim();
  if (!query) {
    mots = motsComplet.slice();
    afficherMot(0);
    return;
  }
  const resultats = fuse.search(query);
  if (resultats.length) {
    mots = resultats.map(r => r.item);
    afficherMot(0);
  } else {
    mots = [];
    document.getElementById('motTexte').textContent =('definition').innerHTML = '';
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

// Changer la langue de traduction
function changerLangue(lang) {
  langueTrad = lang;
  afficherMot();
}

// Changer la langue de l'interface
function changerLangueInterface(lang) {
  langueInterface = lang;
  const t = interfaceLangue[lang] || interfaceLangue['fr'];
  if (!t) return;
  document.getElementById('titrePrincipal').textContent = t.titrePrincipal || "";
  document.getElementById('presentation').inner "";
  document.getElementById('btnPrev').textContent = `◀️ ${t.precedent || "Précédent"}`;
  document.getElementById('btnNext').textContent = `${t.suivant || "Suivant"} ▶️`;
  document.getElementById('btnPlay').textContent = `▶️ ${t.ecouter || "Écouter"}`;
  document.getElementById('btnReplay').textContent = `⟳ ${t.rejouer || "Réécouter"}`;
  document.getElementById('btnAuto').textContent = `▶️ ${t.lecture}`;
  document.getElementById('chat-title').textContent = t.chatTitre || "Chat Tadaksahak";
  document.getElementById('btnEnvoyer').textContent = t.envoyer || "Envoyer";
  document.getElementById('footerText').innerHTML = t.footerText || "";
  document.getElementById('searchBar').placeholder = t.searchPlaceholder || "Rechercher un mot...";
  document.getElementById('botIntro').innerHTML = t.botIntro || "";
  // Optionnel selon tes sections
  if(document.getElementById('histoire-title')) document.getElementById('histoire-title').textContent = t.histoireTitle || "";
  if(document.getElementById('histoire-message')) document.getElementById('histoire-message').innerHTML = t.histoireBientot || "";
  document.getElementById('chatInput').placeholder = t.placeholderChat || "";
}

// Gestion du chat bot (simulation)
function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;
  afficherMessage('utilisateur', message);

  setTimeout(() => {
    const t = interfaceLangue[langueInterface] || interfaceLangue['fr'];
    afficherMessage('bot', t.reponseBot || "Je n'ai pas trouvé ce mot.");
  }, 400);

  input.value = "";
}

function afficherMessage(auteur, texte) {
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div auteur === 'bot' ? 'chat-bot' : 'chat-user';
  div.innerHTML = `<strong>${auteur === 'bot' ? 'Hamadine' : 'Vous'} :</strong> ${texte}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Fonctions audio (à personnaliser)
function jouerTadaksahak() {}
function rejouerMot() {}
function lectureAuto() {}

window.addEventListener('DOMContentLoaded', chargerDonnees);
