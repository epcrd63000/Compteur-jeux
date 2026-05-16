/**
 * Moteur principal du jeu
 * Gère l'état global du jeu, les tours, et la logique de base
 */

class GameEngine {
    constructor() {
        this.currentGame = null;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameModule = null;
        this.isGameActive = false;
        this.turnTimer = null;
        this.listeners = {};
    }

    /**
     * Initialiser une nouvelle partie
     */
    async initializeGame(gameData, players, moduleType = '10000') {
        try {
            this.currentGame = gameData;
            this.players = players.map(p => ({
                ...p,
                totalScore: 0,
                currentRoundScore: 0,
                isActive: false,
                isOnline: false
            }));
            this.currentPlayerIndex = 0;
            this.gameModule = this._loadGameModule(moduleType);
            this.isGameActive = true;

            // Marquer le premier joueur comme actif
            this.players[0].isActive = true;

            // Charger les scores depuis IndexedDB
            await this._loadScoreHistory();

            console.log('[GameEngine] Game initialized:', {
                players: this.players.length,
                module: moduleType
            });

            this._emit('game-initialized');
        } catch (error) {
            console.error('[GameEngine] Initialization error:', error);
            throw error;
        }
    }

    /**
     * Charger le module de jeu
     */
    _loadGameModule(moduleType) {
        switch (moduleType) {
            case '10000':
                return new Game10000(this);
            case 'scrabble':
                // À implémenter
                console.warn('[GameEngine] Scrabble module not yet implemented');
                return null;
            default:
                throw new Error(`Unknown game module: ${moduleType}`);
        }
    }

    /**
     * Charger l'historique des scores
     */
    async _loadScoreHistory() {
        try {
            const scoreEvents = await indexedDBManager.getScoreEventsByGame(this.currentGame.id);
            
            // Recalculer les scores
            for (const event of scoreEvents) {
                if (!event.is_undo) {
                    const player = this.players.find(p => p.id === event.user_id);
                    if (player) {
                        player.totalScore += event.points;
                    }
                }
            }

            console.log('[GameEngine] Score history loaded');
        } catch (error) {
            console.error('[GameEngine] Error loading score history:', error);
        }
    }

