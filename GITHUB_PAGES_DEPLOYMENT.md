# Guide de déploiement sur GitHub Pages

## Prérequis

- Compte GitHub
- Git installé localement
- Repo GitHub créé

## Étapes de déploiement

### 1. Préparation du repo

```bash
# Cloner votre repo
git clone https://github.com/YOUR_USERNAME/Compteur-jeux
cd Compteur-jeux

# Copier les fichiers du projet
cp -r /chemin/vers/le/projet/* .

# Ajouter et commiter
git add .
git commit -m "Initial commit: Compteur de Points V4"
git push -u origin main
```

### 2. Activer GitHub Pages

1. Aller sur **GitHub** > **Your Repo** > **Settings**
2. Aller à **Pages** dans le menu de gauche
3. Sous **Build and deployment**:
   - **Source**: Sélectionner "Deploy from a branch"
   - **Branch**: Sélectionner `main` et `/root`
4. Attendre quelques minutes

Votre site sera accessible à:
```
https://YOUR_USERNAME.github.io/Compteur-jeux/
```

### 3. Configurer le chemin de base

Le site est hébergé à `/Compteur-jeux/` (et non à la racine).

**Fichiers à mettre à jour:**

1. **manifest.json**:
   ```json
   {
     "start_url": "/Compteur-jeux/",
     "scope": "/Compteur-jeux/",
     ...
   }
   ```

2. **js/config.js**:
   ```javascript
   const BASE_PATH = '/Compteur-jeux/';  // À ajouter si nécessaire
   ```

3. **sw.js** (Service Worker):
   - Remplacer les chemins relatifs par des chemins absolus
   - Exemple: `/` devient `/Compteur-jeux/`

### 4. Tester l'application

1. Ouvrir `https://YOUR_USERNAME.github.io/Compteur-jeux/`
2. Vérifier que:
   - La page se charge correctement
   - Les styles CSS sont appliqués
   - Les scripts JavaScript s'exécutent
   - Le Service Worker s'enregistre

### 5. Résoudre les problèmes courants

#### Problème: Pages vierges ou CSS/JS non chargés

**Solution**: Vérifier les chemins relatifs
- Les fichiers doivent être accessibles depuis `/Compteur-jeux/`
- Utiliser des chemins absolus: `/Compteur-jeux/js/config.js`

#### Problème: Service Worker ne s'enregistre pas

**Erreur console**: "Failed to register service worker"

**Solutions**:
1. Vérifier que le fichier `sw.js` est à la racine
2. Vérifier la console du navigateur pour les erreurs
3. GitHub Pages force le HTTPS - assurez-vous d'utiliser `https://`

#### Problème: Supabase ne répond pas

**Solutions**:
1. Vérifier les clés API dans `js/config.js`
2. Activer le CORS dans Supabase: **Settings** > **API**
3. Ajouter `https://YOUR_USERNAME.github.io` aux URLs autorisées

### 6. Mise à jour continue

```bash
# Faire des modifications locales
# Tester localement avec un serveur

# Puis pusher vers GitHub
git add .
git commit -m "Update feature XYZ"
git push

# Le site se redéploie automatiquement en ~1-2 minutes
```

## Configuration recommandée

### Domaine personnalisé (optionnel)

1. Aller à **Settings** > **Pages**
2. Sous **Custom domain**, entrer votre domaine
3. Configurer les DNS records (voir les instructions GitHub)

### Certificat HTTPS

GitHub Pages fourni automatiquement un certificat SSL gratuit.

## Performance et cache

### Service Worker
- Le Service Worker cache les fichiers statiques
- Cache expirant automatiquement
- Offline-first par défaut

### CDN
- GitHub Pages utilise un CDN global
- Les fichiers sont cachés automatiquement

## Monitoring

### Vérifier le déploiement

1. Aller à **Actions** dans votre repo
2. Voir l'historique des déploiements
3. Vérifier les logs d'erreur

### Vérifier la performance

```bash
# Utiliser Lighthouse dans Chrome
# DevTools > Lighthouse > Generate Report

# Vérifier:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- PWA: Installable
```

## Sécurité

### CORS et Supabase

GitHub Pages serve depuis `https://YOUR_USERNAME.github.io`, il faut configurer CORS dans Supabase:

1. Aller à **Supabase** > **Settings** > **API**
2. Ajouter les URLs:
   ```
   https://YOUR_USERNAME.github.io
   https://YOUR_USERNAME.github.io/Compteur-jeux
   ```

### Secrets et clés API

- **Ne JAMAIS** commiter de `.env` avec des secrets
- Les clés API "Anon" sont publiques (par design)
- La sécurité réelle est gérée par RLS dans Supabase

## Troubleshooting

### Build fails

Vérifier les logs GitHub:
1. **Actions** > Dernière exécution
2. Voir les détails du workflow

### Site non disponible après 10 minutes

- Vérifier que `index.html` existe
- Vérifier que le repo est public
- Relancer le déploiement

### Assets 404

- Vérifier les chemins (sensibles à la casse sur Linux)
- Utiliser des chemins absolus avec `/Compteur-jeux/`

## Variables d'environnement pour le déploiement

**`.github/workflows/deploy.yml`** (optionnel):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          cname: votredomaine.com  # Si domaine personnalisé
```

## Support

- Docs GitHub Pages: https://docs.github.com/en/pages
- Docs Supabase: https://supabase.com/docs
- Issues: Vérifier les logs GitHub Actions
