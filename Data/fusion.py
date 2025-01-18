import json
import glob
from datetime import datetime

user = "Hani"
# Chemin vers les fichiers JSON
chemin_fichiers = user + "/Spotify Extended Streaming History/*.json"

print(chemin_fichiers)

# Liste pour stocker les données fusionnées
data_fusionnee = []

# Parcourir chaque fichier JSON
for fichier in glob.glob(chemin_fichiers):
    with open(fichier, 'r', encoding='utf-8') as f:
        try:
            # Charger les données JSON
            data = json.load(f)
            # Vérifier si c'est une liste ou un seul objet
            if isinstance(data, dict):
                data = [data]
            # Filtrer les entrées de 2024 et les ajouter à la liste fusionnée
            for entree in data:
                data_fusionnee.append(entree)
        except json.JSONDecodeError:
            print(f"Erreur de lecture du fichier : {fichier}")

# Écrire les données fusionnées dans un nouveau fichier JSON
with open(user + '/' + user + '_donnees_fusionnees_2024.json', 'w', encoding='utf-8') as f:
    json.dump(data_fusionnee, f, indent=4, ensure_ascii=False)

print(f"Fusion et filtrage terminés. {len(data_fusionnee)} entrées sauvegardées dans " + user + "'_donnees_fusionnees_2024.json'.")
