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

    console.log("✅ Mots chargés :", motsRes.data.length);
    console.log("✅ Langues chargées :", Object.keys(interfaceRes.data));

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
    alert("Erreur lors du chargement des données JSON. Vérifiez que les fichiers sont bien dans le dossier /data/");
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
  const query = document.getElementById('searchBar').value.trim();
  if (!query) {
    mots = [...motsComplet];
    afficherMot(0);
    return;
  }

  const resultats = fuse.search(query);
  mots = resultats.map(r => r.item);

  if (mots.length) {
    afficherMot(0);
  } else {
    document.getElementById('motTexte').textContent = "Aucun résultat";
    document.getElementById('definition').textContent = "";
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

function changerLangueInterface(lang) {
  langueInterface = lang;
  localStorage.setItem('langueInterface', lang);

  const t = interfaceData[lang] || interfaceData['fr'];
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
    if (el) el.tagName === "INPUT" ? el.placeholder = content : el.innerHTML = content;
  }

  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[langueInterface] || lang.toUpperCase()} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad] || langueTrad.toUpperCase()} ⌄`;

  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";

  initialiserMenusLangues();
}

function changerLangueTraduction(lang) {
  langueTrad = lang;
  localStorage.setItem('langueTrad', lang);
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[lang] || lang.toUpperCase()} ⌄`;
  afficherMot();
}

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

  const languesTraduction = Object.keys(motsComplet[0] || {})
    .filter(k => k.length <= 3 && k !== 'mot' && k !== 'cat');

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

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;

  afficherMessage('utilisateur', message);
  input.value = '';

  const botData = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  const { salutations = [], remerciements = [], insultes = [], faq = {}, inconnu, reponseMot } = botData;

  if (salutations.includes(message)) return afficherMessage('bot', botData.salutationsRandom || "Bonjour !");
  if (remerciements.includes(message)) return afficherMessage('bot', botData.remerciementsRandom || "Merci !");
  if (insultes.some(word => message.includes(word))) return afficherMessage('bot', botData.insulte || "Merci de rester respectueux.");

  for (const question in faq) {
    if (message.includes(question)) return afficherMessage('bot', faq[question]);
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
      afficherMessage('bot', inconnu || "Je ne connais pas ce mot.");
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
