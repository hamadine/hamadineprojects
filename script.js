let mots = [];
let index = 0;

// Chargement du JSON
fetch("data/mots.json")
  .then(res => res.json())
  .then(data => {
    mots = data;
    afficherMot();
  });

function afficherMot() {
  const mot = mots[index] || {};
  document.getElementById("motTexte").innerText = mot.mot || "—";
  document.getElementById("definition").innerText = mot.fr || "";
  document.getElementById("compteur").innerText = `${index + 1} / ${mots.length}`;

  // Désactive les boutons audio (adapte si tu veux l’audio plus tard)
  ["btnPlay", "btnReplay", "btnAuto"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });
}

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

function envoyerMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  // Message utilisateur
  const div = document.createElement("div");
  div.textContent = "Vous : " + message;
  div.style.fontWeight = "bold";
  document.getElementById("chatWindow").appendChild(div);

  // Réponse simulée du bot
  const bot = document.createElement("div");
  bot.textContent = `Hamadine : Salut, je vous entends, mais ma base lexicale est encore en cours.`;
  document.getElementById("chatWindow").appendChild(bot);

  // Défilement automatique du chat vers le bas
  document.getElementById("chatWindow").scrollTop = document.getElementById("chatWindow").scrollHeight;

  input.value = "";
  input.focus();
}
