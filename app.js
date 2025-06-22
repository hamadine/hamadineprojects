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
let corpusHistoire = "";

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function chargerCorpusHistoire() {
  const sections = document.querySelectorAll('[id^="chapitre-"]');
  corpusHistoire = Array.from(sections).map(sec => sec.textContent).join("\n\n");
}

async function chargerDonnees() {
  try {
    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get('data/histoire.json')
    ]);

    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;
    window.histoireDocs = histoireRes.data || [];

    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!Object.keys(mots[0] || {}).includes(langueTrad)) langueTrad = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

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
    escapeHTML(mot[langueTrad] || '—') +
    (mot.cat ? `<span style="color:#888;">(${escapeHTML(mot.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1);
}

function motSuivant() {
  if (indexMot < mots.length - 1) afficherMot(indexMot + 1);
}

const rechercherMotDebounce = debounce(rechercherMot);

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
    document.getElementById('compteur').textContent = "0 / 0";
  }
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;
  afficherMessage('utilisateur', escapeHTML(message));
  input.value = '';

  const botData = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  const {
    salutations = [], salutations_triggers = [],
    remerciements = [], insulte = "Merci de rester respectueux.",
    faq = {}, reponseMot, inconnu, triggers = {}, reponses = {},
    insultes = []
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

  if (insultes.some(bad => message.includes(bad))) {
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
      Object.entries(m).some(([k, val]) =>
        k !== 'cat' && typeof val === 'string' && val.toLowerCase() === motCherche
      )
    );

    if (entree && entree[langueCible] && entree.mot) {
      const traduction = entree[langueCible];
      const motTadaksahak = entree.mot;
      const cat = entree.cat ? ` (${entree.cat})` : "";

      afficherMessage('bot', `<strong>${escapeHTML(motCherche)}</strong> en ${nomsLangues[langueCible]} se dit : <strong>${escapeHTML(traduction)}</strong><br>Mot Tadaksahak : <strong>${escapeHTML(motTadaksahak)}</strong>${escapeHTML(cat)}`);
    } else {
      afficherMessage('bot', inconnu || "Ce mot n’est pas encore disponible.");
    }
    return;
  }

  traiterRecherche(message, reponseMot, inconnu, reponses, triggers);
}

function traiterRecherche(message, reponseMot, inconnu, reponses, triggers) {
  setTimeout(() => {
    const exacts = motsComplet.filter(m =>
      Object.entries(m).some(([k, v]) =>
        k !== 'cat' && typeof v === 'string' && v.toLowerCase() === message
      )
    );

    if (exacts.length) {
      const réponses = exacts.map(m => {
        const traductions = [
          `<strong>Tadaksahak</strong>: ${escapeHTML(m.mot)}`
        ];

        Object.entries(m)
          .filter(([k]) => k !== 'mot' && k !== 'cat')
          .forEach(([lang, val]) => {
            traductions.push(`<strong>${lang.toUpperCase()}</strong>: ${escapeHTML(val)}`);
          });

        const cat = m.cat ? `<span style="color:#888;"> (${escapeHTML(m.cat)})</span>` : '';
        return `${reponseMot || "Mot Tadaksahak disponible"} :<br>${traductions.join('<br>')}${cat}`;
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
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (window.nomUtilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const message = contenu.toLowerCase();
  const resultatsHistoire = window.histoireDocs.filter(doc => {
    const contenuDoc = doc.contenu.toLowerCase();
    const titreDoc = doc.titre.toLowerCase();
    return contenuDoc.includes(message) || titreDoc.includes(message) ||
           (doc.motsCles || []).some(motCle => message.includes(motCle.toLowerCase()));
  });

  if (resultatsHistoire.length) {
    const reponses = resultatsHistoire.map(doc =>
      `<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}`
    );
    reponses.forEach(r => afficherMessage('bot', r));
  }
}

function genererMenuLangues(menuId, callback) {
  const menu = document.getElementById(menuId);
  menu.innerHTML = '';

  Object.entries(nomsLangues).forEach(([code, label]) => {
    const item = document.createElement('button');
    item.className = 'langue-item';
    item.setAttribute('role', 'menuitem');
    item.textContent = label;
    item.dataset.code = code;
    item.addEventListener('click', () => {
      callback(code);
      menu.hidden = true;
    });
    menu.appendChild(item);
  });
}

function initialiserMenusLangues() {
  const btnInterface = document.getElementById('btnLangueInterface');
  const btnTrad = document.getElementById('btnLangueTrad');
  const menuInterface = document.getElementById('menuLangueInterface');
  const menuTrad = document.getElementById('menuLangueTrad');

  btnInterface.addEventListener('click', () => {
    const hidden = menuInterface.hidden;
    menuInterface.hidden = !hidden;
    if (!hidden) return;
    genererMenuLangues('menuLangueInterface', (code) => {
      changerLangueInterface(code);
      btnInterface.textContent = `Interface : ${nomsLangues[code]} ⌄`;
    });
  });

  btnTrad.addEventListener('click', () => {
    const hidden = menuTrad.hidden;
    menuTrad.hidden = !hidden;
    if (!hidden) return;
    genererMenuLangues('menuLangueTrad', (code) => {
      langueTrad = code;
      localStorage.setItem('langueTrad', code);
      btnTrad.textContent = `Traduction : ${nomsLangues[code]} ⌄`;
      afficherMot(indexMot);
    });
  });
}

function changerLangueInterface(langue) {
  langueInterface = langue;
  localStorage.setItem('langueInterface', langue);
  document.documentElement.lang = langue;

  const t = interfaceData[langueInterface] || interfaceData['fr'];

  document.title = t.titrePrincipal;
  document.getElementById('titrePrincipal').textContent = t.titrePrincipal;
  document.getElementById('textePresentation').textContent = t.presentation;
  document.getElementById('searchBar').placeholder = t.searchPlaceholder;
  document.getElementById('btnEnvoyer').textContent = t.envoyer;
  document.getElementById('chat-title').textContent = t.chatTitre;
  document.getElementById('botIntro').innerHTML = t.botIntro;
  document.getElementById('footerText').textContent = t.footerText;

  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[langueInterface] || langueInterface.toUpperCase()} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad] || langueTrad.toUpperCase()} ⌄`;

  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";
}

window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  chargerCorpusHistoire();
  document.getElementById('searchBar').addEventListener('input', rechercherMotDebounce);
  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', motPrecedent);
  document.getElementById('btnNext').addEventListener('click', motSuivant);
});
