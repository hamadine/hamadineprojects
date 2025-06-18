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
    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;

    // Sécurité de langues
    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!motsComplet.length || !Object.keys(motsComplet[0]).includes(langueTrad)) langueTrad = 'fr';

    changerLangueInterface(langueInterface);

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(motsComplet[0] || {}).filter(k => k.length <= 3 && k !== 'cat')],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex'), 10) || 0;
    afficherMot(indexMot);
    restaurerHistorique();

  } catch (err) {
    console.error("❌ Erreur chargement JSON :", err);
    alert("Erreur lors du chargement des fichiers JSON. Vérifiez /data/mots.json et interface-langue.json");
  }
}

function changerLangueInterface(langue) {
  if (!interfaceData[langue]) langue = 'fr';
  langueInterface = langue;
  localStorage.setItem('langueInterface', langue);

  const t = interfaceData[langue] || interfaceData['fr'];

  document.documentElement.lang = langue;
  document.title = t.titrePrincipal;
  document.getElementById('titrePrincipal').textContent = t.titrePrincipal;
  document.getElementById('textePresentation').textContent = t.presentation;
  document.getElementById('searchBar').placeholder = t.searchPlaceholder;
  document.getElementById('btnEnvoyer').textContent = t.envoyer;
  document.getElementById('chat-title').textContent = t.chatTitre;
  document.getElementById('botIntro').innerHTML = t.botIntro;
  document.getElementById('footerText').textContent = t.footerText;

  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";
}

function afficherMot(mIdx = indexMot) {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, mIdx));
  localStorage.setItem('motIndex', indexMot);
  const mot = mots[indexMot];

  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML = 
    (mot[langueTrad] || '—') +
    (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '') +
    (mot.synonymes ? `<br><em>Synonymes :</em> ${mot.synonymes.join(', ')}` : '');

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
  const q = document.getElementById('searchBar').value.trim().toLowerCase();
  if (!q) {
    mots = [...motsComplet];
    afficherMot(0);
    return;
  }
  const results = fuse.search(q);
  mots = results.map(r => r.item);
  if (mots.length) afficherMot(0);
  else {
    document.getElementById('motTexte').textContent = "❌ Aucun mot trouvé";
    document.getElementById('definition').innerHTML = "<em>Essayez un autre mot ou vérifiez l'orthographe.</em>";
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;
  afficherMessage('utilisateur', message);
  ajouterHistorique('utilisateur', message);
  input.value = '';

  const bot = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  const {
    salutations = [], salutations_triggers = [],
    remerciements = [], insultes = [],
    insulte = "Merci de rester respectueux.",
    faq = {}, reponseMot, inconnu
  } = bot;

  if (salutations_triggers.some(w => message.includes(w))) {
    const rep = salutations[Math.floor(Math.random() * salutations.length)] || salutations[0] || "Bonjour !";
    afficherMessage('bot', rep); ajouterHistorique('bot', rep); return;
  }

  if (remerciements.some(w => message.includes(w))) {
    const rep = remerciements[Math.floor(Math.random() * remerciements.length)] || "Avec plaisir !";
    afficherMessage('bot', rep); ajouterHistorique('bot', rep); return;
  }

  if (insultes.some(w => message.includes(w))) {
    afficherMessage('bot', insulte); ajouterHistorique('bot', insulte); return;
  }

  for (let q in faq) {
    if (message.includes(q)) {
      afficherMessage('bot', faq[q]);
      ajouterHistorique('bot', faq[q]);
      return;
    }
  }

  const match = message.match(/comment (?:on )?dit[- ]?on (.+?) en ([a-z]{2})/i);
  if (match) {
    const [_, motCherche, langueCible] = match;
    const entree = motsComplet.find(m =>
      Object.values(m).some(v => typeof v === 'string' && v.toLowerCase() === motCherche)
    );
    if (entree && entree[langueCible]) {
      const trad = entree[langueCible];
      const cat = entree.cat ? ` (${entree.cat})` : "";
      const resp = `<strong>${motCherche}</strong> en ${nomsLangues[langueCible]} : <strong>${trad}</strong>${cat}`;
      afficherMessage('bot', resp); ajouterHistorique('bot', resp);
    } else {
      const fb = inconnu || "Ce mot n’est pas encore disponible.";
      afficherMessage('bot', fb); ajouterHistorique('bot', fb);
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
      const msgs = exacts.map(m => {
        const autres = motsComplet.filter(x => x.mot === m.mot && x !== m);
        const traductions = Object.entries(m)
          .filter(([k]) => !['mot', 'cat'].includes(k))
          .map(([l,v]) => `<strong>${l.toUpperCase()}</strong>: ${v}`)
          .join("<br>");
        const hom = autres.map(h =>
          Object.entries(h)
            .filter(([k]) => !['mot','cat'].includes(k))
            .map(([l,v]) => `<strong>${l.toUpperCase()}</strong>: ${v}`)
            .join("<br>")
        ).join("<hr>");
        return `${window.reponseBot}<br>${traductions}${hom?'<hr>'+hom:''}`;
      }).join("<br><br>");
      afficherMessage('bot', msgs); ajouterHistorique('bot', msgs);
    } else {
      const fb = inconnu || "Mot non trouvé.";
      afficherMessage('bot', fb); ajouterHistorique('bot', fb);
    }
  }, 300);
}

function sanitize(txt) {
  const d = document.createElement('div');
  d.textContent = txt;
  return d.innerHTML;
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type==='utilisateur'?window.nomUtilisateur:'Bot'}:</strong> ${sanitize(contenu)}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function ajouterHistorique(type, contenu) {
  historiqueChat.push({ type, contenu });
  localStorage.setItem('chatHistorique', JSON.stringify(historiqueChat.slice(-50)));
}

function restaurerHistorique() {
  historiqueChat.forEach(({type, contenu}) => afficherMessage(type, contenu));
}

window.addEventListener('DOMContentLoaded', chargerDonnees);
