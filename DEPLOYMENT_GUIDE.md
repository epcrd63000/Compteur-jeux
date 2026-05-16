# Guide de déploiement complet - Compteur de Points Multi-Jeux

## 🎯 Objectif
Déployer l'application sur GitHub Pages (frontend) avec Supabase (backend)

---

## 📋 Informations de votre projet Supabase

```
Project URL: https://zfsmszjrybpqnqbvkaeb.supabase.co
Project Ref: zfsmszjrybpqnqbvkaeb
API Key (Public): sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ
DB URL: postgresql://postgres:[PASSWORD]@db.zfsmszjrybpqnqbvkaeb.supabase.co:5432/postgres
GitHub Repo: https://github.com/epcrd63000/Compteur-jeux
```

---

## 🚀 Étape 1: Préparer votre environnement local

### 1.1 Installer Supabase CLI (sur Windows)

```powershell
# Avec Scoop
scoop install supabase

# OU avec npm/yarn
npm install -g supabase
```

Vérifier:
```powershell
supabase --version
```

### 1.2 Installer Git et configurer GitHub

```powershell
# Vérifier que Git est installé
git --version

# Configurer Git si nécessaire
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

---

## 🔑 Étape 2: Configurer Supabase

### 2.1 Se connecter à Supabase

```powershell
cd "c:\Users\epcrd\Documents\code\Compteur jeux"
supabase login
```

Cela ouvrira votre navigateur pour vous authentifier.

### 2.2 Lier le projet local à votre projet Supabase

```powershell
supabase link --project-ref zfsmszjrybpqnqbvkaeb
```

Entrez le mot de passe de votre base de données PostgreSQL quand demandé.

### 2.3 Initialiser le projet Supabase (optionnel si déjà fait)

```powershell
supabase init
```

Cela crée un dossier `supabase/` avec la structure des migrations.

---

## 📁 Étape 3: Configurer la base de données

### 3.1 Copier le schéma dans les migrations

```powershell
# Créer le dossier de migration s'il n'existe pas
mkdir -p supabase\migrations

# Copier le schéma dans une migration
Copy-Item database\schema.sql supabase\migrations\001_initial_schema.sql
```

### 3.2 Appliquer le schéma à Supabase

```powershell
# Créer une migration locale d'abord (optionnel)
supabase migration new init_schema

# Appliquer les migrations
supabase db push
```

**OU** directement via le Dashboard Supabase:
1. Aller à: https://app.supabase.com/project/zfsmszjrybpqnqbvkaeb/sql
2. Copier-coller tout le contenu de `database/schema.sql`
3. Cliquer "Run"

---

## 🔐 Étape 4: Mettre à jour les clés de configuration

### 4.1 Créer ou mettre à jour `js/config.js`

Remplacer avec vos vraies clés Supabase:

```javascript
const CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://zfsmszjrybpqnqbvkaeb.supabase.co',
  SUPABASE_KEY: 'sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ',
  
  // IndexedDB
  DB_NAME: 'CompteurJeux',
  DB_VERSION: 1,
  STORES: ['users', 'groups', 'games', 'score_events', 'sync_queue', 'session'],
  
  // Jeu
  GAME_DEFAULTS: {
    minPlayers: 2,
    maxPlayers: 8,
    victoryScore: 10000,
  },
  
  // UI
  UI: {
    swipeThreshold: 50,
    pauseDuration: 1000,
    toastDuration: 3000,
  },
  
  // Développement
  DEV_MODE: false,
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
};

// Ne pas modifier après cette ligne
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
```

---

## 📦 Étape 5: Créer un dépôt GitHub et déployer

### 5.1 Initialiser Git localement

```powershell
cd "c:\Users\epcrd\Documents\code\Compteur jeux"

# Initialiser le repo
git init

# Ajouter le remote GitHub
git remote add origin https://github.com/epcrd63000/Compteur-jeux.git

# Vérifier
git remote -v
```

### 5.2 Préparer les fichiers

```powershell
# Vérifier le .gitignore
# Doit contenir: node_modules/, .env, .env.local, supabase/.branches/

# Ajouter tous les fichiers
git add .

