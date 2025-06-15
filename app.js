let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;

const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;

let fuse = null;

const nomsLangues = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  tz: "Tamazight",
  tr: "Türkçe",
  da: "Dansk",
  de: "Deutsch",
  nl: "Nederlands",
  sv: "Svenska",
  ru: "Русский",
  zh: "中文",
  cs: "Čeština",
  ha: "Hausa",
  es: "Español",
  it: "Italiano"
};

// Chargement initial
async function chargerDonnees() {
  try {
    const [motsRes, interfaceRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json')
    ]);

    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;

    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!Object.keys(mots[0]).includes(langueTrad)) langueTrad = 'fr';

    changerLangueInterface(langueInterface);

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(mots[0]).filter(k => k.length === 2 || k.length === 3)],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (err) {
    console.error("Erreur de chargement :", err);
    alert("Erreur lors du chargement des données : " + (err.message || 'inconnue.'));
  }
}

// Afficher mot
function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  localStorage.setItem('motIndex', indexMot);

  const mot = mots[indexMot];
  document.getElementById('motTexte').textContent = mot.mot || '';
  document.getElementById('definition').innerHTML =
    (mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

// Navigation
function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1);
}
function motSuivant() {
  if (indexMot < mots.length - 1) afficherMot(indexMot + 1);
}

// Recherche
let debounceTimeout;
function rechercherMotDebounce() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(rechercherMot, 300);
}
function rechercherMot() {
  const query = document.getElementById('searchBar').value.trim();
  if (!query) {
    mots = [...motsComplet];
    afficherMot(0);
    return;
  }
  const resultats = fuse.search(query);
  if (resultats.length) {
    mots = resultats.map(r => r.item);
    afficherMot(0);
  } else {
    mots = [];
    document.getElementById('motTexte').textContent = "Aucun résultat";
    document.getElementById('definition').textContent = "";
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

// Changer langue interface
function changerLangueInterface(lang) {
  langueInterface = lang;
  localStorage.setItem('langueInterface', lang);

  const t = interfaceData[lang] || interfaceData['fr'];
  if (!t) return;

  document.title = t.titrePrincipal || "";
  document.documentElement.lang = lang;

  const ids = {
    titrePrincipal: t.titrePrincipal,
    textePresentation: t.presentation,
    btnPlay: `▶️ ${t.ecouter}`,
    btnReplay: `⟳ ${t.rejouer}`,
    btnAuto: `▶️ ${t.lectureAuto}`,
    btnEnvoyer: t.envoyer,
    'chat-title': t.chatTitre,
    searchBar: t.searchPlaceholder,
    chatInput: t.placeholderChat,
    botIntro: t.botIntro,
    'histoire-title': t.histoireTitle,
    'histoire-message': t.histoireBientot,
    'archives-title': t.archivesTitle,
    'archives-message': t.archivesBientot,
    footerText: t.footerText,
    footerContrib: t.footerContrib
  };

  for (const [id, content] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) {
      if (id === "searchBar" || id === "chatInput") {
        el.placeholder = content;
      } else {
        el.innerHTML = content;
      }
    }
  }

  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[langueInterface] || langueInterface.toUpperCase()} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad] || langueTrad.toUpperCase()} ⌄`;

  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";

  initialiserMenusLangues();
}

// Changer langue traduction
function changerLangueTraduction(lang) {
  langueTrad = lang;
  localStorage.setItem('langueTrad', lang);
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad] || langueTrad.toUpperCase()} ⌄`;
  afficherMot();
}

// Menus de langues
function initialiserMenusLangues() {
  const panelInterface = document.getElementById('menuLangueInterface');
  const panelTrad = document.getElementById('menuLangueTrad');

  panelInterface.innerHTML = '';
  panelTrad.innerHTML = '';

  Object.keys(interfaceData).forEach(code => {
    const btn = document.createElement('button');
    btn.textContent = nomsLangues[code] || code.toUpperCase();
    btn.className = 'langue-btn';
    btn.onclick = () => {
      changerLangueInterface(code);
      panelInterface.setAttribute('hidden', '');
    };
    panelInterface.appendChild(btn);
  });

  const languesTraduction = Object.keys(motsComplet[0]).filter(k => k.length <= 3 && k !== 'mot' && k !== 'cat');
  languesTraduction.forEach(code => {
    const btn = document.createElement('button');
    btn.textContent = nomsLangues[code] || code.toUpperCase();
    btn.className = 'langue-btn';
    btn.onclick = () => {
      changerLangueTraduction(code);
      panelTrad.setAttribute('hidden', '');
    };
    panelTrad.appendChild(btn);
  });
}

// Chat
function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  const t = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;

// Déclencheurs simples
const salutations = ["bonjour", "salut", "salam", "hello", "hi", "azul", "bonsoir"];
const remerciements = ["merci", "thanks", "tanemmirt", "shukran", "gracias"];
const insultes = ["con", "merde", "putain", "fuck", "shit", "idiot", "stupid"];

// Réponse si salutation
if (salutations.includes(message)) {
  const reponse = t.salutations[Math.floor(Math.random() * t.salutations.length)];
  afficherMessage('bot', reponse);
  input.value = '';
  return;
}

// Réponse si remerciement
if (remerciements.includes(message)) {
  const reponse = t.remerciements[Math.floor(Math.random() * t.remerciements.length)];
  afficherMessage('bot', reponse);
  input.value = '';
  return;
}

// Réponse si insulte détectée
if (insultes.some(mot => message.includes(mot))) {
  afficherMessage('bot', t.insulte);
  input.value = '';
  return;
}

