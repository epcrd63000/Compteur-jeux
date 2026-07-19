# Compteur de Points - Multi-Jeux 🎮

Application web progressive pour le comptage multi-joueurs temps réel, avec support pour "Le 10 000" et architecture modulaire pour d'autres jeux.

**Live Demo:** [https://epcrd63000.github.io/Compteur-jeux/](https://epcrd63000.github.io/Compteur-jeux/)

## ✨ Fonctionnalités principales

### Multi-Joueurs & Groupes 👥
- ✅ **Gestion multi-joueurs** - Jusqu'à 10 joueurs par partie
- ✅ **Gestion automatique des tours** - Passage au joueur suivant après scoring
- ✅ **Réorganisation à la volée** - Ajustez l'ordre de passage des joueurs à tout moment à l'aide des boutons de déplacement (Haut/Bas)
- ✅ **Persistance automatique** - Sauvegarde instantanée de la partie en cours dans le stockage local du navigateur (`localStorage`)

### Gameplay & Suivi des scores 🎲
- ✅ **Boutons rapides** - Saisie en un clic (50, 100, 150... ou pavé numérique libre)
- ✅ **Reconnaissance vocale** - Saisie des points par dictée vocale en français
- ✅ **Historique par joueur (Long-clic)** - Maintenez le clic sur un joueur (ou utilisez le bouton dédié) pour afficher, modifier ou supprimer individuellement les points de chacun de ses tours
- ✅ **Statistiques & Rivalités** - Suivi historique des victoires par joueur et outil de confrontation Face-à-Face pour analyser le ratio de victoires entre deux rivaux

### Technologie 🔧
- ✅ **Mode offline-first robuste** - Le Service Worker met en cache l'ensemble des fichiers requis (y compris Tailwind et les icônes FontAwesome) pour un fonctionnement 100% autonome sans Internet
- ✅ **Synchronisation WebSocket** - Synchronisation automatique multi-écrans lors d'un lancement local via le serveur FastAPI (Python)

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

Pour activer la synchronisation du score en cloud :

### 1. **Créer un projet Supabase**
- Aller sur [supabase.com](https://supabase.com)
- Créer un nouveau projet

### 2. **Créer la table**
Dans l'éditeur SQL de Supabase, exécutez :

```sql
CREATE TABLE scores (
  id INT PRIMARY KEY,
  score INT4 NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Insérer un record par défaut
INSERT INTO scores (id, score) VALUES (1, 0);
```

### 3. **Configurer les politiques RLS (Row Level Security)**
Pour permettre l'accès anonyme (optionnel mais recommandé) :

```sql
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autoriser la lecture publique"
  ON scores FOR SELECT
  USING (true);

CREATE POLICY "Autoriser la modification publique"
  ON scores FOR UPDATE
  USING (true);
```

### 4. **Récupérer les identifiants**
- URL Supabase : Settings → API → Project URL
- Clé anonyme : Settings → API → `anon` public key

### 5. **Configurer dans l'app**
Au premier lancement, une modale s'affiche. Remplissez :
- **URL Supabase** : `https://xyzcompany.supabase.co`
- **Clé Anonyme** : votre clé publique

Les identifiants seront stockés dans `localStorage` de votre navigateur.

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
