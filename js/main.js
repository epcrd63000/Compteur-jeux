/**
 * Main.js - Point d'entrée de l'application
 * Initialise tous les modules et configure l'application
 */

class Application {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialiser l'application
     */
    async init() {
        try {
            console.log('[App] Initializing...');

            // Attendre le chargement du DOM
            if (document.readyState === 'loading') {
                return;
            }

            // 1. Initialiser IndexedDB
            console.log('[App] Initializing IndexedDB...');
            await indexedDBManager.init();

            // 2. Initialiser le client Supabase
            console.log('[App] Initializing Supabase...');
            await supabaseClient.init();

            // 3. Vérifier la session existante
            const session = await indexedDBManager.getSession();
            if (session && session.access_token) {
                console.log('[App] Existing session found');
                uiManager.showScreen('game');
                await uiManager.initializeGameScreen();
            } else {
                console.log('[App] No session, showing auth screen');
                uiManager.showScreen('auth');
            }

            // 4. Configurer les écouteurs de jeu
            this._setupGameListeners();

            // 5. Enregistrer le Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => {
                        console.log('[App] Service Worker registered');
                        this._setupServiceWorkerUpdates(reg);
                    })
                    .catch(err => console.warn('[App] Service Worker registration failed:', err));
            }

            // 6. Configurer la gestion hors-ligne
            this._setupOfflineHandling();

            this.initialized = true;
            console.log('[App] Initialization complete');
        } catch (error) {
            console.error('[App] Initialization error:', error);
        }
    }

    /**
     * Configurer les écouteurs de jeu
     */
    _setupGameListeners() {
        // Score ajouté
        gameEngine.on('score-added', (data) => {
            console.log('[App] Score added:', data);
        });

        // Joueur changé
        gameEngine.on('player-changed', (data) => {
            console.log('[App] Player changed:', data.currentPlayer.pseudo);
            // Vibration si supportée
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        });

        // Partie terminée
        gameEngine.on('game-ended', () => {
            console.log('[App] Game ended');
        });
    }

    /**
     * Configurer les mises à jour du Service Worker
     */
    _setupServiceWorkerUpdates(registration) {
        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000);

        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                    uiManager.showNotification('Mise à jour disponible. Rechargez pour appliquer.', 'info');
                }
            });
        });
    }

    /**
     * Configurer la gestion hors-ligne
     */
    _setupOfflineHandling() {
        // Écouter la déconnexion réseau
        window.addEventListener('offline', () => {
            console.log('[App] Going offline');
            uiManager.showNotification('Mode hors-ligne', 'warning');
        });

        // Écouter la reconnexion réseau
        window.addEventListener('online', () => {
            console.log('[App] Back online');
            uiManager.showNotification('Mode connecté', 'success');
            
            // Synchroniser les données en attente
            this._syncPendingData();
        });

        // Vérifier la connexion initiale
        if (!navigator.onLine) {
            uiManager.showNotification('Mode hors-ligne', 'warning');
        }
    }

    /**
     * Synchroniser les données en attente
     */
    async _syncPendingData() {
        try {
            const syncQueue = await indexedDBManager.getSyncQueue();
            if (syncQueue.length > 0) {
                console.log('[App] Syncing pending data:', syncQueue.length, 'items');
                
                for (const item of syncQueue) {
                    try {
                        await supabaseClient.insert('score_events', item);
                        await indexedDBManager.removeFromSyncQueue(item.id);
                        console.log('[App] Synced:', item.id);
                    } catch (error) {
                        console.error('[App] Sync failed for:', item.id, error);
                        break;  // Arrêter si une erreur survient
                    }
                }
            }
        } catch (error) {
            console.error('[App] Sync error:', error);
        }
    }
}

// Instance globale
const app = new Application();

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// Gestion des erreurs non capturées
window.addEventListener('error', (event) => {
    console.error('[App] Uncaught error:', event.error);
});

// Gestion des promesses non traitées
window.addEventListener('unhandledrejection', (event) => {
    console.error('[App] Unhandled rejection:', event.reason);
});
