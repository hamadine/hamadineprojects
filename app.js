let mots = [];
let motsFiltres = [];
let index = 0;
let interfaceTrads = {};
let langueCourante = "fr"; // Langue de traduction des mots
let langueInterface = "fr"; // Langue de l'interface
let deferredPrompt = null;

// --- Chargement des traductions de l'interface ---
fetch("./data/interface-langue.json")
  .then(res => res.json())
  .then(data => {
    interfaceTrads = data;
    appliquerTraductionsInterface();
  });

// --- Chargement des mots ---
fetch("./data/mots.json")
  .then(res => res.json())
  .then(data => {
    mots = data;
    motsFiltres = data;
    afficherMot();
  });

// --- Suggestion d'installation PWA après 2 visites ---
function checkInstallSuggestion() {
  let visites = parseInt(localStorage.getItem('tadaksahak_visites') || '0', 10) + 1;
  localStorage.setItem('tadaksahak_visites', visites);
  // Affiche la suggestion après 2 visites, si non déjà installée
  if (visites >= 3 && !window.matchMedia('(display-mode: standalone)').matches) {
    afficherBanniereInstall();
  }
}

// Affiche une bannière d'installation personnalisée
function afficherBanniereInstall() {
  if (document.getElementById('banniere-install')) return; // évite doublon
  const div = document.createElement('div');
  div.id = "banniere-install";
  div.style = "position:fixed;bottom:0;left:0;right:0;background:#4682b4;color:white;padding:1em;text-align:center;z-index:9999;box-shadow:0 -2px 8px rgba(0,0,0,0.1);";
  div.innerHTML = `
    📱 ${traduireTexte("suggestionInstall", "Vous pouvez ajouter ce dictionnaire Tadaksahak à votre écran d'accueil pour l'utiliser comme une application !")}
    <button id="installPWA" style="margin-left:1em;font-weight:bold;">${traduireTexte("ajouter", "Ajouter")}</button>
    <button onclick="document.getElementById('banniere-install').remove()" style="margin-left:0.7em;">✖</button>
  `;
  document.body.appendChild(div);
  document.getElementById('installPWA').onclick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        div.remove();
      });
    } else {
      // Fallback instructions pour iOS
      alert(traduireTexte("instructionsIOS", "Sur iPhone/iPad : ouvrez le menu de partage de Safari puis choisissez « Sur l’écran d’accueil »"));
      div.remove();
    }
  };
}

// Intercepte l'événement beforeinstallprompt (PWA Android/Chrome)
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  // Affiche la bannière si on a passé le seuil de visites
  if (parseInt(localStorage.getItem('tadaksahak_visites')||'0',10) >= 3) {
    afficherBanniereInstall();
  }
});

window.addEventListener('DOMContentLoaded', checkInstallSuggestion);

// --- Fonctions principales ---

function afficherMot() {
  const mot = motsFiltres[index] || {};
  document.getElementById("motTexte").innerText = mot.mot || "—";
  document.getElementById("definition").innerText = mot[langueCourante] || "";
  document.getElementById("compteur").innerText = `${motsFiltres.length ? (index + 1) : 0} / ${motsFiltres.length}`;
  // Désactive les boutons audio (adapte si tu ajoutes l’audio plus tard)
  ["btnPlay", "btnReplay", "btnAuto"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = 0.5;
      btn.style.cursor = "not-allowed";
    }
  });
}

function appliquerTraductionsInterface() {
  const t = interfaceTrads[langueInterface] || interfaceTrads["fr"];
  if (!t) return;
  // Adaptation des textes d'interface
  const setText = (id, txt) => { if(document.getElementById(id)) document.getElementById(id).innerText = txt; };
  setText("btnPrev", "◀️ " + (t.precedent || "Précédent"));
  setText("btnNext", (t.suivant || "Suivant") + " ▶️");
  setText("btnPlay", "▶️ " + (t.ecouter || "Écouter"));
  setText("btnReplay", "⟳ " + (t.rejouer || "Rejouer"));
  setText("btnAuto", "▶️ " + (t.lectureAuto || "Lecture auto"));
  setText("chat-title", t.chatTitre || "Chat Tadaksahak");
  setText("btnEnvoyer", t.envoyer || "Envoyer");
  if(document.getElementById("searchBar")) document.getElementById("searchBar").placeholder = t.searchPlaceholder || "Chercher un mot dans toutes les langues...";
  if(document.getElementById("chatInput")) document.getElementById("chatInput").placeholder = t.placeholderChat || "Tape ton mot ou ta question ici dans la langue de ton choix...";
}

function changerLangue(langue) {
  langueCourante = langue;
  afficherMot();
}

function changerLangueInterface(langue) {
  langueInterface = langue;
  appliquerTraductionsInterface();
  // Mettre à jour la bannière si elle est affichée
  if(document.getElementById('banniere-install')) {
    document.getElementById('banniere-install').remove();
    afficherBanniereInstall();
  }
}

// --- Navigation ---
function motSuivant() {
  if (!motsFiltres.length) return;
  index = (index + 1) % motsFiltres.length;
  afficherMot();
}
function motPrecedent() {
  if (!motsFiltres.length) return;
  index = (index - 1 + motsFiltres.length) % motsFiltres.length;
  afficherMot();
}

// --- Recherche ---
function rechercherMot() {
  const q = document.getElementById("searchBar").value.trim().toLowerCase();
  if (!q) {
    motsFiltres = mots;
    index = 0;
    afficherMot();
    return;
  }
  motsFiltres = mots.filter(m =>
    Object.values(m).some(val =>
      typeof val === 'string' && val.toLowerCase().includes(q)
    )
  );
  index = 0;
  afficherMot();
}

// --- Chat ---
function envoyerMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const t = interfaceTrads[langueInterface] || interfaceTrads["fr"] || {};
  // Message utilisateur
  const div = document.createElement("div");
  div.textContent = (t.utilisateur || "Vous") + " : " + message;
  div.style.fontWeight = "bold";
  document.getElementById("chatWindow").appendChild(div);

  // Réponse bot (simple, statique, traduite si tu veux)
  const bot = document.createElement("div");
  bot.textContent = t.reponseBot || "Hamadine : Salut, je vous entends, mais ma base lexicale est encore en cours.";
  document.getElementById("chatWindow").appendChild(bot);

  document.getElementById("chatWindow").scrollTop = document.getElementById("chatWindow").scrollHeight;
  input.value = "";
  input.focus();
}

// --- Utilitaire traduction fallback ---
function traduireTexte(cle, defaut) {
  return (interfaceTrads[langueInterface] && interfaceTrads[langueInterface][cle]) || defaut || cle;
}

// --- Expose les fonctions globalement pour HTML inline events ---
window.changerLangue = changerLangue;
window.changerLangueInterface = changerLangueInterface;
window.motSuivant = motSuivant;
window.motPrecedent = motPrecedent;
window.rechercherMot = rechercherMot;
window.envoyerMessage = envoyerMessage;
