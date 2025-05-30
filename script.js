let mots = [];
let index = 0;

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

  // Audio toujours désactivé sans message
  ["btnPlay", "btnReplay", "btnAuto"].forEach(id => {
    const btn = document.getElementById(id);
    btn.disabled = true;
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
  const input = document.getElementBy"definition("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const div = document.createElement("div");
  div.textContent = "Vous : " + message;
  div.style.fontWeight = "bold";
  document.getElementById("chatWindow").appendChild(div);

  // Réponse simulée
  const bot = document.createElement("div");
  bot.textContent = `Hamadine : Je vous entends, mais ma base lexicale est encore en cours.`;
  document.getElementById("chatWindow").appendChild(bot);

  input.value = "";
}