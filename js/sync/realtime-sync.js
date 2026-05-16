/**
 * Gestionnaire de synchronisation Realtime
 * Gère les WebSockets et la synchronisation temps réel
 */

class RealtimeSyncManager {
    constructor() {
        this.subscriptions = new Map();
        this.presence = new Map();
        this.isConnected = false;
    }

    /**
     * Initialiser la synchronisation Realtime
     */
    async init(gameId) {
        try {
            console.log('[RealtimeSync] Initializing for game:', gameId);

            // S'abonner aux changements de scores
            this._subscribeToScoreChanges(gameId);

            // S'abonner aux changements de présence
            this._subscribeToPresence(gameId);

            this.isConnected = true;
        } catch (error) {
            console.error('[RealtimeSync] Initialization error:', error);
        }
    }

    /**
     * S'abonner aux changements de scores
     */
    _subscribeToScoreChanges(gameId) {
        const channel = `score_events:game_id=eq.${gameId}`;
        
        const unsubscribe = supabaseClient.subscribe('score_events', 'INSERT', (event) => {
            if (event.payload.game_id === gameId) {
                this._handleScoreEventUpdate(event.payload);
            }
        });

        this.subscriptions.set(channel, unsubscribe);
    }

    /**
     * Gérer la mise à jour d'un événement de score
     */
    async _handleScoreEventUpdate(scoreEvent) {
        console.log('[RealtimeSync] Score event received:', scoreEvent);

        try {
            // Sauvegarder localement
            await indexedDBManager.saveScoreEvent(scoreEvent);

            // Mettre à jour l'état du jeu
            const player = gameEngine.players.find(p => p.id === scoreEvent.user_id);
            if (player && !scoreEvent.is_undo) {
                player.totalScore += scoreEvent.points;
            }

            // Mettre à jour l'UI
            if (uiManager) {
                uiManager.updateUI();
            }

            // Vérifier la victoire
            const scoreEvents = await indexedDBManager.getScoreEventsByGame(
                gameEngine.currentGame.id
            );
            const allScores = {};
            for (const event of scoreEvents) {
                if (!event.is_undo) {
                    allScores[event.user_id] = (allScores[event.user_id] || 0) + event.points;
                }
            }

            for (const [userId, score] of Object.entries(allScores)) {
                if (score >= CONFIG.GAME_DEFAULTS['10000'].victoryScore) {
                    console.log('[RealtimeSync] Victory detected for player:', userId);
                    if (gameEngine.gameModule) {
                        await gameEngine.gameModule._handleVictory(userId);
                    }
                }
            }
        } catch (error) {
            console.error('[RealtimeSync] Error handling score event:', error);
        }
    }

    /**
     * S'abonner à la présence des joueurs
     */
    _subscribeToPresence(gameId) {
        const channel = `presence:game:${gameId}`;
        
        // Simuler la présence avec un heartbeat
        const presenceInterval = setInterval(() => {
            this._broadcastPresence(gameId);
        }, 5000);

        this.subscriptions.set(channel, () => clearInterval(presenceInterval));
    }

    /**
     * Diffuser la présence du joueur
     */
    async _broadcastPresence(gameId) {
        if (!supabaseClient.auth) return;

        const presence = {
            userId: supabaseClient.auth.user?.id || 'anonymous',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // Émettre un événement de présence
        supabaseClient.broadcastEvent(
            `presence:game:${gameId}`,
            'user-connected',
            presence
        );

        // Sauvegarder localement
        this.presence.set(presence.userId, presence);
    }

    /**
     * Obtenir la liste des utilisateurs actifs
     */
    getActiveUsers() {
        const now = new Date();
        const threshold = 10000; // 10 secondes

        const active = Array.from(this.presence.values()).filter(user => {
            const timeDiff = now - new Date(user.timestamp);
            return timeDiff < threshold;
        });

        return active;
    }

    /**
     * Marquer un joueur en ligne
     */
    markUserOnline(userId) {
        const player = gameEngine.players.find(p => p.id === userId);
        if (player) {
            player.isOnline = true;
            if (uiManager) {
                uiManager.updateUI();
            }
        }
    }

    /**
     * Marquer un joueur hors ligne
     */
    markUserOffline(userId) {
        const player = gameEngine.players.find(p => p.id === userId);
        if (player) {
            player.isOnline = false;
            if (uiManager) {
                uiManager.updateUI();
            }
        }
    }

    /**
     * Se désabonner de tous les canaux
     */
    async unsubscribeAll() {
        for (const [channel, unsubscribe] of this.subscriptions.entries()) {
            try {
                unsubscribe();
                console.log('[RealtimeSync] Unsubscribed from:', channel);
            } catch (error) {
                console.error('[RealtimeSync] Error unsubscribing:', error);
            }
        }
        this.subscriptions.clear();
        this.isConnected = false;
    }
}

// Instance globale
const realtimeSyncManager = new RealtimeSyncManager();
