/**
 * Module de jeu "Le 10 000"
 * Encapsule les règles et l'interface spécifiques du jeu du 10 000
 */

class Game10000 {
    constructor(engine) {
        this.engine = engine;
        this.config = CONFIG.GAME_DEFAULTS['10000'];
        this.isWon = false;
    }

    /**
     * Obtenir l'HTML des contrôles rapides
     */
    renderControls() {
        const buttons = this.config.quickButtons.map(points => `
            <button class="btn btn-primary quick-score-btn" data-points="${points}">
                +${points}
            </button>
        `).join('');

        return `
            <div class="quick-buttons">
                ${buttons}
            </div>
            <div class="voice-controls">
                <button class="icon-btn" id="voice-btn" title="Saisie vocale">
                    🎤
                </button>
            </div>
        `;
    }

    /**
     * Évaluer l'état du jeu selon les règles
     */
    evaluateState(eventHistory) {
        // Recalculer les scores
        const playerScores = {};
        for (const event of eventHistory) {
            if (!event.is_undo) {
                playerScores[event.user_id] = (playerScores[event.user_id] || 0) + event.points;
            }
        }

        // Vérifier la victoire
        for (const [userId, score] of Object.entries(playerScores)) {
            if (score >= this.config.victoryScore) {
                return { victoryPlayerId: userId, scores: playerScores };
            }
        }

        return { scores: playerScores };
    }

    /**
     * Obtenir le dictionnaire des mots vocaux
     */
    getVoiceDictionary() {
        return ['cent', 'cinquante', 'mille', 'trois', 'quatre', 'vingt'];
    }

    /**
     * Initialiser les contrôles du jeu
     */
    async initializeUI() {
        const gameControls = document.getElementById('game-controls');
        gameControls.innerHTML = this.renderControls();

        // Ajouter les écouteurs pour les boutons rapides
        gameControls.querySelectorAll('.quick-score-btn').forEach(btn => {
            btn.addEventListener('click', () => this._handleQuickButton(btn));
        });

        // Configurer le bouton de reconnaissance vocale
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn && speechRecognitionManager.isSupported()) {
            voiceBtn.addEventListener('click', () => this._handleVoiceInput(voiceBtn));
        } else if (voiceBtn) {
            voiceBtn.disabled = true;
            voiceBtn.title = 'Reconnaissance vocale non supportée';
        }

        // Configurer le détecteur de gestes
        if (globalSwipeDetector) {
            globalSwipeDetector.on('swiped-left', () => this._handleSwipeLeft());
        }

        // Écouter les événements du moteur
        this.engine.on('score-added', () => this._onScoreAdded());
        this.engine.on('player-changed', () => this._updateUI());
    }

    /**
     * Gérer un bouton rapide
     */
    async _handleQuickButton(btn) {
        const points = parseInt(btn.dataset.points);
        console.log('[Game10000] Quick button:', points);

        // Animation du bouton
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 100);

        // Ajouter le score
        const success = await this.engine.addScore(points);
        if (success) {
            this._animateScoreUpdate();
        }
    }

    /**
     * Gérer la saisie vocale
     */
    async _handleVoiceInput(btn) {
        if (!speechRecognitionManager.isSupported()) {
            console.error('[Game10000] Speech recognition not supported');
            return;
        }

        // Basculer l'état du bouton
        if (speechRecognitionManager.isListening) {
            speechRecognitionManager.stop();
            btn.classList.remove('listening');
        } else {
            btn.classList.add('listening');
            speechRecognitionManager.start();
        }
    }

    /**
     * Initialiser les écouteurs pour la reconnaissance vocale
     */
    _initVoiceListeners() {
        speechRecognitionManager.on('onResult', (data) => {
            console.log('[Game10000] Voice result:', data.transcript);

            const points = frenchNumberParser.parse(data.transcript);
            if (points !== null && points > 0) {
                console.log('[Game10000] Parsed points:', points);
                this.engine.addScore(points);
            } else {
                console.warn('[Game10000] Could not parse:', data.transcript);
            }
        });

        speechRecognitionManager.on('onError', (data) => {
            console.error('[Game10000] Voice error:', data.error);
        });
    }

    /**
     * Gérer le swipe vers la gauche
     */
    async _handleSwipeLeft() {
        console.log('[Game10000] Swipe left detected');
        if (this.config.allowZeroTurn) {
            await this.engine.passWithZero();
        }
    }

    /**
     * Animer la mise à jour du score
     */
    _animateScoreUpdate() {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.style.animation = 'none';
            setTimeout(() => {
                scoreDisplay.style.animation = '';
            }, 10);
        }
    }

    /**
     * Callback lors de l'ajout d'un score
     */
    async _onScoreAdded() {
        // Vérifier la victoire
        const scoreEvents = await indexedDBManager.getScoreEventsByGame(
            this.engine.currentGame.id
        );
        const state = this.evaluateState(scoreEvents);

        if (state.victoryPlayerId && !this.isWon) {
            await this._handleVictory(state.victoryPlayerId);
        } else {
            // Programmer le passage au joueur suivant après une pause
            if (this.engine.turnTimer) {
                clearTimeout(this.engine.turnTimer);
            }
            this.engine.turnTimer = setTimeout(() => {
                this.engine.advanceToNextPlayer();
            }, CONFIG.UI.turnPauseDuration);
        }

        // Mettre à jour l'UI
        await this._updateUI();
    }

    /**
     * Gérer la victoire
     */
    async _handleVictory(winnerUserId) {
        this.isWon = true;
        const winner = this.engine.players.find(p => p.id === winnerUserId);

        console.log('[Game10000] Victory:', winner.pseudo);

        // Arrêter la partie
        await this.engine.endGame();

        // Afficher la victoire
        this._showVictoryScreen(winner);

        // Lancer l'animation de confettis
        if (typeof ConfettiAnimation !== 'undefined') {
            new ConfettiAnimation();
        }
    }

    /**
     * Afficher l'écran de victoire
     */
    _showVictoryScreen(winner) {
        const appContainer = document.getElementById('app');
        const victoryOverlay = document.createElement('div');
        victoryOverlay.className = 'victory-overlay';
        victoryOverlay.innerHTML = `
            <div class="victory-message">
                <h1>🎉 Victoire! 🎉</h1>
                <h2>${winner.pseudo}</h2>
                <p>a atteint ${this.config.victoryScore} points!</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Nouvelle partie
                </button>
            </div>
        `;
        appContainer.appendChild(victoryOverlay);
    }

    /**
     * Mettre à jour l'interface
     */
    async _updateUI() {
        const player = this.engine.getCurrentPlayer();
        
        // Mettre à jour le nom
        const playerNameElem = document.getElementById('current-player-name');
        if (playerNameElem) {
            playerNameElem.textContent = player.pseudo || 'Joueur';
        }

        // Mettre à jour le score
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = player.totalScore;
        }

        // Mettre à jour l'historique
        await this._updateHistory();
    }

    /**
     * Mettre à jour l'historique des coups
     */
    async _updateHistory() {
        const player = this.engine.getCurrentPlayer();
        const events = await indexedDBManager.getUserScoreEvents(
            this.engine.currentGame.id,
            player.id
        );

        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        // Afficher les 5 derniers coups
        const recentEvents = events.slice(-5).reverse();
        historyList.innerHTML = recentEvents.map(event => `
            <div class="history-item ${event.is_undo ? 'undo' : ''}">
                <span>${event.is_undo ? '↶ Annulé' : '➕ Ajouté'}</span>
                <span class="points">${event.points > 0 ? '+' : ''}${event.points}</span>
            </div>
        `).join('');
    }
}
