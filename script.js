import { mots } from './data/mots.js';
let lectureActive = false;
let autoLectureTimeout;
function afficherMot() {
  const mot = mots[index];
  document.getElementById("motTexte").innerText = mot?.mot || "—";
document.getElementById("definition").innerText = mot?.[langue] || "";
document.getElementById("compteur").innerText = `${index + 1} / ${mots.length}`;

  // Boutons audio désactivés (visuel uniquement)
  document.querySelectorAll("#audioButtons button").forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  });
}

function changerLangue(l) {
  langue = l;
  afficherMot();
}

function motSuivant() {
  index = (index + 1) % mots.length;
  afficherMot();
}

function motPrecedent() {
  index = (index - 1 + mots.length) % mots.length;
  afficherMot();
}

function jouerTadaksahak(i = index) {
  // Audio désactivé (fonction présente mais inactive visuellement)
  const audio = new Audio("audios/" + mots[i].audio);
  audio.play().catch(e => console.warn("Audio indisponible : " + e.message));
}

function rejouerMot() {
  jouerTadaksahak(index);
}

function lectureAuto() {
  if (lectureActive) {
    lectureActive = false;
    clearTimeout(autoLectureTimeout);
    return;
  }
  lectureActive = true;
  lectureMot(index);
}

function lectureMot(i) {
  if (!lectureActive || i >= mots.length) {
    lectureActive = false;
    return;
  }
  index = i;
  afficherMot();
  jouerTadaksahak(i);
  autoLectureTimeout = setTimeout(() => lectureMot(i + 1), 4000);
}

function rechercherMot() {
  const terme = document.getElementById("searchBar").value.toLowerCase();
  const found = mots.find(m =>
    m.mot.toLowerCase().includes(terme) || m[langue]?.toLowerCase().includes(terme)
  );
  if (found) {
    index = mots.indexOf(found);
    afficherMot();
  } else {
    document.getElementById("motTexte").innerText = "Mot non trouvé";
    document.getElementById("definition").innerText = "";
    document.getElementById("compteur").innerText = "";
  }
}

function envoyerMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const chatWindow = document.getElementById("chatWindow");
  const msgDiv = document.createElement("div");
  msgDiv.textContent = "Vous : " + message;
  msgDiv.style.fontWeight = "bold";
  chatWindow.appendChild(msgDiv);

  const réponse = mots.find(m =>
    m.mot.toLowerCase() === message.toLowerCase() ||
    m[langue]?.toLowerCase().includes(message.toLowerCase())
  );

  const botDiv = document.createElement("div");
  botDiv.textContent = réponse
    ? `Bot : ${réponse.mot} = ${réponse[langue]}`
    : "Bot : Je ne connais pas ce mot.";
  chatWindow.appendChild(botDiv);

  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = "";
}

window.onload = () => {
  afficherMot();

  const chatWindow = document.getElementById("chatWindow");
  const accueil = document.createElement("div");
  accueil.textContent = "Bot : Bonjour, je m'appelle Hamadine. Quel mot cherchez-vous ?";
  chatWindow.appendChild(accueil);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};