let mots = [];
let index = 0;
let interfaceTrads = {};
let langueCourante = "fr"; // Langue par défaut

// Chargement des traductions de l'interface
fetch("/Tadaksahak-Learning-/data/interface-langue.json")
  .then(res => res.json())
  .then(data => {
    interfaceTrads = data;
    appliquerTraductions();
  });

// Chargement des mots
fetch("/Tadaksahak-Learning-/data/mots.json")
  .then(res => res.json())
  .then(data => {
    mots = data;
    afficherMot();
  });

function afficherMot() {
  const mot = mots[index] || {};
  document.getElementById("motTexte").innerText = mot.mot || "—";
  // Affiche la traduction dans la langue courante si elle existe, sinon vide
  document.getElementById("definition").innerText = mot[langueCourante] || "";
  document.getElementById("compteur").innerText = `${index + 1} / ${mots.length}`;

  // Désactive les boutons audio (adapte si tu veux l’audio plus tard)
  ["btnPlay", "btnReplay", "btnAuto"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });
}

// Met à jour tous les textes d'interface selon la langue
function appliquerTraductions() {
  const t = interfaceTrads[langueCourante] || interfaceTrads["fr"];
  if (!t) return;
  if (document.getElementById("btnPrev")) document.getElementById("btnPrev").innerText = t.precedent;
  if (document.getElementById("btnNext")) document.getElementById("btnNext").innerText = t.suivant;
  if (document.getElementById("btnPlay")) document.getElementById("btnPlay").innerText = t.ecouter;
  if (document.getElementById("btnReplay")) document.getElementById("btnReplay").innerText = t.rejouer;
  if (document.getElementById("btnAuto")) document.getElementById("btnAuto").innerText = t.lectureAuto;
  if (document.getElementById("chatTitre")) document.getElementById("chatTitre").innerText = t.chatTitre;
  if (document.getElementById("btnEnvoyer")) document.getElementById("btnEnvoyer").innerText = t.envoyer;
  if (document.getElementById("chatInput")) document.getElementById("chatInput").placeholder = t.searchPlaceholder;
}

// Change la langue de l'interface et du mot affiché
function changerLangue(langue) {
  langueCourante = langue;
  appliquerTraductions();
  afficherMot();
}

// Navigation
function motSuivant() {
  if (!mots.length) return;
  index = (index + 1) % mots.length;
  afficherMot();
}
function motPrecedent() {
  if (!mots.length) return;
  index = (index - 1 + mots.length) % mots.length;
  afficherMot();
}

// Chat
function envoyerMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  // Message utilisateur
  const div = document.createElement("div");
  div.textContent = (interfaceTrads[langueCourante]?.envoyer || "Vous") + " : " + message;
  div.style.fontWeight = "bold";
  document.getElementById("chatWindow").appendChild(div);

  // Réponse simulée du bot (peux adapter le message par langue si tu veux)
  const bot = document.createElement("div");
  bot.textContent = "Hamadine : Salut, je vous entends, mais ma base lexicale est encore en cours.";
  document.getElementById("chatWindow").appendChild(bot);

  // Défilement automatique du chat vers le bas
  document.getElementById("chatWindow").scrollTop = document.getElementById("chatWindow").scrollHeight;

  input.value = "";
  input.focus();
}

// Optionnel : Pour ajouter les boutons de changement de langue dynamiquement
// (Sinon, fais-le dans ton HTML et lie chaque bouton à changerLangue('code_langue'))

// Exemples d'ajout dans le HTML :
// <button onclick="changerLangue('fr')">FR</button>
// <button onclick="changerLangue('en')">EN</button>
// ...
