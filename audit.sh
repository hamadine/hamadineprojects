#!/data/data/com.termux/files/usr/bin/bash

echo "🧠 Audit Dictionnaire Tadaksahak Multilingue en cours..."

cd ~/storage/shared/Acode/Dictionnaire\ Tadaksahak\ Multilingue/ || {
  echo "❌ Dossier projet introuvable"
  exit 1
}

echo "📁 Vérif fichiers..."
[[ -f index.html ]] && echo "✅ index.html trouvé" || echo "❌ index.html manquant"
[[ -f style.css ]] && echo "✅ style.css trouvé" || echo "❌ style.css manquant"
[[ -f script.js ]] && echo "✅ script.js trouvé" || echo "❌ script.js manquant"
[[ -f data/mots.json ]] && echo "✅ mots.json présent" || echo "❌ mots.json absent"
[[ -d images ]] && echo "✅ dossier images/ OK" || echo "❌ dossier images/ absent"

echo "🔎 Validation JSON..."
jq empty data/mots.json && echo "✅ JSON valide" || echo "❌ JSON invalide"

echo "🌐 Test de lien manifest..."
grep -q "manifest.*json" index.html && echo "✅ manifest lié dans HTML" || echo "❌ manifest manquant"

echo "🖼️ Vérif images..."
for img in images/idaksahak_round.png images/idaksahak_square_512.png; do
  [[ -f $img ]] && echo "✅ $img présent" || echo "❌ $img manquant"
done

echo "⚙️ Audit Git..."
git rev-parse --is-inside-work-tree &> /dev/null && echo "✅ Dépôt Git initialisé" || echo "❌ Git non initialisé"

echo "📏 Taille projet :"
du -sh .

echo "✅ Audit terminé."
