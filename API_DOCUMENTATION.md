# Documentation des API Internes

## Table des matières

1. [GameEngine](#gameengine)
2. [SupabaseClient](#supabaseclient)
3. [IndexedDBManager](#indexeddbmanager)
4. [FrenchNumberParser](#frenchnumberparser)
5. [SpeechRecognitionManager](#speechrecognitionmanager)
6. [SwipeDetector](#swipedetector)
7. [Game10000](#game10000)

---

## GameEngine

Moteur principal du jeu. Gère l'état global, les tours des joueurs, et la logique de base.

### Propriétés

```javascript
gameEngine.currentGame      // Objet de la partie actuelle
gameEngine.players          // Array de joueurs
gameEngine.currentPlayerIndex // Index du joueur actif
gameEngine.gameModule       // Module de jeu actuellement chargé
gameEngine.isGameActive     // Boolean: partie en cours?
```

### Méthodes

```javascript
// Initialiser une nouvelle partie
await gameEngine.initializeGame(gameData, players, moduleType)

// Ajouter un score
await gameEngine.addScore(points: number) -> boolean

// Annuler le dernier coup
await gameEngine.undoLastMove() -> boolean

// Passer au joueur suivant
await gameEngine.advanceToNextPlayer() -> boolean

// Passer son tour avec 0 point
await gameEngine.passWithZero() -> boolean

// Éditer le score du joueur actif
await gameEngine.editScore(newTotal: number) -> boolean

// Obtenir le joueur actif
gameEngine.getCurrentPlayer() -> Player

// Obtenir tous les joueurs
gameEngine.getPlayers() -> Player[]

// Terminer la partie
await gameEngine.endGame()

// S'enregistrer pour les événements
gameEngine.on(eventType: string, callback: Function)
```

### Événements

```javascript
gameEngine.on('game-initialized', () => {})
gameEngine.on('score-added', (data) => {})
gameEngine.on('player-changed', (data) => {})
gameEngine.on('move-undone', (data) => {})
gameEngine.on('score-edited', (data) => {})
gameEngine.on('game-ended', () => {})
```

### Exemple d'utilisation

```javascript
// Initialiser un jeu
const gameData = { id: 'uuid', group_id: 'uuid', module_type: '10000', status: 'active' };
const players = [
  { id: 'uuid1', pseudo: 'Alice', color: '#3498db' },
  { id: 'uuid2', pseudo: 'Bob', color: '#e74c3c' }
];
await gameEngine.initializeGame(gameData, players, '10000');

// Écouter les changements
gameEngine.on('player-changed', (data) => {
  console.log('Nouveau joueur:', data.currentPlayer.pseudo);
});

// Ajouter un score
await gameEngine.addScore(100);
```

---

## SupabaseClient

Client pour communiquer avec l'API REST de Supabase.

### Propriétés

```javascript
supabaseClient.baseUrl     // URL de base Supabase
supabaseClient.apiKey      // Clé API publique
supabaseClient.auth        // Session actuelle (JWT)
supabaseClient.isConnected // Boolean: connecté?
```

### Méthodes d'authentification

```javascript
// Inscription
await supabaseClient.signUp(email: string, password: string)
// Retour: { user: Object, session: Object }

// Connexion
await supabaseClient.signIn(email: string, password: string)
// Retour: { access_token, refresh_token, ... }

// Obtenir l'utilisateur actuel
await supabaseClient.getCurrentUser() -> User | null

// Déconnexion
await supabaseClient.signOut()
```

### Méthodes CRUD

```javascript
// Insérer
await supabaseClient.insert(table: string, data: Object)

// Mettre à jour
await supabaseClient.update(table: string, data: Object, filter: Object)

// Lire
await supabaseClient.select(table: string, filters: Object) -> Array

// Supprimer
await supabaseClient.delete(table: string, filter: Object)
```

### Réaltime

```javascript
// S'abonner aux changements
const unsubscribe = supabaseClient.subscribe(table, eventType, callback)

// Émettre un événement Broadcast
supabaseClient.broadcastEvent(channel, event, data)
```

### Exemple d'utilisation

```javascript
// S'inscrire
await supabaseClient.signUp('user@example.com', 'password');

// Lire des utilisateurs
const users = await supabaseClient.select('users', {});

// Insérer un score
await supabaseClient.insert('score_events', {
  game_id: 'uuid',
  user_id: 'uuid',
  points: 100
});

// S'abonner aux changements
const unsubscribe = supabaseClient.subscribe('score_events', 'INSERT', (event) => {
  console.log('Nouveau score:', event.payload);
});
```

---

## IndexedDBManager

Gestionnaire de la base de données locale IndexedDB.

### Méthodes

```javascript
// Initialiser
await indexedDBManager.init()

// Utilisateurs
await indexedDBManager.getUser(userId: string)
await indexedDBManager.saveUser(user: Object)
await indexedDBManager.getAllUsers() -> Array

// Groupes
await indexedDBManager.getGroup(groupId: string)
await indexedDBManager.saveGroup(group: Object)
await indexedDBManager.getAllGroups() -> Array

// Membre de groupe
await indexedDBManager.getGroupMembers(groupId: string)
await indexedDBManager.addGroupMember(groupId, userId)

// Parties
await indexedDBManager.getGame(gameId: string)
await indexedDBManager.saveGame(game: Object)
await indexedDBManager.getGamesByGroup(groupId) -> Array

// Événements de score
await indexedDBManager.getScoreEvent(eventId: string)
await indexedDBManager.saveScoreEvent(event: Object)
await indexedDBManager.getScoreEventsByGame(gameId) -> Array
await indexedDBManager.getUserScoreEvents(gameId, userId) -> Array

// File d'attente de sync
await indexedDBManager.queueScoreForSync(scoreEvent: Object)
await indexedDBManager.getSyncQueue() -> Array
await indexedDBManager.removeFromSyncQueue(scoreId: string)
await indexedDBManager.clearSyncQueue()

// Authentification
await indexedDBManager.saveSession(session: Object)
await indexedDBManager.getSession() -> Session | null
await indexedDBManager.deleteSession()

// Maintenance
await indexedDBManager.clear()
```

---

## FrenchNumberParser

Parser pour convertir les nombres français (texte) en entiers.

### Méthodes

```javascript
// Parser un nombre français
frenchNumberParser.parse(text: string) -> number | null

// Vérifier si une chaîne est un nombre français
frenchNumberParser.isNumericText(text: string) -> boolean
```

### Exemples d'entrées

```javascript
frenchNumberParser.parse("cent") // 100
frenchNumberParser.parse("cent cinquante") // 150
frenchNumberParser.parse("trois cent quarante") // 340
frenchNumberParser.parse("mille deux cent trente-quatre") // 1234
frenchNumberParser.parse("quatre-vingt-dix-neuf") // 99
frenchNumberParser.parse("zéro") // 0
```

---

## SpeechRecognitionManager

Gestionnaire de reconnaissance vocale via Web Speech API.

### Propriétés

```javascript
speechRecognitionManager.isListening  // Boolean: en écoute?
speechRecognitionManager.recognition  // Objet SpeechRecognition
```

### Méthodes

```javascript
// Démarrer l'écoute
speechRecognitionManager.start() -> boolean

// Arrêter l'écoute
speechRecognitionManager.stop() -> boolean

// Abandonner complètement
speechRecognitionManager.abort()

// Vérifier le support
speechRecognitionManager.isSupported() -> boolean

// Obtenir la langue
speechRecognitionManager.getLanguage() -> string

// Définir la langue
speechRecognitionManager.setLanguage(lang: string)

// S'enregistrer pour les événements
speechRecognitionManager.on(eventType: string, callback: Function)
```

### Événements

```javascript
speechRecognitionManager.on('onStart', () => {})
speechRecognitionManager.on('onEnd', () => {})
speechRecognitionManager.on('onResult', (data) => {})
speechRecognitionManager.on('onError', (data) => {})
speechRecognitionManager.on('onInterimResult', (data) => {})
```

### Exemple d'utilisation

```javascript
// Vérifier le support
if (speechRecognitionManager.isSupported()) {
  speechRecognitionManager.on('onResult', (data) => {
    const points = frenchNumberParser.parse(data.transcript);
    if (points !== null) {
      gameEngine.addScore(points);
    }
  });

  speechRecognitionManager.start();
}
```

---

## SwipeDetector

Détecteur de gestes tactiles (swipe).

### Constructeur

```javascript
const swipeDetector = new SwipeDetector(element: HTMLElement)
```

### Méthodes

```javascript
// S'enregistrer pour un événement de swipe
swipeDetector.on(eventType: string, callback: Function)

// Se désinscrire
swipeDetector.off(eventType: string, callback: Function)
```

### Événements

```javascript
swipeDetector.on('swiped-left', () => {})
swipeDetector.on('swiped-right', () => {})
swipeDetector.on('swiped-up', () => {})
swipeDetector.on('swiped-down', () => {})
```

### Exemple d'utilisation

```javascript
const zone = document.getElementById('active-player-zone');
const detector = new SwipeDetector(zone);

detector.on('swiped-left', () => {
  console.log('Swipe vers la gauche');
  gameEngine.passWithZero();
});
```

---

## Game10000

Module spécifique pour le jeu "Le 10 000".

### Propriétés

```javascript
game10000.engine        // Référence au GameEngine
game10000.config        // Configuration du jeu
game10000.isWon         // Boolean: partie gagnée?
```

### Méthodes

```javascript
// Obtenir l'HTML des contrôles
game10000.renderControls() -> string

// Évaluer l'état du jeu
game10000.evaluateState(eventHistory: Array) -> Object

// Obtenir le dictionnaire de mots pour la voix
game10000.getVoiceDictionary() -> Array

// Initialiser l'interface du jeu
await game10000.initializeUI()
```

### Configuration

```javascript
CONFIG.GAME_DEFAULTS['10000'] = {
  name: 'Le 10 000',
  victoryScore: 10000,
  quickButtons: [100, 150, 200, 300],
  allowZeroTurn: true
}
```

---

## Flux complet d'exemple

```javascript
// 1. Utilisateur se connecte
await supabaseClient.signUp('player@example.com', 'password');

// 2. Créer un groupe et ajouter des joueurs
const group = { id: 'uuid', name: 'Ma famille' };
await indexedDBManager.saveGroup(group);

const players = [
  { id: 'uuid1', pseudo: 'Alice' },
  { id: 'uuid2', pseudo: 'Bob' }
];
for (const player of players) {
  await indexedDBManager.saveUser(player);
  await indexedDBManager.addGroupMember(group.id, player.id);
}

// 3. Démarrer une partie
const gameData = { id: 'uuid', group_id: group.id, module_type: '10000' };
await gameEngine.initializeGame(gameData, players, '10000');

// 4. Initialiser l'UI du module
await gameEngine.gameModule.initializeUI();

// 5. Écouter les changements
gameEngine.on('player-changed', (data) => {
  console.log('C\'est au tour de:', data.currentPlayer.pseudo);
});

// 6. Ajouter des scores
await gameEngine.addScore(100);  // Via bouton
await gameEngine.addScore(150);  // Via bouton

// 7. Utiliser la voix
speechRecognitionManager.on('onResult', (data) => {
  const points = frenchNumberParser.parse(data.transcript);
  if (points) await gameEngine.addScore(points);
});

// 8. Passer le tour avec swipe
globalSwipeDetector.on('swiped-left', async () => {
  await gameEngine.passWithZero();
});

// 9. Synchroniser avec Supabase
realtimeSyncManager.init(gameData.id);
```

---

## Constantes globales (CONFIG)

```javascript
CONFIG.SUPABASE_URL
CONFIG.SUPABASE_KEY
CONFIG.DB_NAME
CONFIG.STORES  // Noms des object stores IndexedDB
CONFIG.GAME_DEFAULTS  // Configurations des jeux
CONFIG.UI.turnPauseDuration  // Pause avant changement de joueur
CONFIG.UI.swipeThreshold  // Distance minimum pour détecter un swipe
CONFIG.DEBUG  // Mode debug
```

---

## Gestion des erreurs

Tous les managers gèrent les erreurs de manière gracieuse:

```javascript
try {
  await gameEngine.addScore(100);
} catch (error) {
  console.error('Erreur:', error);
  uiManager.showNotification('Erreur lors de l\'ajout du score');
}
```

---

## Performance

- **IndexedDB**: Asynchrone, ne bloque pas l'UI
- **Service Worker**: Fonctionne en arrière-plan
- **Supabase API**: Cache et revalidate
- **UI**: Mise à jour optimiste + réconciliation

---

## Debugging

```javascript
// Activer le logging
CONFIG.DEBUG = true;

// Inspecter IndexedDB
await indexedDBManager.getAllUsers();
await indexedDBManager.getSyncQueue();

// Inspecter les scores
await indexedDBManager.getScoreEventsByGame(gameId);

// Vider les données
await indexedDBManager.clear();

// Logs du Service Worker
// Ouvrir DevTools > Application > Service Workers
```
