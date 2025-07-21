document.addEventListener("DOMContentLoaded", () => {
  // --- Données issues de tes scripts data/*.js ---
  const motsComplet = typeof mots_final_489 !== "undefined" ? mots_final_489 : [];
  const interfaceData = typeof interface_langue !== "undefined" ? interface_langue : {};
  const histoireDocs = typeof histoire !== "undefined" ? histoire : [];
  const audiosList = typeof audios !== "undefined" ? audios : [];
  const photosList = typeof photos !== "undefined" ? photos : [];
  const videosList = typeof videos !== "undefined" ? videos : [];
  const docsList = typeof docs !== "undefined" ? docs : [];
  const livresList = typeof livres !== "undefined" ? livres : [];
  const quizList = typeof quiz !== "undefined" ? quiz : [];

  // --- Utils ---
  const escapeHTML = str => str.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const nettoie = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w\s]/g,"").toLowerCase();
  const logStatus = (txt, type='info') => {
    const e = document.getElementById('messageStatus'); if(!e)return;
    e.textContent = txt;
    e.style.color = (type==='error'?'red':'green');
    e.hidden = false;
    setTimeout(() => { e.hidden = true; }, 3000);
  };
  // --- Navigation par onglets ---
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.onglet-contenu').forEach(s=>s.hidden=true);
      btn.classList.add('active');
      const id = btn.dataset.tab;
      document.getElementById(id).hidden = false;
    };
  });

  // Lien rapide via data-tab-link
  document.querySelectorAll('[data-tab-link]').forEach(link=>{
    link.onclick = e => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab-link');
      document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.click();
    };
  });

  // --- Sélection de langue interface et traduction ---
  const langues = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
  ];
  const btnLangueInterface = document.getElementById('btnLangueInterface');
  const menuLangueInterface = document.getElementById('menuLangueInterface');
  if(btnLangueInterface && menuLangueInterface) {
    btnLangueInterface.addEventListener('click', () => {
      menuLangueInterface.hidden = !menuLangueInterface.hidden;
    });
    menuLangueInterface.innerHTML = langues.map(lang =>
      `<button class="lang-choice" data-lang="${lang.code}">${lang.label}</button>`
    ).join('');
    menuLangueInterface.querySelectorAll('.lang-choice').forEach(btn => {
      btn.onclick = () => {
        btnLangueInterface.innerHTML = `🌐 Interface&nbsp;: ${btn.textContent} <span class="chevron">▼</span>`;
        menuLangueInterface.hidden = true;
        localStorage.setItem('langueInterface', btn.dataset.lang);
        logStatus(`Langue interface sélectionnée : ${btn.textContent}`);
      };
    });
  }

  const btnLangueTrad = document.getElementById('btnLangueTrad');
  const menuLangueTrad = document.getElementById('menuLangueTrad');
  if(btnLangueTrad && menuLangueTrad) {
    btnLangueTrad.addEventListener('click', () => {
      menuLangueTrad.hidden = !menuLangueTrad.hidden;
    });
    menuLangueTrad.innerHTML = langues.map(lang =>
      `<button class="lang-choice" data-lang="${lang.code}">${lang.label}</button>`
    ).join('');
    menuLangueTrad.querySelectorAll('.lang-choice').forEach(btn => {
      btn.onclick = () => {
        btnLangueTrad.innerHTML = `🈯 Traduction&nbsp;: ${btn.textContent} <span class="chevron">▼</span>`;
        menuLangueTrad.hidden = true;
        localStorage.setItem('langueTrad', btn.dataset.lang);
        logStatus(`Langue traduction sélectionnée : ${btn.textContent}`);
      };
    });
  }

  // --- Dictionnaire ---
  let mots = [...motsComplet], idx = parseInt(localStorage.getItem('motIndex')) || 0;
  let langueTrad = localStorage.getItem('langueTrad') || 'fr';
  let fuse;
  if(typeof Fuse !== "undefined" && mots.length) {
    fuse = new Fuse(mots, { keys:['mot','fr','en'], threshold:0.4 });
  }
  function showMot(n) {
    idx = Math.max(0,Math.min(mots.length-1,n));
    localStorage.setItem('motIndex', idx);
    const m = mots[idx];
    document.getElementById('motTexte').textContent = m?.mot || '—';
    document.getElementById('definition').innerHTML = escapeHTML(m?.[langueTrad] || '—') + (m?.cat ? ` <span style="color:#888">(${escapeHTML(m.cat)})</span>` : '');
    document.getElementById('compteur').textContent = `${idx+1}/${mots.length}`;
  }
  document.getElementById('btnPrev')?.addEventListener('click', ()=>showMot(idx-1));
  document.getElementById('btnNext')?.addEventListener('click', ()=>showMot(idx+1));
  document.getElementById('searchBar')?.addEventListener('input', e=>{
    const q = nettoie(e.target.value);
    mots = q && fuse ? fuse.search(q).map(r=>r.item) : [...motsComplet];
    mots.length ? showMot(0) : (
      document.getElementById('motTexte').textContent = "Aucun résultat",
      document.getElementById('definition').textContent = "",
      document.getElementById('compteur').textContent = ""
    );
  });
  if(mots.length) showMot(idx);
  // --- Chat intelligent local ---
  function afficheMsgChat(who, html) {
    const c = document.getElementById('chatWindow');
    if (!c) return;
    const m = document.createElement('div');
    m.className = `message ${who}`;
    m.innerHTML = `<strong>${who === 'bot' ? interfaceData['fr']?.bot || 'Bot' : 'Vous'}:</strong> ${html}`;
    c.appendChild(m);
    c.scrollTop = c.scrollHeight;
  }

  function chercheDansDictionnaire(question) {
    const mot = question.toLowerCase().trim();
    const entree = motsComplet.find(m => nettoie(m.mot).includes(nettoie(mot)));
    return entree
      ? `Le mot <strong>${entree.mot}</strong> signifie : <em>${entree[langueTrad] || entree.fr}</em>.`
      : null;
  }

  function chercheDansHistoire(question) {
    return histoireDocs.find(h => question.toLowerCase().includes(h.title.toLowerCase()))
      ? `🔎 Consulte un document historique correspondant dans la section 📚 Livres ou Histoire.`
      : null;
  }

  function chercheDansDocs(question) {
    const doc = docsList.find(d => question.toLowerCase().includes(d.title.toLowerCase()));
    return doc
      ? `📄 Tu trouveras des infos dans « ${doc.title} » (${doc.date}) dans la section Rapports ou Actualités.`
      : null;
  }

  function chercheDansLivres(question) {
    const livre = livresList.find(l => question.toLowerCase().includes(l.title.toLowerCase()));
    return livre
      ? `📘 Le livre « ${livre.title} » pourrait t’intéresser. Va dans l’onglet 📚 Livres.`
      : null;
  }

  function chercheDansQuiz(question) {
    const q = quizList.find(q => question.toLowerCase().includes(q.q.toLowerCase()));
    return q
      ? `🧠 Voici une question liée dans le quiz : « ${q.q} »`
      : null;
  }

  document.getElementById('btnEnvoyer')?.addEventListener('click', () => {
    const input = document.getElementById('chatInput');
    const txt = input.value.trim();
    if (!txt) return;
    input.value = '';
    afficheMsgChat('user', escapeHTML(txt));

    const reponse = chercheDansDictionnaire(txt)
      || chercheDansHistoire(txt)
      || chercheDansDocs(txt)
      || chercheDansLivres(txt)
      || chercheDansQuiz(txt)
      || `🤖 Je ne suis pas sûr de comprendre. Essaie un autre mot ou explore les sections :
        <ul>
          <li><code>Dictionnaire 📖</code></li>
          <li><code>Rapports 📄</code></li>
          <li><code>Livres 📚</code></li>
          <li><code>Quiz ❓</code></li>
        </ul>`;

    afficheMsgChat('bot', reponse);
  });
