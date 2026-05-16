# 📊 Compteur de Points Multi-Jeux (V4)

Application Progressive Web (PWA) pour compter les points de jeux de société en multijoueur temps réel.

## ✨ Caractéristiques

### Architecture
- **Backend**: Supabase (PostgreSQL) avec authentification JWT
- **Frontend**: PWA 100% client-side hébergée sur GitHub Pages
- **Offline-First**: IndexedDB + Service Worker + Background Sync API
- **Synchronisation Temps Réel**: WebSockets Supabase Realtime

### Fonctionnalités
- ✅ Multi-joueurs synchronisé en temps réel
- ✅ Fonctionne entièrement hors-ligne (Offline-First)
- ✅ Interface adaptive (Portrait/Paysage)
- ✅ Reconnaissance vocale française (Web Speech API)
- ✅ Détection de gestes (swipe pour passer le tour)
- ✅ Module "Le 10 000" complet
- ✅ Architecture modulaire pour futur Scrabble
- ✅ Synchronisation en arrière-plan (Background Sync)

## 🚀 Déploiement

### 1. Configuration Supabase

```bash
# Créer un compte sur https://supabase.com
# Créer un nouveau projet avec la région la plus proche

# Utiliser les références:
# Project URL: https://zfsmszjrybpqnqbvkaeb.supabase.co
# API Key: sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ
```

### 2. Initialiser le schéma PostgreSQL

```bash
# Dans la console SQL Supabase:
# 1. Copiez le contenu de database/schema.sql
# 2. Exécutez dans l'éditeur SQL de Supabase
# 3. Vérifiez que les tables sont créées

# Ou via CLI:
supabase init
supabase link --project-ref zfsmszjrybpqnqbvkaeb
supabase db push database/migrations
```

### 3. Configurer l'authentification Supabase

```
1. Aller à Authentication > Users
2. Activer "Email & Password" sous Providers
3. Configurer les URLs de redirect (si hébergé sur GitHub Pages)
```

### 4. Déployer sur GitHub Pages

```bash
# 1. Créer un fork ou un nouveau repo GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/Compteur-jeux
git push -u origin main

# 2. Aller à Settings > Pages
# 3. Sélectionner "main" comme branche source
# 4. Le site est accessible à: https://YOUR_USERNAME.github.io/Compteur-jeux/

# 5. Mettre à jour manifest.json et index.html avec le bon chemin
# Remplacer "/Compteur-jeux/" par votre chemin réel
```

## 📱 Utilisation

### Installation sur mobile

#### iOS
```
1. Ouvrir dans Safari
2. Appuyer sur "Partager"
3. Sélectionner "Sur l'écran d'accueil"
4. L'app apparaîtra comme une app native
```

#### Android
```
1. Ouvrir dans Chrome
2. Menu > "Installer l'app"
3. Confirmer l'installation
```

### Utilisation de base

1. **S'inscrire/Se connecter**
   - Créer un compte avec email/mot de passe

2. **Créer un groupe**
   - Ajouter les joueurs avec leurs noms et couleurs
   - Créer le groupe

3. **Démarrer une partie**
   - Sélectionner le module (Le 10 000)
   - Démarrer la partie

4. **Saisir les scores**
   - Boutons rapides (+100, +150, +200, +300)
   - Reconnaissance vocale (🎤)
   - Clavier numérique (✎ Éditer)
   - Swipe vers la gauche pour passer avec 0

## 🏗️ Architecture Technique

### Structure des fichiers

```
├── index.html                 # Page HTML principale
├── manifest.json             # Configuration PWA
├── sw.js                     # Service Worker
├── css/
│   └── styles.css            # Styles responsive
├── js/
│   ├── config.js             # Configuration globale
│   ├── vendor/
│   │   └── idb.js            # Wrapper IndexedDB
│   ├── db/
│   │   └── indexeddb.js      # Gestionnaire IndexedDB
│   ├── api/
│   │   └── supabase.js       # Client Supabase
│   ├── nlp/
│   │   ├── french-number-parser.js    # Parser nombres français
│   │   └── speech-recognition.js      # Web Speech API
│   ├── gestures/
│   │   └── swipe-detector.js # Détecteur de swipes
│   ├── modules/
│   │   ├── engine.js         # Moteur principal
│   │   └── game-10000.js     # Module Le 10 000
│   ├── ui/
│   │   ├── responsive.js     # Gestion responsive
│   │   └── ui-manager.js     # Gestionnaire UI
│   ├── sync/
│   │   └── realtime-sync.js  # Synchronisation Realtime
│   └── main.js              # Point d'entrée
└── database/
    └── schema.sql            # Schéma PostgreSQL
```

### Flux de données

```
┌─────────────────┐
│   Interface     │
│   (HTML/CSS)    │
└────────┬────────┘
         │
    ┌────▼────────────────────────────┐
    │   UIManager                      │
    │   - Gestion des écrans           │
    │   - Événements utilisateur       │
    └────┬─────────────────────────────┘
         │
    ┌────▼──────────────────────┐
    │   GameEngine              │
    │   - État du jeu           │
    │   - Logique des tours      │
    │   - Calcul des scores      │
    └────┬─────────────────────┬─┘
         │                     │
    ┌────▼─────────┐   ┌──────▼───────────┐
    │  IndexedDB   │   │  Supabase        │
    │  (Offline)   │   │  (Online)        │
    └──────────────┘   └──────────────────┘
         │                     │
    ┌────▼──────────────────────▼──┐
    │   RealtimeSync               │
    │   - WebSockets               │
    │   - Background Sync          │
    └──────────────────────────────┘
```

## 🔐 Sécurité

### Row Level Security (RLS)
- Les utilisateurs ne peuvent voir que leurs propres groupes
- Les scores ne peuvent être modifiés que par les membres du groupe
- Les parties sont isolées par groupe

### Authentification
- JWT tokens gérés par Supabase Auth
- Sessions stockées de manière sécurisée dans IndexedDB
- Déconnexion automatique après révocation du token

## 🚫 Limitations actuelles

- ❌ Scrabble non encore implémenté
- ❌ WebSockets Realtime simulés (API simulée)
- ❌ Sync offline en arrière-plan limité (Background Sync API non complètement supportée sur tous les navigateurs)

## 🔧 Développement local

### Serveur local

```bash
# Utiliser Python
python -m http.server 8000

# Ou utiliser Node.js
npx http-server

# Ou utiliser VS Code Live Server
```

### Debug

```javascript
// Activer le logging
CONFIG.DEBUG = true;

// Vider IndexedDB
await indexedDBManager.clear();

// Vider la file de sync
await indexedDBManager.clearSyncQueue();
```

## 📝 TODO

- [ ] Implémenter le module Scrabble
- [ ] Ajouter WebSockets Realtime complets
- [ ] Améliorer le support Background Sync
- [ ] Ajouter statistiques et historique
- [ ] Thème sombre complet
- [ ] Internationalisations (i18n)
- [ ] Tests unitaires et E2E
- [ ] Documentation API complète

## 📄 Licence

MIT - Libre d'utilisation

## 👥 Auteur

Développé avec ❤️ pour les amateurs de jeux de société

---

**Note**: Cette application est une démonstration technique d'une architecture PWA moderne avec offline-first et synchronisation temps réel.
