let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;
let langueTrad = 'fr';
let langueInterface = 'fr';
let fuse;

// Chargement initial des données
async function chargerDonnees() {
  try {
    // Charger dictionnaire
    const motsData = await fetch('./data/mots.json').then(r => r.json());
    motsComplet = motsData;
    mots = [...motsData];

    // Charger interface multilingue
    interfaceData = await fetch('./data/interface-langue.json').then(r => r.json());

    // Activer langue interface par défaut
    changerLangueInterface(langueInterface);

    // Initialiser recherche
    fuse = new Fuse(mots, {
      keys: ['mot', 'fr', 'en', 'ar'],
      includeScore: true,
      threshold: 0.4
    });

    // Afficher premier mot
    afficherMot();
  } catch (err) {
    alert("Erreur lors du chargement des données : " + err.message);
  }
}

// Afficher un mot
function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;

  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  const mot = mots[indexMot];

  document.getElementById('motTexte').textContent = mot.mot || '';
  document.getElementById('definition').innerHTML =
    (mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '');

  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

// Navigation
function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1);
}

function motSuivant() {
  if (indexMot < mots.length - 1) afficherMot(indexMot + 1);
}

// Recherche
function rechercherMot() {
  const query = document.getElementById('searchBar').value.trim();
  if (!query) {
    mots = [...motsComplet];
    afficherMot(0);
    return;
  }

  const resultats = fuse.search(query);
  if (resultats.length) {
    mots = resultats.map(r => r.item);
    afficherMot(0);
  } else {
    mots = [];
    document.getElementById('motTexte').textContent = "Aucun résultat";
    document.getElementById('definition').textContent = "";
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

// Changer langue de traduction
function changerLangue(lang) {
  langueTrad = lang;
  afficherMot();
}

// Changer langue interface
function changerLangueInterface(lang) {
  langueInterface = lang;
  const t = interfaceData[lang] || interfaceData['fr'];
  if (!t) return;

  document.title = t.titrePrincipal || "";
  document.getElementById('titrePrincipal').textContent = t.titrePrincipal || "";
  document.getElementById('textePresentation').innerHTML = t.presentation || "";
  document.getElementById('btnPlay').textContent = `▶️ ${t.ecouter || "Écouter"}`;
  document.getElementById('btnReplay').textContent = `⟳ ${t.rejouer || "Réécouter"}`;
  document.getElementById('btnAuto').textContent = `▶️ ${t.lectureAuto || "Lecture auto"}`;
  document.getElementById('btnEnvoyer').textContent = t.envoyer || "Envoyer";
  document.getElementById('chat-title').textContent = t.chatTitre || "Chat Tadaksahak";

  const searchBar = document.getElementById('searchBar');
  if (searchBar) searchBar.placeholder = t.searchPlaceholder || "";

  const chatInput = document.getElementById('chatInput');
  if (chatInput) chatInput.placeholder = t.placeholderChat || "";

  const botIntro = document.getElementById('botIntro');
  if (botIntro) botIntro.innerHTML = t.botIntro || "";

  const histoireTitle = document.getElementById('histoire-title');
  if (histoireTitle) histoireTitle.textContent = t.histoireTitle || "";

  const histoireMessage = document.getElementById('histoire-message');
  if (histoireMessage) histoireMessage.innerHTML = t.histoireBientot || "";

  const footer = document.getElementById('footerText');
  if (footer) footer.innerHTML = t.footerText || "";

  // Mémoriser pour usage dans le bot
  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";
}

// Chat
function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  afficherMessage('utilisateur', message);
  input.value = '';

  setTimeout(() => {
    afficherMessage('bot', window.reponseBot);
  }, 500);
}

function afficherMessage(auteur, texte) {
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = `message ${auteur}`;
  const nom = auteur === 'bot' ? 'Hamadine' : (window.nomUtilisateur || "Vous");
  div.innerHTML = `<strong>${nom} :</strong> ${texte}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Audio - à personnaliser plus tard
function jouerTadaksahak() {
  console.log("Lecture du mot Tadaksahak (fonction à implémenter)");
}

function rejouerMot() {
  console.log("Relecture du mot (fonction à implémenter)");
}

function lectureAuto() {
  console.log("Lecture automatique (fonction à implémenter)");
}

// Init
window.addEventListener('DOMContentLoaded', chargerDonnees);
