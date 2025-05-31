// --- Variables globales ---
let mots = [];
let motsFiltres = [];
let index = 0;
let interfaceTrads = {};
let langueCourante = "fr"; // Langue de traduction des mots
let langueInterface = "fr"; // Langue de l'interface
let deferredPrompt = null;

// --- Chargement des traductions d'interface ---
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

// --- Gestion bannière installation PWA ---
function checkInstallSuggestion() {
  let visites = parseInt(localStorage.getItem('tadaksahak_visites') || '0', 10) + 1;
  localStorage.setItem('tadaksahak_visites', visites);
  if (visites >= 3 && !window.matchMedia('(display-mode: standalone)').matches) {
    afficherBanniereInstall();
  }
}

function afficherBanniereInstall() {
  if (document.getElementById('banniere-install')) return;
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
      alert(traduireTexte("instructionsIOS", "Sur iPhone/iPad : ouvrez le menu de partage de Safari puis choisissez « Sur l’écran d’accueil »"));
      div.remove();
    }
  };
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
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
  // Désactive les boutons audio si pas d'audio (adapte si tu ajoutes l’audio plus tard)
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
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
  };
  setText("btnPrev", "◀️ " + (t.precedent || "Précédent"));
  setText("btnNext", (t.suivant || "Suivant") + " ▶️");
  setText("btnPlay", "▶️ " + (t.ecouter || "Écouter"));
  setText("btnReplay", "⟳ " + (t.rejouer || "Rejouer"));
  setText("btnAuto", "▶️ " + (t.lectureAuto || "Lecture auto"));
  setText("chat-title", t.chatTitre || "Chat Tadaksahak");
  setText("btnEnvoyer", t.envoyer || "Envoyer");
  // Placeholders
  const searchBar = document.getElementById("searchBar");
  if (searchBar) searchBar.placeholder = t.searchPlaceholder || "Chercher un mot dans toutes les langues...";
  const chatInput = document.getElementById("chatInput");
  if (chatInput) chatInput.placeholder = t.placeholderChat || "Tape ton mot ou ta question ici dans la langue de ton choix...";
  // Mise à jour bannière install si affichée
  if(document.getElementById('banniere-install')) {
    document.getElementById('banniere-install').remove();
    afficherBanniereInstall();
  }
}

function changerLangue(langue) {
  langueCourante = langue;
  afficherMot();
}

function changerLangueInterface(langue) {
  langueInterface = langue;
  appliquerTraductionsInterface();
}

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
  const div = document.createElement("div");
  div.textContent = (t.utilisateur || "Vous") + " : " + message;
  div.style.fontWeight = "bold";
  document.getElementById("chatWindow").appendChild(div);

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

// --- Expose fonctions globalement pour HTML inline events ---
window.changerLangue = changerLangue;
window.changerLangueInterface = changerLangueInterface;
window.motSuivant = motSuivant;
window.motPrecedent = motPrecedent;
window.rechercherMot = rechercherMot;
window.envoyerMessage = envoyerMessage;
