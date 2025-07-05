import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';

let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
const langueNavigateur = navigator.language.slice(0, 2);
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || (langueNavigateur === 'en' ? 'en' : 'fr');
let fuse;

function afficherLog(msg, type = 'info') {
  const el = document.getElementById('messageStatus');
  if (!el) return;
  el.style.color = type === 'error' ? 'red' : 'green';
  el.textContent = msg;
  el.hidden = false;
}

async function chargerDonnees() {
  try {
    afficherLog("🔄 Chargement des données...");
    const [motsRes, interfaceRes, histRes] = await Promise.all([
      fetch('data/mots.json').then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch('data/interface-langue.json').then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch(`data/${langueInterface === 'en' ? 'histoire-en.json' : 'histoire.json'}`)
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
    ]);

    if (!Array.isArray(motsRes) || motsRes.length === 0) {
      throw new Error("⚠️ Le fichier data/mots.json est vide ou invalide.");
    }

    motsComplet = motsRes;
    mots = [...motsComplet];
    interfaceData = interfaceRes;
    window.histoireDocs = histRes;

    if (!Object.keys(mots[0]).includes(langueTrad)) langueTrad = 'fr';
    if (!interfaceData[langueInterface]) langueInterface = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

    fuse = new Fuse(mots, {
      keys: ['mot', 'fr', 'en'],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
    afficherLog("✅ Données chargées, dictionnaire prêt.");
  } catch (e) {
    afficherLog("Erreur : " + e.message, 'error');
    console.error(e);
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

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const txt = input.value.trim();
  if (!txt) return;
  const clean = nettoyerTexte(txt);
  input.value = '';
  afficherMessage('utilisateur', escapeHTML(txt));

  const botData = interfaceData[langueInterface]?.botIntelligence || {};
  const faq = botData.faq || {};

  if (botData.insultes?.some(i => clean.includes(nettoyerTexte(i)))) {
    return afficherMessage('bot', botData.insulte || "🙏 Merci de rester poli.");
  }
  if (botData.salutations_triggers?.some(trigger => clean.includes(nettoyerTexte(trigger)))) {
    const rep = botData.salutations[Math.floor(Math.random() * botData.salutations.length)];
    return afficherMessage('bot', rep);
  }
  for (const q in faq) {
    if (clean.includes(nettoyerTexte(q))) {
      return afficherMessage('bot', faq[q]);
    }
  }

  const res = fuse.search(txt).slice(0, 1);
  if (res.length) {
    const m = res[0].item;
    return afficherMessage('bot',
      `🔍 <strong>${m.mot}</strong><br>Français : <strong>${m.fr}</strong><br>Anglais : <strong>${m.en}</strong>`
    );
  }

  rechercherDansHistoire(clean);
}

function rechercherDansHistoire(clean) {
  const trig = interfaceData[langueInterface]?.chatTriggers || {};
  const phr = interfaceData[langueInterface]?.chatPhrases || {};

  for (const [trigger, key] of Object.entries(trig)) {
    if (clean.includes(nettoyerTexte(trigger))) {
      const intro = phr[key] || `🔎 Voici ce que j’ai trouvé sur "${trigger}" :`;
      const match = window.histoireDocs.find(d =>
        nettoyerTexte(d.titre + d.contenu).includes(nettoyerTexte(trigger))
      );
      if (match) {
        return afficherMessage('bot',
          `<strong>${escapeHTML(match.titre)}</strong><br>${escapeHTML(match.contenu)}<br>` +
          `<button class="btn-icon btn-ecouter" data-audio="${trigger}">🔊 Écouter</button>`
        );
      }
    }
  }

  const results = window.histoireDocs.filter(d =>
    nettoyerTexte(d.titre).includes(clean) ||
    nettoyerTexte(d.contenu).includes(clean)
  );
  if (results.length) {
    const bloc = results.map(d => `<strong>${escapeHTML(d.titre)}</strong><br>${escapeHTML(d.contenu)}`).join('<hr>');
    return afficherMessage('bot', bloc);
  }

  afficherMessage('bot', interfaceData[langueInterface]?.incompréhension ||
    "❓ Je ne comprends pas encore ce mot. Essaie un autre mot ou une autre phrase !");
}

function afficherMessage(type, contenu) {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (interfaceData[langueInterface]?.utilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  msg.querySelectorAll('.btn-ecouter').forEach(btn => {
    btn.addEventListener('click', () => {
      const audio = new Audio(`audios/${btn.dataset.audio}.mp3`);
      audio.play().catch(_ => alert("⚠️ Audio introuvable."));
    });
  });
}

function nettoyerTexte(str) {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .toLowerCase();
}

const nomsLangues = { fr: "Français", en: "English" };

function initialiserMenusLangues() {
  ['Interface', 'Trad'].forEach(type => {
    const btn = document.getElementById(`btnLangue${type}`);
    const menu = document.getElementById(`menuLangue${type}`);
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        menu.innerHTML = Object.entries(nomsLangues)
          .map(([code, nom]) => `<button class="langue-item" data-code="${code}">${nom}</button>`)
          .join('');
        menu.querySelectorAll('button').forEach(b => {
          b.onclick = () => {
            const val = b.dataset.code;
            localStorage.setItem(type === 'Interface' ? 'langueInterface' : 'langueTrad', val);
            if (type === 'Interface') location.reload();
            else {
              langueTrad = val;
              afficherMot(indexMot);
            }
            menu.hidden = true;
          };
        });
      }
    });
  });
}

function changerLangueInterface(code) {
  const data = interfaceData[code] || interfaceData.fr;
  document.documentElement.lang = code;
  document.body.dir = code === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[code]} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad]} ⌄`;
  document.getElementById('chat-title').textContent = data.chatTitre;
  document.getElementById('botIntro').innerHTML = data.botIntro;
  document.getElementById('btnEnvoyer').textContent = data.envoyer;
  document.getElementById('searchBar').placeholder = data.searchPlaceholder;
}

/* THÈME VISUEL */
function appliquerThemeVisuel(theme) {
  const body = document.body;
  body.classList.remove('theme-clair', 'theme-vert', 'theme-sombre');
  body.classList.add(`theme-${theme}`);
  localStorage.setItem('themeLivres', theme);
}

function initialiserThemeVisuel() {
  const select = document.getElementById('selectThemeLivres');
  if (!select) return;

  const theme = localStorage.getItem('themeLivres') || 'clair';
  select.value = theme;
  appliquerThemeVisuel(theme);

  select.addEventListener('change', () => {
    appliquerThemeVisuel(select.value);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  initialiserThemeVisuel();
});
