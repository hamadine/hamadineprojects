import { traductionsUI } from './data/interface-langues.js';

let mots = [];
let index = 0;
let langue = "fr"; // langue des définitions
let langueInterface = "fr"; // langue de l'interface UI
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

  // Afficher une note si l'audio est manquant (optionnel, selon ton HTML)
  if (document.getElementById("audioNote")) {
    document.getElementById("audioNote").innerText = mot?.audio ? "" : "Pas de fichier audio disponible.";
  }
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

// --- BOT HAMADINE INTELLIGENT ---
// Nettoie la question pour extraire le mot clé
function nettoyerQuestion(question) {
  let res = question.toLowerCase();
  // Retire le nom du bot et diverses formulations
  const patterns = [
    /hamadine[ ,:]*/i,
    /comment (on )?(dit|écrit|appelle|prononce) (on )?/i,
    /en tadaksahak[ \?\.!]*/i,
    /en français[ \?\.!]*/i,
    /en russe[ \?\.!]*/i,
    /en anglais[ \?\.!]*/i,
    /en arabe[ \?\.!]*/i,
    /en tamajaq[ \?\.!]*/i,
    /s'il te plaît[ \?\.!]*/i,
    /svp[ \?\.!]*/i,
    /stp[ \?\.!]*/i
  ];
  for (let pat of patterns) {
    res = res.replace(pat, '');
  }
  // Retire ponctuations et espaces superflus
  res = res.replace(/[?.!,;]/g, '').trim();
  return res;
}

// Trouver le mot le plus proche (suggestion)
function suggestionMot(motCherche) {
  // Recherche simple : commence par la même lettre ou distance de Levenshtein <=2
  let closest = "";
  let minDist = 99;
  for (const m of mots) {
    const dist = levenshtein(motCherche, m.mot.toLowerCase());
    if (dist < minDist) {
      minDist = dist;
      closest = m.mot;
    }
  }
  if (minDist <= 2 && closest) return closest; // tolérant à 2 fautes
  return "";
}

// Levenshtein (distance d'édition) pour la tolérance aux fautes
function levenshtein(a, b) {
  const matrix = [];
  let i, j;
  // Initialisation
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  // Remplissage
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // suppression
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function envoyerMessage() {
  const input = document.getElementById("chatInput");
  let message = input.value.trim();
  if (!message) return;

  const chatWindow = document.getElementById("chatWindow");
  const msgDiv = document.createElement("div");
  msgDiv.textContent = "Vous : " + message;
  msgDiv.style.fontWeight = "bold";
  chatWindow.appendChild(msgDiv);

  if (!mots.length) {
    const botDiv = document.createElement("div");
    botDiv.textContent = "Hamadine : Dictionnaire non chargé.";
    chatWindow.appendChild(botDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    input.value = "";
    return;
  }

  // Nettoie la question pour extraire le mot clé
  const normaliser = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let motRecherche = nettoyerQuestion(message);
  motRecherche = normaliser(motRecherche);

  const réponse = mots.find(m =>
    normaliser(m.mot) === motRecherche ||
    normaliser(m[langue] || "").includes(motRecherche)
  );

  const botDiv = document.createElement("div");
  if (réponse) {
    botDiv.textContent = `Hamadine : "${réponse.mot}" se dit "${réponse[langue]}" en Tadaksahak.`;
  } else {
    // Suggestion si mot inconnu
    const suggestion = suggestionMot(motRecherche);
    if (suggestion) {
      botDiv.textContent = `Hamadine : Je n'ai pas trouvé ce mot, mais voulais-tu dire "${suggestion}" ?`;
    } else {
      botDiv.textContent = `Hamadine : Je ne connais pas ce mot, mais je vais essayer de l'ajouter bientôt. N'hésite pas à me signaler les mots manquants !`;
    }
  }
  chatWindow.appendChild(botDiv);

  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = "";
  input.focus();
}

// Fonction pour changer la langue de l'interface UI
function changerLangueInterface(lang) {
  if (!traductionsUI[lang]) return;
  langueInterface = lang;

  // Gérer RTL pour l'arabe
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  const trad = traductionsUI[lang];

  // Navigation entre les mots
  const btnPrev = document.querySelector('#navigation button[onclick*="motPrecedent"]');
  const btnNext = document.querySelector('#navigation button[onclick*="motSuivant"]');
  if (btnPrev) btnPrev.innerText = trad.precedent;
  if (btnNext) btnNext.innerText = trad.suivant;

  // Boutons audio
  const btnEcouter = document.querySelector('#audioButtons button[onclick*="jouerTadaksahak"]');
  const btnRejouer = document.querySelector('#audioButtons button[onclick*="rejouerMot"]');
  const btnLectureAuto = document.querySelector('#audioButtons button[onclick*="lectureAuto"]');
  if (btnEcouter) btnEcouter.innerText = trad.ecouter;
  if (btnRejouer) btnRejouer.innerText = trad.rejouer;
  if (btnLectureAuto) btnLectureAuto.innerText = trad.lectureAuto;

  // Chat
  const chatTitre = document.querySelector('section[aria-labelledby="chat-title"] h2');
  if (chatTitre) chatTitre.innerText = trad.chatTitre;
  const btnEnvoyer = document.querySelector('button[onclick*="envoyerMessage"]');
  if (btnEnvoyer) btnEnvoyer.innerText = trad.envoyer;
}

// Message d'accueil personnalisé au chargement
window.onload = () => {
  const chatWindow = document.getElementById("chatWindow");
  const accueil = document.createElement("div");
  accueil.textContent =
    "Bienvenue sur Tadaksahak-Learning, je me nomme Hamadine AG MOCTAR et c'est avec plaisir que je vous fais découvrir la langue Tadaksahak.";
  chatWindow.appendChild(accueil);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Initialiser la langue d'interface par défaut
  changerLangueInterface(langueInterface);
};
