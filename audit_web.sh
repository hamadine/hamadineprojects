#!/bin/bash

echo "===== AUDIT WEB LOCAL (Termux) ====="

# 1. Vérifier présence des fichiers clés
echo "[*] Vérification des fichiers essentiels..."
for file in index.html mots.json; do
  if [ ! -f "$file" ]; then
    echo "[ERREUR] Fichier manquant : $file"
  else
    echo "[OK] $file trouvé"
  fi
done

# 2. Rechercher les appels fetch() dans les fichiers JS
echo -e "\n[*] Analyse des appels fetch()..."
grep -Ri fetch . --include="*.js"

# 3. Vérifier si JSON est bien formé
echo -e "\n[*] Vérification de la validité de mots.json..."
python3 -m json.tool mots.json > /dev/null && echo "[OK] mots.json est bien formé" || echo "[ERREUR] mots.json invalide"

# 4. Récupérer et afficher IP locale
echo -e "\n[*] Adresse IP locale :"
ip addr | grep inet | grep wlan | awk '{print $2}' | cut -d/ -f1

# 5. Lancer le serveur
echo -e "\n[*] Lancement du serveur HTTP sur le port 8000..."
python3 -m http.server 8000

echo -e "\nOuvre http://<IP>:8000 sur ton second téléphone"
