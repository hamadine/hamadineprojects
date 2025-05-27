#!/bin/bash

# Corriger les IDs dans HTML/JS
find . -type f \( -name "*.html" -o -name "*.js" \) -exec sed -i \
-e 's/#motTexte/#mot-texte/g' \
-e 's/#searchBar/#search-bar/g' \
-e 's/#chatWindow/#chat-window/g' \
-e 's/#chatInput/#chat-input/g' {} +

# Corriger les IDs + keyframes dans style.css
sed -i \
-e 's/#motTexte/#mot-texte/g' \
-e 's/#searchBar/#search-bar/g' \
-e 's/#chatWindow/#chat-window/g' \
-e 's/#chatInput/#chat-input/g' \
-e 's/@keyframes fadeIn/@keyframes fade-in/g' \
-e 's/fadeIn/fade-in/g' style.css

# Ajouter des lignes vides avant chaque règle CSS si manquante
sed -i '/^[^[:space:]].*{/{x;/./{x;s/^/\n/;};x}' style.css

# Séparer chaque déclaration CSS sur une ligne
sed -i 's/;\s*/;\n/g' style.css

# Corriger les media queries
sed -i 's/(width\s*>\s*600px)/(min-width: 601px)/g' style.css