# Voir le statut
git status
```

### 5.3 Commit et push initial

```powershell
git commit -m "Initial commit: Compteur de Points Multi-Jeux V4"

git branch -M main

git push -u origin main
```

---

## 🌐 Étape 6: Configurer GitHub Pages

### 6.1 Aller aux paramètres du repo

1. GitHub → `epcrd63000/Compteur-jeux` → Settings
2. Gauche: Sélectionner "Pages"

### 6.2 Activer GitHub Pages

**Source:** Deploy from a branch
**Branch:** `main`
**Folder:** `/ (root)`

### 6.3 Vérifier la publication

Après ~1-2 minutes, vous verrez:
```
Your site is live at: https://epcrd63000.github.io/Compteur-jeux
```

---

## ✅ Étape 7: Vérifier et tester

### 7.1 Tester l'application

1. Ouvrir: https://epcrd63000.github.io/Compteur-jeux
2. L'application doit charger

### 7.2 Vérifier la connexion Supabase

Dans la console du navigateur (F12):
```javascript
// Vérifier que Supabase est chargé
console.log(supabaseClient);
```

### 7.3 Tester le Service Worker

1. DevTools → Application → Service Workers
2. Vérifier que le Service Worker est "activated"

### 7.4 Tester l'authentification

1. Cliquer "Créer un compte"
2. Créer un compte test
3. Vérifier que c'est enregistré dans Supabase → Authentication

### 7.5 Tester la base de données

1. Supabase Dashboard → Table Editor
2. Vous devez voir les tables: `users`, `groups`, `games`, etc.

### 7.6 Tester le mode Offline

1. DevTools → Network → Offline
2. L'app doit continuer à fonctionner
3. Données stockées dans IndexedDB

---

## 🔧 Configuration avancée

### Auto-déploiement avec GitHub Actions (Optionnel)

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: echo "Deploying application..."
```

### Mettre à jour la branche "pages" (si besoin)

```powershell
# Créer une branche spéciale pour GitHub Pages
git checkout --orphan gh-pages
git rm -rf .
git commit --allow-empty -m "Initial gh-pages commit"
git push -u origin gh-pages
```

---

## 🐛 Dépannage

### Problème: CORS errors avec Supabase

**Solution:** Aller à Supabase Dashboard → API Settings → CORS
Ajouter: `https://epcrd63000.github.io`

### Problème: Service Worker ne se charge pas

**Solution:** 
- Vérifier HTTPS (GitHub Pages = HTTPS ✓)
- Vérifier que `sw.js` est à la racine
- DevTools → Application → Unregister et rafraîchir

### Problème: Authentification ne fonctionne pas

**Solution:**
1. Vérifier les clés dans `js/config.js`
2. Vérifier que Supabase Auth est activé
3. Vérifier les logs: DevTools → Console

### Problème: Données ne se synchronisent pas

**Solution:**
1. Vérifier la connexion Internet
2. Vérifier le projet Supabase est actif
3. Vérifier les RLS policies (Supabase → SQL Editor)

---

## 📚 Ressources

- **Supabase CLI:** https://supabase.com/docs/guides/cli
- **GitHub Pages:** https://docs.github.com/en/pages
- **PWA:** https://web.dev/progressive-web-apps/
- **Service Workers:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

## ✅ Checklist de déploiement

- [ ] Supabase CLI installé
- [ ] Authentifié sur Supabase (`supabase login`)
- [ ] Projet lié (`supabase link`)
- [ ] Base de données configurée (schema.sql appliqué)
- [ ] Clés de config mises à jour dans `js/config.js`
- [ ] Git initialisé
- [ ] GitHub repo créé et remote ajouté
- [ ] Premiers fichiers poussés (`git push`)
- [ ] GitHub Pages activé
- [ ] Application accessible au public
- [ ] Authentification testée
- [ ] Offline mode testé
- [ ] Service Worker actif

---

## 🎉 Succès!

Une fois tous les tests passés, votre application est **live et prête** pour les utilisateurs! 🚀

```
Application: https://epcrd63000.github.io/Compteur-jeux
Backend: https://zfsmszjrybpqnqbvkaeb.supabase.co
Repo: https://github.com/epcrd63000/Compteur-jeux
```
