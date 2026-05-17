# Compteur de Points - Multi-Jeux 🎮

Application web progressive pour le comptage multi-joueurs temps réel, avec support pour "Le 10 000" et architecture modulaire pour d'autres jeux.

**Live Demo:** [https://epcrd63000.github.io/Compteur-jeux/](https://epcrd63000.github.io/Compteur-jeux/)

## ✨ Fonctionnalités principales

### Multi-Joueurs & Groupes 👥
- ✅ **Créer ou rejoindre des groupes** - Code d'invitation unique
- ✅ **Gestion multi-joueurs** - Jusqu'à 10 joueurs par partie
- ✅ **Pseudo et couleurs personnalisés** - Support UTF-8 (Hébreu, accents, etc.)
- ✅ **Gestion automatique des tours** - Passage au joueur suivant après scoring

### Gameplay 🎲
- ✅ **Boutons rapides** - +100, +150, +200, +300 points
- ✅ **Reconnaissance vocale** - Dictez les points en français ("cent cinquante")
- ✅ **Édition flexible** - Undo, modification manuelle des scores
- ✅ **Historique détaillé** - Trace de tous les scores par tour
- ✅ **Détection de victoire** - Animation automatique à 10 000 points

### Technologie 🔧
- ✅ **Mode offline-first** - Fonctionne sans Internet (localStorage)
- ✅ **Temps réel** - Supabase Realtime pour synchronisation multi-appareils
- ✅ **Responsive 100% Mobile First** - Portrait et Paysage
- ✅ **Design moderne** - Tailwind CSS + animations fluides
- ✅ **Architecture modulaire** - Moteur extensible pour nouveaux jeux

## 🚀 Déploiement sur GitHub Pages

### 1. Vérifier le statut

```bash
git status
```

### 2. Pousser les changements

```bash
git add .
git commit -m "V4: Multi-joueurs temps réel avec architecture modulaire"
git push origin main
```

### 3. GitHub Pages est déjà configuré ✅

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
