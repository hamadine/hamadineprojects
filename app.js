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

async function chargerDonnees() {
  try {
    const histoireFile = langueInterface === 'ar' ? 'histoire-ar.json' : 'histoire.json';

    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json'),
      axios.get(`data/${histoireFile}`)
    ]);

    motsComplet = motsRes.data;
    mots = [...motsComplet];
    interfaceData = interfaceRes.data;
    window.histoireDocs = histoireRes.data;

    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!Object.keys(mots[0] || {}).includes(langueTrad)) langueTrad = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(mots[0]).filter(k => k !== 'cat' && k.length <= 3)],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
  } catch (e) {
    console.error("❌ Erreur de chargement :", e);
    alert("Erreur de chargement des fichiers JSON. Vérifie le dossier /data/");
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
    (mot.cat ? ` <span style="color:#888;">(${escapeHTML(mot.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1);
}

function motSuivant() {
  if (indexMot < mots.length - 1) afficherMot(indexMot + 1);
}

const rechercherMotDebounce = debounce(() => {
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
});

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;
  afficherMessage('utilisateur', escapeHTML(message));
  input.value = '';

  const data = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  if (!data) return afficherMessage('bot', "Configuration manquante.");

  const {
    salutations = [], salutations_triggers = [],
    remerciements = [], insultes = [],
    insulte = "Merci de rester respectueux.",
    faq = {}, reponseMot, inconnu = "Je ne comprends pas.",
  } = data;

  if (salutations_triggers.some(t => message.includes(t))) {
    const rep = salutations[Math.floor(Math.random() * salutations.length)] || "Bonjour !";
    return afficherMessage('bot', rep);
  }

  if (remerciements.some(t => message.includes(t))) {
    const rep = remerciements[Math.floor(Math.random() * remerciements.length)] || "Avec plaisir !";
    return afficherMessage('bot', rep);
  }

  if (insultes.some(t => message.includes(t))) {
    return afficherMessage('bot', insulte);
  }

  for (const question in faq) {
    if (message.includes(question)) {
      return afficherMessage('bot', faq[question]);
    }
  }

  const match = message.match(/comment (on )?dit[- ]?on (.+?) en ([a-z]+)/i);
  if (match) {
    const motCherche = match[2].trim();
    const langueCible = match[3].substring(0, 2);
    const entree = motsComplet.find(m =>
      Object.entries(m).some(([k, v]) => k !== 'cat' && typeof v === 'string' && v.toLowerCase() === motCherche)
    );

    if (entree && entree[langueCible]) {
      const rep = `<strong>${escapeHTML(motCherche)}</strong> en ${nomsLangues[langueCible]} : <strong>${escapeHTML(entree[langueCible])}</strong><br>Mot Tadaksahak : <strong>${escapeHTML(entree.mot)}</strong>`;
      return afficherMessage('bot', rep);
    } else {
      return afficherMessage('bot', inconnu);
    }
  }

  const exacts = motsComplet.filter(m =>
    Object.entries(m).some(([k, v]) => k !== 'cat' && typeof v === 'string' && v.toLowerCase() === message)
  );

  if (exacts.length) {
    const réponses = exacts.map(m => {
      const lignes = [`<strong>Tadaksahak</strong>: ${escapeHTML(m.mot)}`];
      Object.entries(m).forEach(([k, v]) => {
        if (k !== 'mot' && k !== 'cat') {
          lignes.push(`<strong>${k.toUpperCase()}</strong>: ${escapeHTML(v)}`);
        }
      });
      return lignes.join('<br>') + (m.cat ? ` <em>(${escapeHTML(m.cat)})</em>` : '');
    });
    return afficherMessage('bot', réponses.join('<br><br>'));
  }

  const resultats = (window.histoireDocs || []).filter(doc => {
    const msg = message.toLowerCase();
    return (doc.titre && doc.titre.toLowerCase().includes(msg)) ||
           (doc.contenu && doc.contenu.toLowerCase().includes(msg)) ||
           (doc.motsCles || []).some(m => msg.includes(m.toLowerCase()));
  });

  if (resultats.length) {
    const bloc = resultats.map(doc =>
      `<strong>${escapeHTML(doc.titre)}</strong><br>${escapeHTML(doc.contenu)}`
    ).join('<br><br>');
    return afficherMessage('bot', bloc);
  }

  afficherMessage('bot', inconnu);
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (window.nomUtilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function initialiserMenusLangues() {
  const btnInterface = document.getElementById('btnLangueInterface');
  const btnTrad = document.getElementById('btnLangueTrad');

  btnInterface.addEventListener('click', () => {
    const menu = document.getElementById('menuLangueInterface');
    menu.hidden = !menu.hidden;
    if (!menu.hidden) genererMenuLangues('menuLangueInterface', (code) => {
      changerLangueInterface(code);
      btnInterface.textContent = `Interface : ${nomsLangues[code]} ⌄`;
    });
  });

  btnTrad.addEventListener('click', () => {
    const menu = document.getElementById('menuLangueTrad');
    menu.hidden = !menu.hidden;
    if (!menu.hidden) genererMenuLangues('menuLangueTrad', (code) => {
      langueTrad = code;
      localStorage.setItem('langueTrad', code);
      btnTrad.textContent = `Traduction : ${nomsLangues[code]} ⌄`;
      afficherMot(indexMot);
    });
  });
}

function genererMenuLangues(menuId, callback) {
  const menu = document.getElementById(menuId);
  menu.innerHTML = '';
  Object.entries(nomsLangues).forEach(([code, nom]) => {
    const btn = document.createElement('button');
    btn.textContent = nom;
    btn.className = 'langue-item';
    btn.dataset.code = code;
    btn.onclick = () => {
      callback(code);
      menu.hidden = true;
    };
    menu.appendChild(btn);
  });
}

function changerLangueInterface(langue) {
  langueInterface = langue;
  localStorage.setItem('langueInterface', langue);
  document.documentElement.lang = langue;
  document.body.dir = (langue === 'ar') ? 'rtl' : 'ltr';

  const t = interfaceData[langueInterface] || interfaceData['fr'];

  document.title = t.titrePrincipal;
  document.getElementById('titrePrincipal').textContent = t.titrePrincipal;
  document.getElementById('textePresentation').textContent = t.presentation;
  document.getElementById('searchBar').placeholder = t.searchPlaceholder;
  document.getElementById('btnEnvoyer').textContent = t.envoyer;
  document.getElementById('chat-title').textContent = t.chatTitre;
  document.getElementById('botIntro').innerHTML = t.botIntro;
  document.getElementById('footerText').textContent = t.footerText;

  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[langueInterface]} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad]} ⌄`;

  window.nomUtilisateur = t.utilisateur || "Vous";
}

let recoActive = false;

function activerMicroEtComparer() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("🎤 Reconnaissance vocale non prise en charge sur ce navigateur.");
    return;
  }

  const motAttendu = mots[indexMot]?.mot?.toLowerCase();
  if (!motAttendu) return;

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'fr-FR'; // Peut être adapté selon les sons Tadaksahak

  recognition.onstart = () => {
    recoActive = true;
    afficherMessage('bot', "🎙️ Parlez maintenant...");
  };

  recognition.onresult = (event) => {
    const result = event.results[0][0].transcript.trim().toLowerCase();
    console.log("Tu as dit :", result);

    const correct = result === motAttendu;
    if (correct) {
      afficherMessage('bot', `✅ Bien dit ! Tu as prononcé <strong>${result}</strong> comme attendu.`);
    } else {
      afficherMessage('bot', `❌ Tu as dit : <strong>${result}</strong><br>🔁 Attendu : <strong>${motAttendu}</strong>`);
    }
  };

  recognition.onerror = (e) => {
    afficherMessage('bot', "❌ Erreur de reconnaissance vocale.");
  };

  recognition.onend = () => recoActive = false;
  recognition.start();
}

window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  document.getElementById('searchBar').addEventListener('input', rechercherMotDebounce);
  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', motPrecedent);
  document.getElementById('btnNext').addEventListener('click', motSuivant);
  document.getElementById('btnPrononcer').addEventListener('click', activerMicroEtComparer);
});
