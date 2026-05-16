# Structure du projet Compteur de Points Multi-Jeux

```
Compteur-jeux/
│
├── index.html                          # Page HTML principale
├── manifest.json                       # Configuration PWA
├── sw.js                              # Service Worker
├── .gitignore                         # Git ignore
│
├── css/
│   ├── styles.css                     # Styles principaux (responsive)
│   └── animations.css                 # Animations et effets spécialisés
│
├── js/
│   ├── config.js                      # Configuration globale
│   ├── main.js                        # Point d'entrée de l'app
│   │
│   ├── vendor/
│   │   └── idb.js                     # Wrapper IndexedDB (Promesses)
│   │
│   ├── db/
│   │   └── indexeddb.js               # Gestionnaire IndexedDB
│   │
│   ├── api/
│   │   └── supabase.js                # Client Supabase
│   │
│   ├── nlp/
│   │   ├── french-number-parser.js    # Parser nombres français
│   │   └── speech-recognition.js      # Web Speech API
│   │
│   ├── gestures/
│   │   └── swipe-detector.js          # Détecteur de gestes
│   │
│   ├── modules/
│   │   ├── engine.js                  # Moteur de jeu principal
│   │   └── game-10000.js              # Module spécifique Le 10 000
│   │
│   ├── ui/
│   │   ├── responsive.js              # Gestion responsive
│   │   └── ui-manager.js              # Gestionnaire UI
│   │
│   └── sync/
│       └── realtime-sync.js           # Synchronisation Realtime
│
├── database/
│   └── schema.sql                     # Schéma PostgreSQL pour Supabase
│
├── README.md                          # Guide d'utilisation principal
├── SUPABASE_CONFIG.md                 # Configuration Supabase
├── GITHUB_PAGES_DEPLOYMENT.md         # Déploiement sur GitHub Pages
├── API_DOCUMENTATION.md               # Documentation des API internes
└── PROJECT_STRUCTURE.md               # Ce fichier
```

## Architecture en couches

```
┌──────────────────────────────────────┐
│         Interface Utilisateur         │
│    (HTML/CSS/Responsive Design)      │
└────────────┬─────────────────────────┘
             │
┌────────────▼──────────────────────────┐
│        Couche de présentation        │
│    UIManager, ResponsiveUI           │
└────────────┬──────────────────────────┘
             │
┌────────────▼──────────────────────────┐
│        Couche métier                 │
│    GameEngine, Module10000           │
│    SpeechRecognition, SwipeDetector  │
└────────────┬──────────────────────────┘
             │
┌────────────▼──────────────────────────┐
│        Couche d'accès aux données     │
│    IndexedDBManager, SupabaseClient  │
│    RealtimeSyncManager               │
└────────────┬──────────────────────────┘
             │
┌────────────▼──────────────────────────┐
│        Couche stockage                │
│    IndexedDB (local)                 │
│    PostgreSQL Supabase (cloud)       │
│    Service Worker (cache)            │
└──────────────────────────────────────┘
```

## Flux de données

```
Utilisateur
    ↓
UIManager (écrans, dialogues)
    ↓
GameEngine (logique)
    ↓
┌─────────────┬─────────────┐
│             │             │
IndexedDB    Supabase      Service Worker
(local)      (cloud)       (cache/sync)
    │             │              │
    └─────────────┴──────────────┘
            ↓
    RealtimeSync
(synchronisation temps réel)
```

## Cycle de vie d'une partie

```
1. Authentification
   signUp/signIn → Supabase Auth → JWT Token

2. Création du groupe
   newGroup → IndexedDB → Supabase (sync)

3. Ajout des joueurs
   addPlayers → IndexedDB → Supabase (sync)

4. Démarrage de la partie
   startGame → GameEngine.initializeGame()
           → Module10000.initializeUI()
           → RealtimeSyncManager.init()

5. Saisie des scores
   userInput (bouton/voix/swipe)
       ↓
   GameEngine.addScore()
       ↓ (optimistic update)
   IndexedDB (local save)
       ↓ (background sync)
   Supabase (cloud)
       ↓ (if online)
   RealtimeSync (broadcast autres appareils)

6. Fin de la partie
   victoryScore atteint
       ↓
   GameEngine.endGame()
       ↓
   UI affiche victoire
```