    /**
     * Ajouter un score pour le joueur actif
     */
    async addScore(points) {
        if (!this.isGameActive || !this.gameModule) {
            console.error('[GameEngine] Game not active');
            return false;
        }

        try {
            const player = this.players[this.currentPlayerIndex];
            const scoreEvent = {
                id: this._generateUUID(),
                game_id: this.currentGame.id,
                user_id: player.id,
                points,
                created_at: new Date().toISOString(),
                is_undo: false
            };

            // Mise à jour optimiste
            player.totalScore += points;
            player.currentRoundScore += points;

            // Sauvegarder localement
            await indexedDBManager.saveScoreEvent(scoreEvent);

            // Essayer de synchroniser
            try {
                const response = await supabaseClient.insert('score_events', scoreEvent);
                console.log('[GameEngine] Score synchronized:', response);
            } catch (error) {
                console.warn('[GameEngine] Score sync failed, queuing:', error);
                // Ajouter à la file d'attente si la synchronisation échoue
                await indexedDBManager.queueScoreForSync(scoreEvent);

                // Enregistrer la synchronisation en arrière-plan
                if ('serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.sync.register('sync-scores');
                    } catch (err) {
                        console.warn('[GameEngine] Background sync registration failed:', err);
                    }
                }
            }

            this._emit('score-added', { player, points });
            return true;
        } catch (error) {
            console.error('[GameEngine] Add score error:', error);
            return false;
        }
    }

    /**
     * Annuler le dernier coup
     */
    async undoLastMove() {
        try {
            const player = this.players[this.currentPlayerIndex];
            const lastEvents = await indexedDBManager.getUserScoreEvents(
                this.currentGame.id,
                player.id
            );

            // Trouver le dernier événement non-annulé
            const lastEvent = lastEvents.reverse().find(e => !e.is_undo);
            if (!lastEvent) {
                console.log('[GameEngine] No move to undo');
                return false;
            }

            // Créer un événement d'annulation
            const undoEvent = {
                id: this._generateUUID(),
                game_id: this.currentGame.id,
                user_id: player.id,
                points: -lastEvent.points,
                created_at: new Date().toISOString(),
                is_undo: true,
                undo_of: lastEvent.id
            };

            // Mise à jour optimiste
            player.totalScore -= lastEvent.points;
            player.currentRoundScore -= lastEvent.points;

            // Sauvegarder
            await indexedDBManager.saveScoreEvent(undoEvent);

            // Synchroniser
            try {
                await supabaseClient.insert('score_events', undoEvent);
            } catch (error) {
                await indexedDBManager.queueScoreForSync(undoEvent);
            }

            this._emit('move-undone', { player, originalPoints: lastEvent.points });
            return true;
        } catch (error) {
            console.error('[GameEngine] Undo error:', error);
            return false;
        }
    }

    /**
     * Passer au joueur suivant
     */
    async advanceToNextPlayer() {
        if (!this.isGameActive) return;

        try {
            // Réinitialiser le score de tour
            this.players[this.currentPlayerIndex].currentRoundScore = 0;

            // Passer au joueur suivant
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

            // Mettre à jour l'état
            this.players.forEach((p, i) => {
                p.isActive = i === this.currentPlayerIndex;
            });

            this._emit('player-changed', {
                currentPlayer: this.players[this.currentPlayerIndex],
                index: this.currentPlayerIndex
            });

            return true;
        } catch (error) {
            console.error('[GameEngine] Advance player error:', error);
            return false;
        }
    }

    /**
     * Passer son tour avec zéro point
     */
    async passWithZero() {
        console.log('[GameEngine] Player passing with zero');
        return this.advanceToNextPlayer();
    }

    /**
     * Éditer manuellement le score du joueur actif
     */
    async editScore(newTotal) {
        try {
            const player = this.players[this.currentPlayerIndex];
            const oldTotal = player.totalScore;
            const difference = newTotal - oldTotal;

            if (difference === 0) {
                console.log('[GameEngine] No change in score');
                return false;
            }

            const scoreEvent = {
                id: this._generateUUID(),
                game_id: this.currentGame.id,
                user_id: player.id,
                points: difference,
                created_at: new Date().toISOString(),
                is_undo: false,
                is_manual_edit: true
            };

            // Mise à jour optimiste
            player.totalScore = newTotal;

            // Sauvegarder
            await indexedDBManager.saveScoreEvent(scoreEvent);

            try {
                await supabaseClient.insert('score_events', scoreEvent);
            } catch (error) {
                await indexedDBManager.queueScoreForSync(scoreEvent);
            }

            this._emit('score-edited', { player, oldTotal, newTotal });
            return true;
        } catch (error) {
            console.error('[GameEngine] Edit score error:', error);
            return false;
        }
    }

    /**
     * Obtenir le joueur actif
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /**
     * Obtenir tous les joueurs
     */
    getPlayers() {
        return this.players;
    }

    /**
     * S'enregistrer pour les événements
     */
    on(eventType, callback) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = [];
        }
        this.listeners[eventType].push(callback);
    }

    /**
     * Émettre un événement
     */
    _emit(eventType, data = null) {
        if (this.listeners[eventType]) {
            for (const callback of this.listeners[eventType]) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[GameEngine] Event callback error (${eventType}):`, error);
                }
            }
        }
    }

    /**
     * Générer un UUID
     */
    _generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Terminer la partie
     */
    async endGame() {
        this.isGameActive = false;
        
        // Mettre à jour le statut dans la base de données
        try {
            await supabaseClient.update('games', 
                { status: 'finished' },
                { id: this.currentGame.id }
            );
        } catch (error) {
            console.error('[GameEngine] Error ending game:', error);
        }

        this._emit('game-ended');
    }
}

// Instance globale
const gameEngine = new GameEngine();