// FAQ intelligente : boucle sur les clés
for (const cle in t.faq) {
  if (message.includes(cle)) {
    afficherMessage('bot', t.faq[cle]);
    input.value = '';
    return;
  }
  
  // Réponses intelligentes — base conversationnelle
const salutations = ["bonjour", "salut", "salam", "hello", "hi", "azul", "bonsoir"];
const remerciements = ["merci", "thanks", "tanemmirt", "shukran", "gracias"];
const insultes = ["con", "merde", "putain", "fuck", "shit", "idiot", "stupid"];
const faq = {
  "qui es-tu": "Je suis Hamadine, le bot Tadaksahak 🤖. Je t’aide à explorer notre langue !",
  "c’est quoi tadaksahak": "Le Tadaksahak est une langue parlée au nord du Mali par les Idaksahak.",
  "qui a fait ce site": "Ce site a été conçu par Hamadine Ag Moctar pour promouvoir, valoriser et faire connaître la langue Tadaksahak.",
  "comment ça va": "Je vais très bien, merci 🙌 Et toi ?"
  "je cherche un mot": "Je suis là pour vous aider à apprendre la langue Tadaksahak. Dites-moi lequel?",
};

if (salutations.includes(message)) {
  const reponses = [
    "👋 Bonjour à toi !",
    "✨ Bienvenue sur le dictionnaire Tadaksahak.",
    "😄 Salam ! Que puis-je faire pour toi ?",
    "🟠 Demandes-moi le mot que tu cherche. S'il n'est pas disponible, il sera noté pour une prochaine mise à jour.",
  ];
  const reponse = reponses[Math.floor(Math.random() * reponses.length)];
  afficherMessage('bot', reponse);
  input.value = '';
  return;
}

if (remerciements.includes(message)) {
  const reponses = [
    "🙏 Avec plaisir ! Reviens quand tu veux",
    "😊 Je suis heureux de pouvoir t’aider.",
    "🙌 Merci à toi pour l’intérêt que tu portes à notre langue."
  ];
  const reponse = reponses[Math.floor(Math.random() * reponses.length)];
  afficherMessage('bot', reponse);
  input.value = '';
  return;
}

if (insultes.some(insulte => message.includes(insulte))) {
  afficherMessage('bot', "🙏 Merci de rester respectueux. Je suis ici pour t'aider avec bienveillance.");
  input.value = '';
  return;
}

for (const question in faq) {
  if (message.includes(question)) {
    afficherMessage('bot', faq[question]);
    input.value = '';
    return;
}
  
  if (!message) return;

  afficherMessage('utilisateur', message);
  input.value = '';

  setTimeout(() => {
    const exacts = motsComplet.filter(mot =>
      Object.entries(mot).some(([k, v]) => k !== 'cat' && typeof v === 'string' && v.toLowerCase() === message)
    );

    if (exacts.length > 0) {
      let reponse = exacts.map(m => {
        const autres = motsComplet.filter(x => x.mot === m.mot && x !== m);
        const traductions = Object.entries(m)
          .filter(([k]) => k !== 'mot' && k !== 'cat')
          .map(([lang, val]) => `<strong>${lang.toUpperCase()}</strong>: ${val}`)
          .join('<br>');
        const homonymes = autres.map(h =>
          Object.entries(h)
            .filter(([k]) => k !== 'mot' && k !== 'cat')
            .map(([lang, val]) => `<strong>${lang.toUpperCase()}</strong>: ${val}`)
            .join('<br>') +
          (h.cat ? ` <span style="color:#888;">(${h.cat})</span>` : '')
        ).join('<hr>');
        return `<strong>${m.mot}</strong> <span style="color:#888;">(${m.cat || ''})</span><br>${traductions}`
          + (homonymes ? `<hr><em>Autres sens ou homonymes :</em><br>${homonymes}` : '');
      }).join('<hr>');
      afficherMessage('bot', reponse);
      return;
    }

    const fuseInverse = new Fuse(motsComplet, {
      keys: Object.keys(motsComplet[0]).filter(k => k !== 'cat'),
      threshold: 0.4,
      includeScore: true
    });

    const resultats = fuseInverse.search(message);

    if (resultats.length) {
      const suggestions = resultats.slice(0, 3).map(r => {
        const m = r.item;
        const t = Object.entries(m)
          .filter(([k]) => k !== 'cat')
          .map(([lang, val]) => `<strong>${lang.toUpperCase()}</strong>: ${val}`)
          .join('<br>');
        return `${t}${m.cat ? ` <span style="color:#888;">(${m.cat})</span>` : ''}`;
      }).join('<hr>');
      afficherMessage('bot', `Je n’ai pas trouvé ce mot exactement, mais je vous propose ceci et je note votre recherche pour la prochaine mise à jour. Merci pour votre contribution.:<br>${suggestions}`);
    } else {
      afficherMessage('bot', `Désolé, ce mot n’est pas encore disponible.<br><br>🤖 Je travaille d’arrache-pied pour enrichir la base lexicale et votre requête est noté pour la prochaine mise à jour. Continuez avec les mots existants.<br>Ce mot a été noté pour amélioration. Merci 🙏`);
    }
  }, 300);
}

function afficherMessage(auteur, texte) {
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = `message ${auteur}`;
  const nom = auteur === 'bot' ? 'Hamadine' : (window.nomUtilisateur || "Vous");
  div.innerHTML = `<strong>${nom} :</strong> ${texte}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Audio
function jouerTadaksahak() {
  const mot = mots[indexMot];
  if (!mot || !mot.mot) return;
  const audio = new Audio(`./audio/${mot.mot}.mp3`);
  audio.onerror = () => alert("Audio non disponible.");
  audio.play();
}
function rejouerMot() {
  jouerTadaksahak();
}
function lectureAuto() {
  alert("Lecture automatique à venir !");
}

// Démarrage
window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
});