## Points clés de l'architecture

### 1. Offline-First
- IndexedDB: source de vérité locale
- Service Worker: cache + sync
- Background Sync: envoie les données quand retour online

### 2. Résilience réseau
- Requêtes optimistes (UI mise à jour immédiatement)
- File d'attente de synchronisation
- Révision si la sync échoue

### 3. Multi-joueurs temps réel
- Supabase Realtime WebSockets
- Broadcast events
- Presence tracking

### 4. Modularité
- GameEngine: générique
- Modules de jeu: extensibles
- API standardisée entre modules

### 5. Responsive Design
- Mobile-First CSS
- Media queries pour orientation
- Pas de framework, CSS pur

## Technologies utilisées

### Frontend
- **HTML5** avec meta viewport et charset UTF-8
- **CSS3** avec Flexbox, Grid, Media Queries
- **Vanilla JavaScript** (ES6+)
- **Web APIs**: IndexedDB, Service Worker, Web Speech API, Touch Events

### Backend
- **Supabase**: PostgreSQL + Auth + REST API
- **PostgreSQL**: RLS (Row Level Security)

### Storage
- **IndexedDB**: Base de données locale
- **ServiceWorker Cache API**: Caching d'assets
- **LocalStorage**: Sessions de base (optionnel)

### Communication
- **REST API** via Supabase PostgREST
- **WebSockets** via Supabase Realtime
- **Background Sync API**: Sync en arrière-plan

## Performance

- Temps de chargement initial: <2s (cached après)
- Offline-first: accès immédiat
- Pas de dépendances externes lourdes
- Service Worker: cache-first pour assets

## Sécurité

- **JWT tokens**: Gestion par Supabase Auth
- **RLS**: Row Level Security au niveau DB
- **HTTPS**: Obligatoire
- **No secrets**: Clés publiques seulement

## Testing

Pour tester l'application:

```bash
# Serveur local
python -m http.server 8000

# Ouvrir dans le navigateur
http://localhost:8000

# Devtools
- Application > Service Workers (voir registration)
- Application > Storage > IndexedDB (voir DB)
- Network (voir requêtes)
- Console (voir logs)
```

## Scalabilité

### Futur
- [ ] Module Scrabble
- [ ] Statistics et analytics
- [ ] Historique des parties
- [ ] Classements
- [ ] Modes multijoueur avancés
- [ ] Themes personnalisés

### Limites actuelles
- Max ~100 joueurs par groupe (confortable)
- Max ~1000 événements de score par partie (performance OK)
- Bande passante: plan Supabase gratuit
- Stockage: plan Supabase gratuit

## Maintenance

### Logs et monitoring
- Console du navigateur: logs détaillés
- Supabase Dashboard: requêtes API
- Service Worker: logs spécifiques

### Debugging
- `CONFIG.DEBUG = true` pour verbose logging
- IndexedDB: `chrome://inspect/#resources`
- Service Worker: `chrome://serviceworker-internals/`

### Mises à jour
- Changements CSS: immediate (Service Worker revalidate)
- Changements JS: rechargement pour appliquer
- Changements DB: migration via Supabase CLI

## Documentation complémentaire

- **README.md**: Guide d'utilisation utilisateur
- **API_DOCUMENTATION.md**: Référence API interne complète
- **SUPABASE_CONFIG.md**: Configuration du backend
- **GITHUB_PAGES_DEPLOYMENT.md**: Déploiement sur GitHub Pages

## Ressources externes

- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Supabase Docs](https://supabase.com/docs)
- [PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

**Version**: 4.0.0  
**Dernière mise à jour**: 2026  
**Statut**: Production Ready ✅
