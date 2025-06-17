let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;

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
    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;
    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!Object.keys(mots[0] || {}).includes(langueTrad)) langueTrad = 'fr';

    changerLangueInterface(langueInterface);

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(mots[0]).filter(k => k.length <= 3 && k !== 'cat')],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (err) {
    console.error("❌ Erreur de chargement :", err);
    alert("Erreur lors du chargement des données JSON.");
  }
}

function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  localStorage.setItem('motIndex', indexMot);
  const mot = mots[indexMot];
  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML =
    (mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1);
}

function motSuivant() {
  if (indexMot < mots.length - 1) afficherMot(indexMot + 1);
}
let debounceTimeout;
function rechercherMotDebounce() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(rechercherMot, 300);
}

function rechercherMot() {
  const query = document.getElementById('searchBar').value.trim().toLowerCase();
  if (!query) {
    mots = [...motsComplet];
    afficherMot(0);
    return;
  }

  const resultats = fuse.search(query);
  mots = resultats.map(r => r.item);

  if (mots.length) afficherMot(0);
  else {
    document.getElementById('motTexte').textContent = "Aucun résultat";
    document.getElementById('definition').textContent = "";
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;
  afficherMessage('utilisateur', message);
  input.value = '';

  const botData = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  const {
    salutations = [], salutations_triggers = [],
    remerciements = [], insulte = "Merci de rester respectueux.",
    faq = {}, reponseMot, inconnu
  } = botData;

  if (salutations_triggers.some(trig => message.includes(trig))) {
    const rep = salutations[Math.floor(Math.random() * salutations.length)] || "Bonjour !";
    afficherMessage('bot', rep);
    return;
  }

  if (remerciements.some(trig => message.includes(trig))) {
    const rep = remerciements[Math.floor(Math.random() * remerciements.length)] || "Avec plaisir !";
    afficherMessage('bot', rep);
    return;
  }

  const blacklist = botData.insultes || [];
  if (blacklist.some(bad => message.includes(bad))) {
    afficherMessage('bot', insulte);
    return;
  }

  for (const question in faq) {
    if (message.includes(question)) {
      afficherMessage('bot', faq[question]);
      return;
    }
  }

  const match = message.match(/comment (on )?dit[- ]?on (.+?) en ([a-z]+)/i);
  if (match) {
    const motCherche = match[2].trim();
    const langueCible = match[3].trim().substring(0, 2);
    const entree = motsComplet.find(m =>
      Object.values(m).some(val => typeof val === 'string' && val.toLowerCase() === motCherche)
    );
    if (entree && entree[langueCible]) {
      const traduction = entree[langueCible];
      const cat = entree.cat ? ` (${entree.cat})` : "";
      afficherMessage('bot', `<strong>${motCherche}</strong> en ${nomsLangues[langueCible]} se dit : <strong>${traduction}</strong>${cat}`);
    } else {
      afficherMessage('bot', inconnu || "Ce mot n’est pas encore disponible. Notre base lexicale est en cours de développement.");
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
        const autres = motsComplet.filter(x => x.mot === m.mot && x !== m);
        const traductions = Object.entries(m)
          .filter(([k]) => k !== 'mot' && k !== 'cat')
          .map(([lang, val]) => `<strong>${lang.toUpperCase()}</strong>: ${val}`)
          .join('<br>');

        const homonymes = autres.map(h =>
          Object.entries(h)
            .filter(([k]) => k !== 'mot' && k !== 'cat')
            .map(([lang, val]) => `<strong>${lang.toUpperCase()}</strong>: ${val}`)
            .join('<br>')
        ).join('<hr>');

        return `${reponseMot || "Voici les traductions :"}<br>${traductions}${homonymes ? "<hr>" + homonymes : ''}`;
      });
      afficherMessage('bot', réponses.join('<br><br>'));
    } else {
      afficherMessage('bot', inconnu || "Mot non trouvé.");
    }
  }, 400);
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? window.nomUtilisateur : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

window.onload = chargerDonnees;
