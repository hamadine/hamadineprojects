// --- Variables globales ---
let mots = [];
let motsFiltres = [];
let index = 0;
let interfaceTrads = {};
let langueCourante = "fr"; // Langue de traduction des mots (si tu veux ajouter ce bouton plus tard)
let langueInterface = "fr"; // Langue de l'interface
let motsInconnus = JSON.parse(localStorage.getItem('motsInconnus') || '[]');
let fuse; // Pour Fuse.js (recherche fuzzy)

// --- Chargement des traductions d'interface ---
fetch("./data/interface-langue.json")
  .then(res => res.json())
  .then(data => {
    interfaceTrads = data;
    appliquerTraductionsInterface();
  });

// --- Chargement des mots + configuration Fuse ---
fetch("./data/mots.json")
  .then(res => res.json())
  .then(data => {
    mots = data;
    motsFiltres = data;
    // Configuration de Fuse.js pour recherche fuzzy sur toutes les langues et exemples
    fuse = new Fuse(mots, {
      keys: [
        "mot", "fr", "en", "ar", "ru", "de", "es", "it", "nl", "da", "cs",
        "exemple", "exemples"
      ],
      threshold: 0.4, // plus bas = plus strict, plus haut = plus tolérant
      ignoreLocation: true,
      minMatchCharLength: 2
    });
    afficherMot();
  });

// --- Fonctions principales ---

function afficherMot() {
  const mot = motsFiltres[index] || {};
  document.getElementById("motTexte").innerText = mot.mot || "—";
  document.getElementById("definition").innerText = mot[langueCourante] || "";
  document.getElementById("compteur").innerText = `${motsFiltres.length ? (index + 1) : 0} / ${motsFiltres.length}`;
}

function appliquerTraductionsInterface() {
  const t = interfaceTrads[langueInterface] || interfaceTrads["fr"];
  if (!t) return;
  // Utiliser innerText pour tout sauf section Histoire (HTML potentiellement)
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
  };
  setText("titre", t.titrePrincipal);
  setText("footer-desc", t.footerText);
  setText("btnPrev", "◀️ " + t.precedent);
  setText("btnNext", t.suivant + " ▶️");
  setText("chat-title", t.chatTitre);
  setText("btnEnvoyer", t.envoyer);
  setText("histoire-title", t.histoireTitle);

  // Section histoire - innerHTML pour supporter ponctuellement du HTML
  const histoireMsg = document.getElementById("histoire-message");
  if (histoireMsg) histoireMsg.innerHTML = t.histoireBientot;

  // Placeholders
  const searchBar = document.getElementById("searchBar");
  if (searchBar) searchBar.placeholder = t.searchPlaceholder;
  const chatInput = document.getElementById("chatInput");
  if (chatInput) chatInput.placeholder = t.placeholderChat || "";

  // Direction RTL pour l'arabe
  if(langueInterface === "ar") {
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

    // Exemples : supporte "exemple" (string) et "exemples" (array)
    if (motObj.exemples && Array.isArray(motObj.exemples) && motObj.exemples.length) {
      rep += `<br><i>${t.exemple || "Exemple(s)"} :</i><ul>`;
      rep += motObj.exemples.map(ex => `<li>${ex}</li>`).join("");
      rep += "</ul>";
    } else if (motObj.exemple) {
      rep += `<br><i>${t.exemple || "Exemple"} :</i> ${motObj.exemple}`;
    }

    bot.innerHTML = rep;
  } else {
    bot.textContent = t.reponseBotInconnu || "Hamadine : Merci ! Je travaille d’arrache-pied pour rendre plus de mots disponibles. Je viens d’apprendre ce mot de votre part.";
    if (!motsInconnus.includes(message.toLowerCase())) {
      motsInconnus.push(message.toLowerCase());
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
