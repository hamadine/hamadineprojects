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
    interfaceLangue = interfaceData(langueInterface);

    // Afficher le premier mot
    afficherMot();
  } catch (e) {
    alert("Erreur de chargement des données : " + e.message);
  }
}

// Affichage d'un mot et de sa traduction
function afficherMot(motIndex = indexMot) {
  if (!m`;
    return;
  }
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  const mot = mots[indexMot];

  document.getElementById('motTexte').textContent = mot.mot || '';
  document.getElementById('definition').innerHTML =
    (mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '');

  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;

  // Dés ['btnPlay', 'btnReplay', 'btnAuto'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });
}

// Navigation
function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1();
    afficherMot(0);
    return;
  }
  const resultats = fuse.search(query);
  if (resultats.length) {
    mots = resultats.map(r => r.item);
    afficherMot(0);
  } else {
    mots = [];
    afficherMot();
  }
}

// Changer la langue de}

// Changer la langue de l'interface
function changerLangueInterface(lang) {
  langueInterface = lang;
  const t = interfaceLangue[lang] || interfaceLangue['fr'];
  if (!t) return;
  document.getElementById('titrePrincipal').textContent = t.titrePrincipal ||"} ▶️`;
  document.getElementById('btnPlay').textContent = `▶️ ${t.ecouter || "Écouter"}`;
  document.getElementById('btnReplay').textContent = `⟳ ${t.rejouer || "Réécouter"}`;
  document.getElementById('btnAuto').textContent = `▶️ ${t.lectureAuto || "Lecture auto"}`;
  document.getElementById('chat-title').textContent = t.chatTitre || "Chat Tadaksahak";
  document.getElementById('btnEnvoyer').textContent = t.envoyer || "EnvoyersearchBar').placeholder = t.searchPlaceholder || "Rechercher un mot...";
  document.getElementById('botIntro').innerHTML = t.botIntro || "";
  if(document.getElementById('histoire-title')) document.getElementById('histoire-title').textContent = t.histoireTitle || "";
  if(document.getElementById('histoire-message')) document.get const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;
  afficherMessage('utilisateur', message);

  setTimeout(() => {
    const t = interfaceLangue[langueInterface] || interfaceLangue['fr'];
    afficherMessage('bot', t.restrong>${auteur === 'bot' ? 'Hamadine' : 'Vous'} :</strong> ${texte}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Fonctions audio (à personnaliser)
function jouerTadaksahak() {}
function rejouerMot() {}
function lectureAuto() {}

window.addEventListener('DOMContentLoaded', chargerDonnees);
