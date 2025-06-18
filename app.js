let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
let historiqueChat = JSON.parse(localStorage.getItem('chatHistorique') || '[]');

const langueNavigateur = navigator.language.slice(0,2) || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || langueNavigateur;
let langueTrad = localStorage.getItem('langueTrad') || 'fr';

const nomsLangues = {
  fr:"Français", en:"English", ar:"العربية", tz:"Tamazight",
  tr:"Türkçe", da:"Dansk", de:"Deutsch", nl:"Nederlands",
  sv:"Svenska", ru:"Русский", zh:"中文", cs:"Čeština",
  ha:"Hausa", es:"Español", it:"Italiano"
};

let fuse = null;

async function chargerDonnees(){
  try {
    const [mRes, iRes] = await Promise.all([
      axios.get('data/mots.json'),
      axios.get('data/interface-langue.json')
    ]);
    motsComplet = mRes.data; mots = [...motsComplet];
    interfaceData = iRes.data;

    if (!interfaceData[langueInterface]) langueInterface = 'fr';
    if (!mots[0] || !(langueTrad in mots[0])) langueTrad = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenus();

    fuse = new Fuse(mots, {
      keys:['mot', ...Object.keys(mots[0]).filter(k=>k.length<=3&&k!=='cat')],
      threshold:0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex'))||0;
    afficherMot(indexMot);
    restaurerHistorique();

  } catch(e){
    console.error(e);
    alert("Erreur de JSON — vérifiez data/mots.json et interface-langue.json");
  }
}

function initialiserMenus(){
  const pi = document.getElementById('menuLangueInterface');
  const pt = document.getElementById('menuLangueTrad');
  pi.innerHTML = ''; pt.innerHTML = '';

  Object.keys(interfaceData).forEach(c=>{
    const b=document.createElement('button');
    b.textContent = nomsLangues[c]||c;
    b.onclick=()=>{changerLangueInterface(c); pi.hidden=true};
    pi.appendChild(b);
  });

  Object.keys(motsComplet[0]).filter(k=>k.length<=3 && !['mot','cat'].includes(k))
  .forEach(c=>{
    const b=document.createElement('button');
    b.textContent = nomsLangues[c]||c;
    b.onclick=()=>{
      langueTrad=c;
      localStorage.setItem('langueTrad',c);
      updateButtons();
      afficherMot(indexMot);
      pt.hidden=true;
    };
    pt.appendChild(b);
  });
  updateButtons();
}

function updateButtons(){
  document.getElementById('btnLangueInterface').textContent = `Interface : ${nomsLangues[langueInterface]||langueInterface} ⌄`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${nomsLangues[langueTrad]||langueTrad} ⌄`;
}

function changerLangueInterface(l){
  if (!(l in interfaceData)) l='fr';
  langueInterface=l;
  localStorage.setItem('langueInterface',l);
  const t = interfaceData[l];
  document.documentElement.lang = l;
  document.title = t.titrePrincipal;
  ['titrePrincipal','textePresentation','btnEnvoyer','chat-title','footerText']
  .forEach(id=>{
    const el = document.getElementById(id);
    if(el){
      if(id==='btnEnvoyer') el.textContent = t.envoyer;
      else el.textContent = t[id] || el.textContent;
    }
  });
  document.getElementById('searchBar').placeholder = t.searchPlaceholder;
  document.getElementById('btnEnvoyer').textContent = t.envoyer;
  document.getElementById('chat-title').textContent = t.chatTitre;
  document.getElementById('botIntro').innerHTML = t.botIntro;
  window.reponseBot = t.reponseBot;
  window.nomUtilisateur = t.utilisateur;

  updateButtons();
}

function afficherMot(i=0){
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length-1, i));
  localStorage.setItem('motIndex',indexMot);
  const m = mots[indexMot];
  document.getElementById('motTexte').textContent = m.mot||'—';
  document.getElementById('definition').innerHTML =
    (m[langueTrad]||'—') + (m.cat?` <span style="color:#888;">(${m.cat})</span>`:'') +
    (m.synonymes?`<br><em>Synonymes :</em> ${m.synonymes.join(', ')}`:'');
  document.getElementById('compteur').textContent = `${indexMot+1} / ${mots.length}`;
}

function motPrecedent(){ if(indexMot>0) afficherMot(indexMot-1) }
function motSuivant(){ if(indexMot<mots.length-1) afficherMot(indexMot+1) }

let dT;
function rechercherMotDebounce(){
  clearTimeout(dT);
  dT = setTimeout(rechercherMot,300);
}

function rechercherMot(){
  const q = document.getElementById('searchBar').value.trim().toLowerCase();
  if(!q){ mots=[...motsComplet]; afficherMot(0); return }
  const res = fuse.search(q);
  mots = res.map(r=>r.item);
  if(mots.length) afficherMot(0);
  else {
    document.getElementById('motTexte').textContent="❌ Aucun mot trouvé";
    document.getElementById('definition').innerHTML="<em>Vérifiez l'orthographe.</em>";
    document.getElementById('compteur').textContent = "0 / 0";
  }
}

function envoyerMessage(){
  const inp = document.getElementById('chatInput');
  const msg = inp.value.trim().toLowerCase();
  if(!msg) return;
  afficherMessage('utilisateur',msg); ajouterHistorique('utilisateur',msg);
  inp.value = '';

  const bd = interfaceData[langueInterface]?.botIntelligence || interfaceData['fr'].botIntelligence;
  const {
    salutations_triggers=[], salutations=[],
    remerciements=[], insulte="Merci de rester respectueux.",
    faq={}, inconnu, reponseBot
  } = bd;

  if(salutations_triggers.some(t=>msg.includes(t))){
    const rep = salutations[Math.floor(Math.random()*salutations.length)]||salutations[0]||"Salut !";
    afficherMessage('bot',rep); ajouterHistorique('bot',rep);
    return;
  }

  if(remerciements.some(r=>msg.includes(r))){
    const rep = remerciements[Math.floor(Math.random()*remerciements.length)]||remerciements[0]||"Avec plaisir !";
    afficherMessage('bot',rep); ajouterHistorique('bot',rep);
    return;
  }

  if((bd.insultes||[]).some(i=>msg.includes(i))){
    afficherMessage('bot',insulte); ajouterHistorique('bot',insulte);
    return;
  }

  for(let q in faq){
    if(msg.includes(q)){
      const rep = faq[q];
      afficherMessage('bot',rep); ajouterHistorique('bot',rep);
      return;
    }
  }

  traiterRecherche(msg, reponseBot, inconnu);
}

function traiterRecherche(msg, reponseBot, inconnu){
  setTimeout(()=>{
    const exacts = motsComplet.filter(m=>
      Object.entries(m).some(([k,v])=>k!=='cat' && typeof v==='string' && v.toLowerCase()===msg)
    );
    if(exacts.length){
      const txt = exacts.map(m=>{
        const trs = Object.entries(m).filter(([k])=>!['mot','cat'].includes(k))
        .map(([k,v])=>`<strong>${k.toUpperCase()}</strong>: ${v}`).join('<br>');
        return `${reponseBot}<br>${trs}`;
      }).join('<br><br>');
      afficherMessage('bot',txt); ajouterHistorique('bot',txt);
    } else {
      const fb = inconnu||window.reponseBot;
      afficherMessage('bot',fb); ajouterHistorique('bot',fb);
    }
  }, 300);
}

function sanitize(text){
  const d=document.createElement('div');
  d.innerText = text;
  return d.innerHTML;
}

function afficherMessage(type, text){
  const cb=document.getElementById('chatWindow');
  const m=document.createElement('div');
  m.className=`message ${type}`;
  m.innerHTML=`<strong>${type==='utilisateur'?window.nomUtilisateur:'Bot'}:</strong> ${sanitize(text)}`;
  cb.appendChild(m);
  cb.scrollTop = cb.scrollHeight;
}

function ajouterHistorique(type,text){
  historiqueChat.push({type,text});
  localStorage.setItem('chatHistorique',JSON.stringify(historiqueChat.slice(-50)));
}

function restaurerHistorique(){
  historiqueChat.forEach(m=>afficherMessage(m.type,m.text));
}

window.addEventListener('DOMContentLoaded', chargerDonnees);
