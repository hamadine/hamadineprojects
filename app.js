document.addEventListener("DOMContentLoaded", () => {
  const motsComplet = typeof mots_final_489 !== "undefined" ? mots_final_489 : [];
  const interfaceData = typeof interface_langue !== "undefined" ? interface_langue : {};
  const histoireDocs = typeof histoire !== "undefined" ? histoire : [];
  const albumsAudio = typeof audios !== "undefined" ? audios[0]?.pistes || [] : [];

  let mots = [...motsComplet];
  let idx = parseInt(localStorage.getItem('motIndex')) || 0;
  const langueTrad = localStorage.getItem('langueTrad') || 'fr';
  const langueInterface = localStorage.getItem('langueInterface') || (navigator.language ? navigator.language.slice(0, 2) : 'fr');

  const escapeHTML = str => str ? str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c])) : '';

  const nettoie = str => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").toLowerCase() : '';

  // Onglets navigation
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

  // Bot Chat
  let historiqueConversation = [];

  function afficheMsg(user, html) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;
    const div = document.createElement('div');
    div.className = `message ${user}`;
    const label = user === 'bot' ? (interfaceData[langueInterface]?.bot || 'Bot') : 'Moi';
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
      const replies = botInfo.salutations || [
        "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
        "Salut ! Besoin d'un mot ou d'une histoire ?",
        "Hello ! Je suis là pour vous guider.",
        "Bienvenue ! Vous cherchez une traduction ou une info ?",
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }

    const caVa = ["comment ca va", "comment ça va", "ça va", "cv"];
    if (caVa.some(s => clean.includes(s))) {
      return "Je vais très bien, merci ! Et toi ?";
    }

    if (clean.includes("je ne sais pas") || clean.includes("aide") || clean.includes("j'hésite")) {
      return "Pas de souci ! Demande-moi un mot ou une anecdote Tadaksahak.";
    }

    if ((botInfo.insultes || []).some(i => clean.includes(nettoie(i)))) {
      return botInfo.insulte || "Merci de rester poli.";
    }

    for (const q in (botInfo.faq || {})) {
      if (clean.includes(nettoie(q))) return botInfo.faq[q];
    }

    const m = motsComplet.find(m => nettoie(m.mot) === clean || nettoie(m.fr) === clean);
    if (m) {
      return `📚 <strong>${m.mot}</strong> = ${escapeHTML(m[langueTrad] || m.fr)}${m.en ? ` / en: ${escapeHTML(m.en)}` : ''}`;
    }

    const hist = histoireDocs.find(h => clean.includes(nettoie(h.titre)));
    if (hist) {
      let out = `<strong>${escapeHTML(hist.titre)}</strong><br>${escapeHTML(hist.contenu)}`;
      if (hist.image) out += `<br><img src="${hist.image}" alt="" style="max-width:100%;margin-top:5px;" loading="lazy">`;
      if (hist.video) out += `<br><video controls width="100%" style="margin-top:5px;"><source src="${hist.video}" type="video/mp4"></video>`;
      return out;
    }

    return "Je n’ai pas compris. Essaie un mot ou dis-moi 'une histoire'.";
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

  // 🎧 Génération dynamique des albums audio avec affichage des paroles
  function genererAlbumsAudio() {
    const conteneur = document.getElementById('audioContainer');
    if (!conteneur || !albumsAudio.length) return;

    const section = document.createElement('section');
    const titre = document.createElement('h3');
    titre.textContent = "Album Hamadine";
    section.appendChild(titre);

    albumsAudio.forEach((piste, index) => {
      const bloc = document.createElement('div');
      bloc.className = 'audio-bloc';
      const idLyrics = `lyrics-${index}`;

      bloc.innerHTML = `
        <p><strong>${escapeHTML(piste.title)}</strong></p>
        <audio controls src="${piste.src}" preload="none"></audio>
        ${piste.lyrics ? `<button class="btnLyrics" data-target="${idLyrics}">🎵 Voir les paroles</button>
        <pre id="${idLyrics}" class="lyrics-text" style="display:none;">${escapeHTML(piste.lyrics)}</pre>` : ''}
      `;

      section.appendChild(bloc);
    });

    conteneur.appendChild(section);

    conteneur.querySelectorAll('.btnLyrics').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-target');
        const el = document.getElementById(id);
        if (el) {
          const isVisible = el.style.display === 'block';
          el.style.display = isVisible ? 'none' : 'block';
          btn.textContent = isVisible ? '🎵 Voir les paroles' : '🎵 Masquer les paroles';
        }
      });
    });
  }

  genererAlbumsAudio();

  console.log("✅ app.js harmonisé et chargé.");
});