// --- Audio ---
console.log('audiosList:', audiosList);
const audC = document.getElementById('audioContainer');
if (audC && audiosList?.length) {
  audiosList.forEach(album => {
    const albumTitre = document.createElement('h3');
    albumTitre.innerHTML = `🎵 <span class="album-name">${album.album}</span>`;
    audC.appendChild(albumTitre);

    album.pistes.forEach(piste => {
      const conteneur = document.createElement('div');
      conteneur.className = 'audio-track';

      const titre = document.createElement('span');
      titre.textContent = piste.title;

      const lecteur = document.createElement('audio');
      lecteur.controls = true;
      lecteur.src = piste.src;

      // Lien absolu et message de partage
      const url = new URL(piste.src, window.location.origin).href;
      const message = encodeURIComponent(`${piste.title} – Écoutez ici : ${url}`);

      // Bouton de partage
      const boutonPartage = document.createElement('button');
      boutonPartage.textContent = '📤 Partager';
      boutonPartage.className = 'btn-share';

      const menuPartage = document.createElement('div');
      menuPartage.className = 'share-menu';
      menuPartage.innerHTML = `
        <a href="https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${message}" target="_blank">Facebook</a>
        <a href="https://twitter.com/intent/tweet?text=${message}" target="_blank">Twitter</a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${message}" target="_blank">LinkedIn</a>
        <a href="https://www.reddit.com/submit?url=${url}&title=${message}" target="_blank">Reddit</a>
        <a href="https://www.tiktok.com/upload?lang=fr" target="_blank">TikTok</a>
      `;
      menuPartage.style.display = 'none';

      boutonPartage.addEventListener('click', () => {
        menuPartage.style.display = menuPartage.style.display === 'none' ? 'block' : 'none';
      });

      conteneur.appendChild(titre);
      conteneur.appendChild(lecteur);
      conteneur.appendChild(boutonPartage);
      conteneur.appendChild(menuPartage);
      audC.appendChild(conteneur);
    });
  });
}

  // --- Photos ---
  const photC = document.getElementById('photosContainer');
  if(photC && photosList?.length) photosList.forEach(p=>{
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.alt || '';
    photC.appendChild(img);
  });

  // --- Vidéos ---
  const vidC = document.getElementById('videosContainer');
  if(vidC && videosList?.length) videosList.forEach(v=>{
    const video = document.createElement('video');
    video.controls = true;
    video.src = v.src;
    video.title = v.title;
    video.dataset.date = v.date;
    vidC.appendChild(video);
  });
  document.getElementById('filtreVideos')?.addEventListener('change', e=>{
    const ord = e.target.value==='ancien'?1:-1;
    Array.from(vidC.children)
      .sort((a,b)=>(new Date(a.dataset.date)-new Date(b.dataset.date))*ord)
      .forEach(n=>vidC.appendChild(n));
  });
  // --- Rapports & Actualités ---
  const docC = document.getElementById('rapportsContainer');
  if(docC && docsList?.length) docsList.filter(d=>d.type!=='communique').forEach(d=>{
    docC.innerHTML += `<a href="${d.url}" target="_blank">${d.title}</a> (${d.date})<br>`;
  });

  const actC = document.getElementById('newsContainer');
  if(actC && docsList?.length) docsList.filter(d=>d.type==='communique').forEach(d=>{
    actC.innerHTML += `<a href="${d.url}" target="_blank">${d.title}</a> (${d.date})<br>`;
  });

  // --- Livres ---
  const libC = document.getElementById('livresContainer');
  function filtreLivres() {
    const kw = document.getElementById('rechercheLivres').value.toLowerCase();
    const sel = document.getElementById('selectThemeLivres').value;
    libC.innerHTML = livresList
      .filter(l => (!sel || l.cat===sel) && l.title.toLowerCase().includes(kw))
      .map(l => `<a href="${l.url}" target="_blank">${l.title}</a><br>`).join('');
  }
  document.getElementById('rechercheLivres')?.addEventListener('input', filtreLivres);
  document.getElementById('selectThemeLivres')?.addEventListener('change', filtreLivres);
  filtreLivres();

  // --- Quiz ---
  const quizC = document.getElementById('quizContainer');
  if(quizC && quizList?.length) {
    let qi=0, score=0;
    function nextQ() {
      if(qi >= quizList.length) {
        quizC.innerHTML = `Votre score: ${score}/${quizList.length}`;
        return;
      }
      const q = quizList[qi];
      quizC.innerHTML = `<h3>${q.q}</h3>` + q.opts.map((o,i)=>`<button class="quizOpt" data-i="${i}">${o}</button>`).join('');
      quizC.querySelectorAll('.quizOpt').forEach(b=>{
        b.onclick = ()=>{
          if(parseInt(b.dataset.i) === q.a) score++;
          qi++; nextQ();
        };
      });
    }
    nextQ();
  }
  // --- Bouton flottant Chat ---
  document.getElementById('toggleChatBot')?.addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="chat"]')?.click();
    window.scrollTo({ top: document.getElementById('chat').offsetTop, behavior: 'smooth' });
  });

  // --- Fin ---
  logStatus("✅ Application prête.");
});
