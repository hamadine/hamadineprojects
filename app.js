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

  // Lien rapide via data-tab-link (ex: bouton sur page accueil)
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
  // Interface
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
        // Optionnel : actualiser le texte de l’interface ici
      };
    });
  }
  // Traduction
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
        // Optionnel : actualiser la traduction ici
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

  // --- Chat ---
  function afficheMsgChat(who, html) {
    const c = document.getElementById('chatWindow');
    if(!c) return;
    const m = document.createElement('div');
    m.className = `message ${who}`;
    m.innerHTML = `<strong>${who==='bot'?interfaceData['fr']?.bot||'Bot':'Vous'}:</strong> ${html}`;
    c.appendChild(m);
    c.scrollTop = c.scrollHeight;
  }
  document.getElementById('btnEnvoyer')?.addEventListener('click', ()=>{
    const input = document.getElementById('chatInput');
    const txt = input.value.trim();
    if(!txt) return;
    input.value = '';
    afficheMsgChat('user', escapeHTML(txt));
    // Réponse bot simple (à améliorer)
    afficheMsgChat('bot', `Je suis Hamadine, pose-moi une question !`);
  });

  // --- Audio ---
  const audC = document.getElementById('audioContainer');
  if(audC && audiosList?.length) audiosList.forEach(a=>{
    const b = document.createElement('button');
    b.textContent = `▶️ ${a.title}`;
    b.onclick = () => new Audio(a.src).play();
    audC.appendChild(b);
  });

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

  logStatus("✅ Application prête.");
});
