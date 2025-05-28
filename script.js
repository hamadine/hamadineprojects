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

    // ✅ Désactiver le bouton 'tz' s'il n'existe pas dans les données
    if (!mots.some(m => m.tz)) {
      const tzBtn = document.querySelector('[onclick*="tz"]');
      if (tzBtn) tzBtn.style.display = "none";
    }

    afficherMot();
  })
  .catch(e => {
    document.getElementById("motTexte").innerText = "❌ Fichier mots.json introuvable";
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
    btn.disabled = !mot?.audio;
    btn.style.opacity = mot?.audio ? "1" : "0.5";
    btn.style.cursor = mot?.audio ? "pointer" : "not-allowed";
  });
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
  const audioFile = mots[i].audio;
  if (audioFile) {
    const audio = new Audio("audios/" + audioFile);
    audio.play().catch(e => {
      console.warn("Audio indisponible : " + e.message);
      lectureActive = false; // ✅ arrête auto-lecture si audio échoue
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
  jouerTadaksahak(i);
  autoLectureTimeout = setTimeout(() => lectureMot(i + 1), 4000);
}

function rechercherMot() {
  if (!mots.length) return;
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

  if (!mots.length) {
    const botDiv = document.createElement("div");
    botDiv.textContent = "Bot : Dictionnaire non chargé.";
    chatWindow.appendChild(botDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    input.value = "";
    return;
  }

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
  input.focus(); // ✅ UX clavier
}

window.onload = () => {
  const chatWindow = document.getElementById("chatWindow");
  const accueil = document.createElement("div");
  accueil.textContent = "Bot : Bonjour, je m'appelle Hamadine. Quel mot cherchez-vous ?";
  chatWindow.appendChild(accueil);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};
