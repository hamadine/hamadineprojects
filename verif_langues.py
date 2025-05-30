import json

langues = ['fr','en','ar','tz','tr','da','de','nl','sv','ru','zh','cs','ha','es','it']

with open('data/mots.json', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        if not line.strip():
            continue
        mot = json.loads(line)
        manquantes = [l for l in langues if l not in mot]
        if manquantes:
            print(f"Ligne {idx} ({mot.get('mot','?')}): Manque {manquantes}")
