// --- Variables globales ---
let mots = [];
let motsFiltres = [];
let index = 0;
let interfaceTrads = {};
let langueCourante = "fr"; // Langue de traduction des mots (si');
let fuse; // Pour Fuse.js (recherche fuzzy)

// --- Chargement des traductions d'interface ---
fetch("./data/interface-langue.json")
  .then(res => res.json())
  .then(data => {
    interfaceTrads = data;
    appliquerTraductionsInterface();
  });

// --- Chargement des mots motsFiltres = data;
    // Configuration de Fuse.js pour recherche fuzzy sur toutes les langues et exemples
    fuse = new Fuse(mots, {
      keys: [
        "mot", "fr", "en", "ar", "ru", "de", "es", "it", "nl", "da", });
    afficherMot();
  });

// --- Fonctions principales ---

function afficherMot() {
  const mot = motsFiltres[index] || {};
  document.getElementById("motTexte").innerText = mot.mot || "—";
  document.getElementById("definition").innerText = mot[langue `${motsFiltres.length ? (index + 1) : 0} / ${motsFiltres.length}`;
}

function appliquerTraductionsInterface() {
  const t = interfaceTrads[langueInterface] || interfaceTrads["fr"];
  if (!t) return;
  // Utiliser innerText setText("footer-desc", t.footerText);
  setText("btnPrev", "◀️ " + t.precedent);
  setText("btnNext", t.suivant + " ▶️");
  setText("chat-title", t.chatTitre);
  setText("btnEnvoyer", t.envoyer);
 histoireMsg = document.getElementById("histoire-message");
  if (histoireMsg) histoireMsg.innerHTML = t.histoireBientot;

  // Placeholders
  const searchBar = document.getElementById("searchBar");
  if (searchBar) searchBar.placeholder = t.searchPlaceholder;
  === "ar") {
    document.body.dir = "rtl";
  } else {
    document.body.dir = "ltr";
  }

  // Titre de l'onglet navigateur
  document.title = t.titrePrincipal;
}

function changerLangue(langue) {
  langueCourante = langue;
  afficherMot();
}

function motSuivant() {
  if (!motsFiltres.length) return;
  index = (index + 1) % motsFiltres.length;
  afficherMot();
}

function motPrecedent() {
  if (!motsFiltres.length) return;
  index = (index - 1 +.trim().toLowerCase();
  if (!q) {
    motsFiltres = mots;
    index = 0;
    afficherMot();
    return;
  }
  // Utilisation de Fuse pour la recherche floue dans la liste principale
  if (fuse) {
    const results = fuse.search(q);
    motsFiltres = results.map(r => r.item);
  } else {
    motsFiltres = mots.filter(m =>
      Object.values(m).some(val =>
        typeof val === 'string' && val.toLowerCase().includes(q)
      )
    );
  }
  index = 0;
  afficherMot();
}

// --- Chat ---
function envoyerMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;
  const t = interfaceTrads[langueInterface] || interfaceTrads["fr"] || {};
  const chatWindow = document.getElementById("chatWindow");

  // Affiche le message utilisateur
  const div = document.createElement("div");
  div.textContent = (t.utilisateur || "Vous") + " : " + message;
  div.style.fontWeight = "bold";
  chatWindow.appendChild(div);

  // Recherche fuzzy dans le dictionnaire
  let result = (fuse && message) ? fuse.search(message) : [];

  const bot = document.createElement("div");
  if (result.length > 0) {
    const motObj = result[0].item;
    let rep = `<b>${motObj.mot}</b> : ${motObj[langueCourante] || ""}`;

    // Exemples : supporte "exemple" (string) et "exemples"Obj.exemples.length) {
      rep += `<br><i>${t.exemple || "Exemple(s)"} :</i><ul>`;
      rep += motObj.exemples.map(ex => `<li>${ex}</li>`).join("");
      rep += "</ul>";
    } else if (motObj.exemple) {
      rep += `<br><i>${t.exemple || "Exemple"} :</i> ${motObj.exemple}`;
    }

    bot.innerHTML = rep;
  } else {
    // Correction ici : utiliser t.reponseBot et NON t.reponseBotInconnu
    bot.textContent = t.reponseBot || "Hamadine : Merci ! Je travaille d’arrache-pied pour rendre plus de mots disponibles. Je viens d’apprendre ce mot de votre part.";
    if (!motsInconnus.includes(message.toLowerCase())) {
      motsInconnus.push(message.toLower());
      localStorage.setItem('motsInconnus', JSON.stringify(motsInconnus));
    }
  }
  chatWindow.appendChild(bot);

  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = "";
  input.focus();
}

// --- Expose fonctions globalement pour HTML inline events ---
window.changerLangue = changerLangue;
window.changerLangueInterface = changerLangueInterface;
window.motSuivant = motSuivant;
window.motPrecedent = motPrecedent;
window.rechercherMot = rechercherMot;
window.envoyerMessage = envoyerMessage;

// --- Application automatique des traductions à l'ouverture (sécurité) ---
window.onload = appliquerTraductionsInterface;
