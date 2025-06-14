let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;

// Détection des langues par défaut
const langueNavigateur = navigator.language.slice(0, 2) || 'fr';
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;

let fuse;

// Chargement initial
async function chargerDonnees() {
  try {
    const motsData = await fetch('data/mots.json').then(r => r.json());
    if (!motsData.length) throw new Error("La liste de mots est vide.");
    motsComplet = motsData;
    mots = [...motsData];

    interfaceData = await fetch('data/interface-langue.json').then(r => r.json());

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
    alert("Erreur lors du chargement des données : " + err.message);
  }
}

// Affichage du mot
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

// Changer la langue d’interface
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

  document.getElementById('btnLangueInterface').textContent = `Interface : ${lang.toUpperCase()} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${langueTrad.toUpperCase()} ⌄`;

  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";

  initialiserMenusLangues();
}

// Changer la langue de traduction
function changerLangueTraduction(lang) {
  langueTrad = lang;
  localStorage.setItem('langueTrad', lang);
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${langueTrad.toUpperCase()} ⌄`;
  afficherMot();
}

// Menus des langues
function initialiserMenusLangues() {
  const panelInterface = document.getElementById('menuLangueInterface');
  const panelTrad = document.getElementById('menuLangueTrad');

  panelInterface.innerHTML = '';
  panelTrad.innerHTML = '';

  Object.keys(interfaceData).forEach(code => {
    const btn = document.createElement('button');
    btn.textContent = code.toUpperCase();
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
    btn.textContent = code.toUpperCase();
    btn.className = 'langue-btn';
    btn.onclick = () => {
      changerLangueTraduction(code);
      panelTrad.setAttribute('hidden', '');
    };
    panelTrad.appendChild(btn);
  });
}

// Chatbot enrichi
function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim().toLowerCase();
  if (!message) return;

  afficherMessage('utilisateur', message);
  input.value = '';

  setTimeout(() => {
    const correspondances = motsComplet.filter(mot =>
      Object.entries(mot).some(([cle, valeur]) =>
        cle !== 'cat' && typeof valeur === 'string' && valeur.toLowerCase() === message
      )
    );

    if (correspondances.length > 0) {
      let reponse = correspondances.map(m => {
        const autres = motsComplet.filter(
          x => x.mot === m.mot && x !== m
        );

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

    // Recherche floue avec Fuse.js
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

      afficherMessage('bot', `Je n’ai pas trouvé ce mot exactement, mais peut-être vouliez-vous dire :<br>${suggestions}`);
    } else {
      const texte = `Désolé, ce mot n’est pas encore disponible.<br><br>
      🤖 Hamadine travaille d’arrache-pied pour enrichir sa base lexicale, actuellement en développement.<br>
      Ce mot a été noté pour améliorer le dictionnaire. Merci pour votre contribution 🙏`;
      afficherMessage('bot', texte);
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
