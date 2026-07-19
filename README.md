# Compteur de Points - Multi-Jeux 🎮

Application web progressive pour le comptage multi-joueurs temps réel, avec support pour "Le 10 000" et architecture modulaire pour d'autres jeux.

**Live Demo:** [https://epcrd63000.github.io/Compteur-jeux/](https://epcrd63000.github.io/Compteur-jeux/)

## ✨ Fonctionnalités principales

### Multi-Joueurs, Groupes & Roulette 👥🎡
- ✅ **Gestion multi-joueurs** - Jusqu'à 10 joueurs pour Le 10 000/Scrabble, et limité à 6 pour les Dames Chinoises
- ✅ **Roulette "Qui commence"** - Tirage au sort animé avec décélération visuelle pour désigner le premier joueur
- ✅ **Rivalités (Groupes Sauvegardés)** - Créez et nommez des groupes de joueurs réguliers pour configurer la table de jeu en un clic (limité à 6 max pour les Dames Chinoises)
- ✅ **Réorganisation à la volée** - Modifiez l'ordre de passage des joueurs à tout moment via des boutons de déplacement (Haut/Bas)
- ✅ **Compteurs séparés & Persistance** - Sauvegarde distincte automatique de la partie en cours pour chaque jeu (Scrabble, 10 000, Dames Chinoises) dans le stockage du navigateur (`localStorage`) et Supabase.

### Jeux Supportés 🎮
- ✅ **Le 10 000** : Compteur aux multiples de 50 avec boutons rapides.
- ✅ **Scrabble** : Compteur libre avec pavé numérique dédié.
- ✅ **Dames Chinoises** : Pas de score actif pendant la partie. Podium final (1er à Nème) avec saisie du nombre de billes restantes pour chaque perdant.

### Statistiques & Dashboard Unifié 📈
- ✅ **Dashboard 3 Panneaux** : Affichage simultané des statistiques des 3 jeux côte-à-côte sous un sélecteur global de rivalité.
- ✅ **Filtre de Rivalité intelligent** : Analyse des confrontations directes d'un groupe de joueurs réguliers avec répartition des médailles (Or, Argent, Bronze) et moyenne des billes restantes pour les Dames Chinoises.

## 🚀 Déploiement sur GitHub Pages

L'application a été configurée pour être entièrement compatible avec GitHub Pages :
- **Chemins relatifs :** Les liens vers `manifest.json`, `sw.js` et `icon.png` ont été passés en relatif pour fonctionner dans le sous-dossier `/Compteur-jeux/`.
- **Inhibition WebSocket :** La tentative de connexion WebSocket est désactivée automatiquement lorsque l'app tourne sur un domaine `github.io` pour éviter les boucles d'erreur de reconnexion en console.

### 1. Pousser les changements

```bash
git add .
git commit -m "Configure paths for GitHub Pages subfolder deployment"
git push origin main
```

### 2. Accès à l'application

L'app est servie automatiquement à : **https://epcrd63000.github.io/Compteur-jeux/**

## ⚙️ Configuration Supabase (Optionnel)

Pour activer la synchronisation en ligne et le partage des scores/rivalités entre vos appareils :

### 1. **Créer un projet Supabase**
- Allez sur [supabase.com](https://supabase.com) et créez un projet gratuit.

### 2. **Créer les tables**
Dans l'onglet **SQL Editor** de votre console Supabase, exécutez le script contenu dans le fichier [supabase-schema.sql](file:///c:/Users/epcrd/Documents/code/04_Archive/Compteur%20jeux/supabase-schema.sql). Ce script crée les tables suivantes :
- `active_games` (Parties actives de Scrabble et 10 000)
- `rivalries` (Groupes de rivalité sauvegardés)
- `games_history` (Historique des résultats de parties)

### 3. **Récupérer les identifiants**
- **URL Supabase** : Settings → API → Project URL (ex: `https://umfsneguvtxzxdlczeky.supabase.co`)
- **Clé publique anon** : Settings → API → `anon` public key

### 4. **Configurer dans l'application**
- Cliquez sur l'icône **Nuage** (grise par défaut) dans le menu principal ou dans l'en-tête de votre jeu.
- Collez votre **URL Supabase** et votre **Clé Publique Anon** dans les champs prévus.
- Cliquez sur **Enregistrer**. L'icône du nuage passera au vert, confirmant que la synchronisation est active !

Vos identifiants seront stockés de manière sécurisée dans le stockage local du navigateur de votre appareil. Pour synchroniser un autre appareil (comme votre téléphone), ouvrez l'application dessus et effectuez la même manipulation.

## 🎯 Utilisation

### Ajouter des points
- Cliquez **+50** ou **+100**
- Ou dictez un nombre au micro

### Éditer le score
- Cliquez directement sur le nombre pour éditer manuellement

### Réinitialiser la config Supabase
- Double-cliquez sur l'indicateur de statut (en haut à droite)

## 🛠️ Développement local

```bash
# Simplement ouvrez le fichier
open index.html

# Ou servez avec un serveur local
python -m http.server 8000
# Puis allez à http://localhost:8000
```

## 📋 Prérequis

- Navigateur moderne avec support :
  - Web Speech API (pour le micro)
  - localStorage
  - Supabase JS v2 (CDN)

## 📱 Navigateurs supportés

| Navigateur | Support |
|-----------|---------|
| Chrome/Edge | ✅ Complet |
| Firefox | ✅ Complet |
| Safari | ✅ (iOS 14.5+) |
| Opera | ✅ Complet |

## 📝 Structure des fichiers

```
Compteur-jeux/
├── index.html          # App principale (tout-en-un)
├── README.md          # Documentation
└── .git/              # Repo Git
```

## 🔧 Troubleshooting

### "Micro non supporté"
- Utilisez un navigateur moderne (Chrome, Firefox, Safari)
- La Web Speech API n'est pas supportée sur tous les appareils

### "Erreur de connexion Supabase"
- Vérifiez que l'URL et la clé sont correctes
- Assurez-vous que la table `scores` existe
- Vérifiez les Row Level Security policies

### Les données ne se synchronisent pas
- Vérifiez votre connexion internet
- Vérifiez le statut à droite (doit afficher "En ligne")
- Ouvrez la console du navigateur (F12) pour les erreurs

## 📄 Licence

MIT - Libre d'utilisation

## 👤 Auteur

[epcrd63000](https://github.com/epcrd63000)
