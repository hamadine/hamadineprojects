import { traductionsUI } from './data/interface-langues.js';

let mots = [];
let index = 0;
let langue = "fr";
let lectureActive = false;
let autoLectureTimeout;

// Chargement dynamique du JSON
fetch("data/mots.json")
  .then(res => res.json())
  .then(data => {
    mots = data;

    // ✅ Cacher le bouton tz si la clé n’existe pas dans les données
    if (!mots.some(m => m.tz)) {
      const tzBtn = document.querySelector('[onclick*="tz"]');
      if (tzBtn) tzBtn.style.display = "none";
    }

    afficherMot();
  })
  .catch(e => {
    document.getElementById("motTexte").innerText = "Erreur de chargement : data/mots.json";
    document.getElementById("definition").innerText = "";
    document.getElementById("compteur").innerText = "";
  });

function afficherMot() {
  if (!mots.length) return;
  const mot = mots[index];

  document.getElementById("motTexte").innerText = mot?.mot || "—";
  document.getElementById("definition").innerText = mot?.[langue] || "";
  document.getElementById("compteur").innerText = `${index + 1} / ${mots.length}`;

  document.querySelectorAll("#audioButtons button").forEach(btn => {
    const hasAudio = !!mot?.audio;
    btn.disabled = !hasAudio;
    btn.style.opacity = hasAudio ? "1" : "0.5";
    btn.style.cursor = hasAudio ? "pointer" : "not-allowed";
  });

  document.getElementById("audioNote").innerText = mot?.audio ? "" : "Pas de fichier audio disponible.";
}

function changerLangue(l) {
  langue = l;
  afficherMot();
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

function jouerTadaksahak(i = index) {
  if (!mots.length) return;
  const audioFile = mots[i]?.audio;
  if (audioFile) {
    const audio = new Audio("audios/" + audioFile);
    audio.play().catch(e => {
      console.warn("Audio indisponible : " + e.message);
      lectureActive = false;
    });
  }
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

  const audioFile = mots[i]?.audio;
  if (audioFile) {
    const audio = new Audio("audios/" + audioFile);
    audio.onended = () => {
      if (lectureActive) lectureMot(i + 1);
    };
    audio.play().catch(e => {
      console.warn("Erreur audio :", e.message);
      lectureActive = false;
    });
  } else {
    // Pas d'audio → avance manuellement
    autoLectureTimeout = setTimeout(() => lectureMot(i + 1), 2500);
  }
}

function rechercherMot() {
  if (!mots.length) return;
  const terme = document.getElementById("searchBar").value.trim().toLowerCase();
  const normaliser = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const found = mots.find(m =>
    normaliser(m.mot).includes(normaliser(terme)) ||
    normaliser(m[langue] || "").includes(normaliser(terme))
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

  if (!mots.length) {
    const botDiv = document.createElement("div");
    botDiv.textContent = "Bot : Dictionnaire non chargé.";
    chatWindow.appendChild(botDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    input.value = "";
    return;
  }

  const normaliser = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const réponse = mots.find(m =>
    normaliser(m.mot) === normaliser(message) ||
    normaliser(m[langue] || "").includes(normaliser(message))
  );

  const botDiv = document.createElement("div");
  botDiv.textContent = réponse
    ? `Bot : ${réponse.mot} = ${réponse[langue]}`
    : "Bot : Je ne connais pas ce mot mais je le cherche. Contactez mon développeur Hamadine AG MOCTAR.";
  chatWindow.appendChild(botDiv);

  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = "";
  input.focus();
}

window.onload = () => {
  const chatWindow = document.getElementById("chatWindow");
  const accueil = document.createElement("div");
  accueil.textContent = `Bot : Bonjour, je m'appelle Hamadine. Demandez-moi un mot et je vous le donne. Il se peut que je ne connaisse pas certains mais je me bats pour vous en trouver. Le meilleur reste avenir. Alors vous êtes prêt ? Yallah بسم الله`;
  chatWindow.appendChild(accueil);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};
