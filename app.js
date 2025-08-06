document.addEventListener("DOMContentLoaded", () => {
  const motsComplet = typeof mots_final_489 !== "undefined" ? mots_final_489 : [];
  const interfaceData = typeof interface_langue !== "undefined" ? interface_langue : {};
  const histoireDocs = typeof histoire !== "undefined" ? histoire : [];
  let mots = [...motsComplet];
  let idx = parseInt(localStorage.getItem('motIndex')) || 0;
  const langueTrad = localStorage.getItem('langueTrad') || 'fr';
  const langueInterface = localStorage.getItem('langueInterface') || (navigator.language ? navigator.language.slice(0,2) : 'fr');

  const escapeHTML = str => str ? str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c])) : '';
  const nettoie = str => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").toLowerCase() : '';

  // Onglets
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.onglet-contenu').forEach(s => s.hidden = true);
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).hidden = false;
    };
  });

  document.querySelectorAll('[data-tab-link]').forEach(link => {
    link.onclick = e => {
      e.preventDefault();
      const id = link.getAttribute('data-tab-link');
      document.querySelector(`.tab-btn[data-tab="${id}"]`)?.click();
    };
  });

  const fuse = (typeof Fuse !== "undefined" && motsComplet.length)
    ? new Fuse(motsComplet, { keys: ['mot', 'fr', 'en'], threshold: 0.4 })
    : null;

  function showMot(i) {
    idx = Math.max(0, Math.min(mots.length - 1, i));
    localStorage.setItem('motIndex', idx);
    const m = mots[idx];
    document.getElementById('motTexte').textContent = m?.mot || '—';
    document.getElementById('definition').innerHTML =
      escapeHTML(m?.[langueTrad] || m?.fr || '—') +
      (m?.cat ? ` <span style="color:#888">(${escapeHTML(m.cat)})</span>` : '');
    document.getElementById('compteur').textContent = `${idx + 1}/${mots.length}`;
  }

  document.getElementById('btnPrev')?.addEventListener('click', () => showMot(idx - 1));
  document.getElementById('btnNext')?.addEventListener('click', () => showMot(idx + 1));

  document.getElementById('searchBar')?.addEventListener('input', e => {
    const q = nettoie(e.target.value);
    mots = q && fuse ? fuse.search(q).map(r => r.item) : [...motsComplet];
    if (mots.length) {
      showMot(0);
    } else {
      document.getElementById('motTexte').textContent = "Aucun résultat";
      document.getElementById('definition').textContent = "";
      document.getElementById('compteur').textContent = "0/0";
    }
  });

  if (mots.length) showMot(idx);

  let historiqueConversation = [];

  function afficheMsg(user, html) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;
    const div = document.createElement('div');
    div.className = `message ${user}`;
    const label = user === 'bot'
      ? (interfaceData[langueInterface]?.bot || 'Bot')
      : 'Moi';
    div.innerHTML = `<strong>${label}:</strong> ${html}`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    historiqueConversation.push({ user, html });
    if (historiqueConversation.length > 20) historiqueConversation.shift();
  }

  function reponseBot(txt) {
    const clean = nettoie(txt);
    const botInfo = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr']?.botIntelligence || {};

    const salutations = ["bonjour", "salut", "hello", "bonsoir", "bjr", "bsr", "salam"];
    if (salutations.some(s => clean.includes(s))) {
      const replies = [
        "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
        "Salut ! Besoin d'un mot ou d'une histoire ?",
        "Hello ! Je suis là pour vous guider.",
        "Bienvenue ! Vous cherchez une traduction ou une info ?",
        "Salam ! Envie de découvrir un mot en Tadaksahak ?",
        "Bonjour à toi ! Tu peux me demander une traduction, une anecdote ou une info.",
        "Je suis prêt, dis-moi un mot ou une question culturelle !",
        "Bienvenue sur Tadaksahak Learning, besoin d’un coup de main ?",
        "Tu peux me dire un mot en français, en anglais ou même en tadaksahak.",
        "On explore ensemble ? Essaie 'un mot au hasard' ou 'raconte-moi une histoire'.",
        "Hello camarade du désert ! Je suis tout ouïe.",
        "C’est Hamadine, ton guide multilingue — que cherches-tu ?",
        "Demande-moi un mot, une chanson, ou une info sur les Idaksahak.",
        "Je suis ici pour traduire, expliquer, et partager. Que veux-tu apprendre aujourd’hui ?"
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }

    const caVa = ["comment ca va", "comment ça va", "ça va", "cv"];
    if (caVa.some(s => clean.includes(s))) {
      const replies = [
        "Je vais très bien, merci ! Et vous ?",
        "Toujours prêt à discuter et à aider.",
        "Je me porte à merveille, surtout quand on parle de la langue Tadaksahak !",
        "Ça va bien alhamdoulillah !"
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }

    if (clean.includes("je ne sais pas") || clean.includes("aide") || clean.includes("j'hésite")) {
      return "Pas de souci ! Voulez-vous que je vous propose un mot au hasard ou une histoire sur la langue ?";
    }

    if (clean.length < 6 || ["?", "quoi", "hein"].some(x => clean.includes(x))) {
      return "Si vous cherchez une traduction, tapez un mot. Sinon, écrivez: donnes-moi une anecdote ou raconte-moi une histoire sur les Idaksahak !";
    }

    if ((botInfo.insultes || []).some(i => clean.includes(nettoie(i)))) {
      return botInfo.insulte || "Merci de rester poli.";
    }

    if ((botInfo.salutations_triggers || []).some(s => clean.includes(nettoie(s)))) {
      return botInfo.salutations[Math.floor(Math.random() * (botInfo.salutations.length || 1))] || "Bonjour !";
    }

    for (const q in (botInfo.faq || {})) {
      if (clean.includes(nettoie(q))) return botInfo.faq[q];
    }

    const m = motsComplet.find(m => nettoie(m.mot) === clean || nettoie(m.fr) === clean);
    if (m) {
      return `Vous cherchez ? <strong>${m.mot}</strong> = ${escapeHTML(m[langueTrad] || m.fr)}${m.en ? ` / en anglais : ${escapeHTML(m.en)}` : ''}`;
    }

    const hist = histoireDocs.find(h => clean.includes(nettoie(h.titre)));
    if (hist) {
      let out = `<strong>${escapeHTML(hist.titre)}</strong><br>${escapeHTML(hist.contenu)}`;
      if (hist.image) out += `<br><img src="${hist.image}" alt="" style="max-width:100%;margin-top:5px;" loading="lazy">`;
      if (hist.video) out += `<br><video controls width="100%" style="margin-top:5px;"><source src="${hist.video}" type="video/mp4"></video>`;
      return out;
    }

    if (historiqueConversation.length > 2) {
      return "Voulez-vous découvrir un mot du dictionnaire ? Ou avez-vous une question sur les Idaksahak ?";
    }

    return `🤖 Je n'ai pas compris précisément. Essayez un mot du dictionnaire ou demandez une anecdote.`;
  }

  function traiterSaisie() {
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = "";
    afficheMsg('user', escapeHTML(txt));
    const rep = reponseBot(txt);
    afficheMsg('bot', rep);
  }

  document.getElementById('btnEnvoyer')?.addEventListener('click', traiterSaisie);
  document.getElementById('chatInput')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      traiterSaisie();
    }
  });

  document.getElementById('toggleChatBot')?.addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="chat"]')?.click();
    window.scrollTo({ top: document.getElementById('chat').offsetTop, behavior: 'smooth' });
  });

  console.log("✅ app.js harmonisé chargé.");
});
