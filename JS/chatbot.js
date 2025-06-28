import { motsComplet } from './mots.js';

export function initialiserChatbot() {
  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
}

function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const question = input.value.trim();
  if (!question) return;
  afficherMessage('user', question);

  const reponse = genererReponse(question);
  afficherMessage('bot', reponse);
  input.value = '';
}

function genererReponse(texte) {
  const motTrouve = motsComplet.find(m =>
    Object.values(m).some(v => typeof v === 'string' && v.toLowerCase() === texte.toLowerCase())
  );
  if (motTrouve) {
    return `<strong>${motTrouve.mot}</strong><br>${motTrouve.fr || '—'} (${motTrouve.cat || '–'})`;
  }

  // Exemple d'intégration aux livres
  const contenuLivre = window.histoireDocs?.find(doc =>
    doc.contenu?.toLowerCase().includes(texte.toLowerCase())
  );
  if (contenuLivre) {
    return `<strong>Extrait du livre:</strong><br>${contenuLivre.contenu}`;
  }

  return "Je ne trouve pas la réponse, pouvez-vous reformuler ?";
}

function afficherMessage(auteur, texte) {
  const box = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = auteur;
  div.innerHTML = `<strong>${auteur === 'user' ? 'Vous' : 'Bot'}:</strong> ${texte}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
