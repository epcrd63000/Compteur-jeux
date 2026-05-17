# Compteur 10 000 🎮

Une app web progressive pour compter jusqu'à 10 000 avec support vocal, synchronisation Supabase et stockage local.

**Live Demo:** [https://epcrd63000.github.io/Compteur-jeux/](https://epcrd63000.github.io/Compteur-jeux/)

## ✨ Fonctionnalités

- 🎯 **Compteur intuitif** - Deux boutons (+50, +100) et édition directe du score
- 🎤 **Reconnaissance vocale** - Dictez vos points en français
- ☁️ **Synchronisation Supabase** - Sauvegarde et partage du score
- 💾 **Mode offline** - Stockage local localStorage
- 📱 **Responsive Design** - Optimisé pour mobile et desktop
- 🎨 **Design moderne** - Dark mode avec Tailwind CSS et animations fluides
- 📊 **Barre de progression** - Suivez votre avancement vers 10 000

## 🚀 Déploiement sur GitHub Pages

### 1. **Configuration initiale (si pas encore fait)**

```bash
# Clone le repo
git clone https://github.com/epcrd63000/Compteur-jeux.git
cd Compteur-jeux

# Vérifiez qu'on est sur la branche main
git branch -a
```

### 2. **Préparer le déploiement**

L'app est déjà prête pour GitHub Pages. Le fichier `index.html` à la racine sera automatiquement servi.

### 3. **Configurer GitHub Pages**

1. Allez sur [https://github.com/epcrd63000/Compteur-jeux/settings](https://github.com/epcrd63000/Compteur-jeux/settings)
2. Naviguer dans **Pages** (colonne de gauche)
3. Sous **Source**, sélectionnez:
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Cliquez **Save**

### 4. **Pousser vos changements**

```bash
# Stage et commit
git add .
git commit -m "Initial app setup for GitHub Pages"

# Push vers GitHub
git push origin main
```

L'app sera disponible à : `https://epcrd63000.github.io/Compteur-jeux/`

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
