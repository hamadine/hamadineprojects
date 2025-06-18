let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;
let historiqueChat = JSON.parse(localStorage.getItem('chatHistorique') || '[]');

const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;

const nomsLangues = {
  fr: "Français", en: "English", ar: "العربية", tz: "Tamazight",
  tr: "Türkçe", da: "Dansk", de: "Deutsch", nl: "Nederlands",
  sv: "Svenska", ru: "Русский", zh: "中文", cs: "Čeština",
  ha: "Hausa", es: "Español", it: "Italiano"
};

let fuse = null;

async function chargerDonnees() {
  try {
    const [motsRes, interfaceRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json')
    ]);

    motsComplet = motsRes.data || [];
    mots = [...motsComplet];
    interfaceData = interfaceRes.data || {};

    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!mots[0] || !Object.keys(mots[0]).includes(langueTrad)) langueTrad = 'fr';

    // Initialisation de l'interface + restauration chat
    changerLangueInterface(langueInterface);
    restaurerHistorique();

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(mots[0] || {}).filter(k => k.length <= 3 && k !== 'cat')],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);

  } catch (err) {
    console.error("❌ Erreur de chargement :", err);
    alert("Erreur critique : impossible de charger les fichiers JSON.");
  }
}

function sanitizeHTML(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

function changerLangueInterface(langue) {
  if (!interfaceData[langue]) langue = 'fr';
  langueInterface = langue;
  document.documentElement.lang = langue;

  const t = interfaceData[langueInterface];
  if (!t) return;

  document.title = t.titrePrincipal;
  document.getElementById('titrePrincipal').textContent = t.titrePrincipal;
  document.getElementById('textePresentation').textContent = t.presentation;
  document.getElementById('searchBar').placeholder = t.searchPlaceholder;
  document.getElementById('btnEnvoyer').textContent = t.envoyer;
  document.getElementById('chat-title').textContent = t.chatTitre;
  document.getElementById('botIntro').innerHTML = sanitizeHTML(t.botIntro);
  document.getElementById('footerText').textContent = t.footerText;

  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";
}

function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  localStorage.setItem('motIndex', indexMot);

  const mot = mots[indexMot];
  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML =
    (mot[langueTrad] || '—')
    + (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '')
    + (mot.synonymes ? `<br><em>Synonymes :</em> ${mot.synonymes.join(', ')}` : '');

  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

function motPrecedent() { if (indexMot > 0) afficherMot(indexMot - 1); }
function motSuivant() { if (indexMot < mots.length - 1) afficherMot(indexMot + 1); }

let debounceTimeout;
function rechercherMotDebounce() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(rechercherMot, 300);
}

function rechercherMot() {
  const query = document.getElementById('searchBar').value.trim().toLowerCase();
  if (!query) { mots = [...motsComplet]; afficherMot(0); return; }

  const resultats = fuse.search(query);
  mots = resultats.map(r => r.item);

  if (mots.length) afficherMot(0);
  else {
    document.getElementById('motTexte').textContent = "❌ Aucun mot trouvé";
    document.getElementById('definition').innerHTML = "<em>Essayez un autre mot ou vérifiez l’orthographe.</em>";
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;

  afficherMessage('utilisateur', message); ajouterHistorique('utilisateur', message);
  input.value = '';

  const botData = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr']?.botIntelligence || {};
  const {
    salutations_triggers = [], salutations = [],
    remerciements = [], insulte = "Merci de rester respectueux.",
    insultes_triggers = [],
    faq = {}, reponseMot, inconnu
  } = botData;

  if (salutations_triggers.some(t => message.includes(t))) {
    const rep = salutations[Math.floor(Math.random() * salutations.length)] || "Bonjour !";
    afficherMessage('bot', rep); ajouterHistorique('bot', rep); return;
  }

  if (remerciements.some(t => message.includes(t))) {
    const rep = remerciements[Math.floor(Math.random() * remerciements.length)] || "Avec plaisir !";
    afficherMessage('bot', rep); ajouterHistorique('bot', rep); return;
  }

  if (insultes_triggers.some(t => message.includes(t))) {
    afficherMessage('bot', insulte); ajouterHistorique('bot', insulte); return;
  }

  for (const question in faq) {
    if (message.includes(question)) {
      const rep = faq[question];
      afficherMessage('bot', rep); ajouterHistorique('bot', rep); return;
    }
  }

  const match = message.match(/comment (on )?dit[- ]?on (.+?) en ([a-z]{2})/i);
  if (match) {
    const motCherche = match[2].trim();
    const langueCible = match[3].toLowerCase();
    const entree = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && val.toLowerCase() === motCherche)
    );
    if (entree && entree[langueCible]) {
      const traduction = entree[langueCible];
      const cat = entree.cat ? ` (${entree.cat})` : "";
      const msg = `<strong>${motCherche}</strong> en ${nomsLangues[langueCible] || langueCible} se dit : <strong>${traduction}</strong>${cat}`;
      afficherMessage('bot', msg); ajouterHistorique('bot', msg);
    } else {
      const fallback = inconnu || "Ce mot n’est pas encore disponible.";
      afficherMessage('bot', fallback); ajouterHistorique('bot', fallback);
    }
    return;
  }

  traiterRecherche(message, reponseMot, inconnu);
}

function traiterRecherche(message, reponseMot, inconnu) {
  setTimeout(() => {
    const exacts = motsComplet.filter(m =>
      Object.entries(m).some(([k, v]) =>
        k !== 'cat' && typeof v === 'string' && v.toLowerCase() === message
      )
    );

    if (exacts.length) {
      const réponses = exacts.map(m => {
        const traductions = Object.entries(m)
          .filter(([k]) => k !== 'mot' && k !== 'cat')
          .map(([lang, val]) => `<strong>${lang.toUpperCase()}</strong>: ${val}`)
          .join('<br>');
        return `${window.reponseBot}<br>${traductions}`;
      }).join('<br><br>');

      afficherMessage('bot', réponses); ajouterHistorique('bot', réponses);
    } else {
      const fallback = inconnu || "Mot non trouvé.";
      afficherMessage('bot', fallback); ajouterHistorique('bot', fallback);
    }
  }, 400);
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? window.nomUtilisateur : 'Bot'}:</strong> ${sanitizeHTML(contenu)}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function ajouterHistorique(type, contenu) {
  historiqueChat.push({ type, contenu });
  localStorage.setItem('chatHistorique', JSON.stringify(historiqueChat.slice(-50)));
}

function restaurerHistorique() {
  historiqueChat.forEach(msg => afficherMessage(msg.type, msg.contenu));
}

window.onload = chargerDonnees;
