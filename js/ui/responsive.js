/**
 * Gestionnaire d'interface responsive
 * Gère l'adaptation Portrait/Paysage et met à jour l'UI
 */

class ResponsiveUIManager {
    constructor() {
        this.orientation = this._getOrientation();
        this.setupResizeListener();
    }

    /**
     * Configurer l'écouteur de changement de taille
     */
    setupResizeListener() {
        window.addEventListener('orientationchange', () => this._handleOrientationChange());
        window.addEventListener('resize', () => this._handleResize());
    }

    /**
     * Obtenir l'orientation actuelle
     */
    _getOrientation() {
        if (window.matchMedia('(orientation: portrait)').matches) {
            return 'portrait';
        }
        return 'landscape';
    }

    /**
     * Gérer le changement d'orientation
     */
    _handleOrientationChange() {
        const newOrientation = this._getOrientation();
        if (newOrientation !== this.orientation) {
            this.orientation = newOrientation;
            console.log('[ResponsiveUI] Orientation changed:', newOrientation);
            this._updateLayout();
        }
    }

    /**
     * Gérer le redimensionnement
     */
    _handleResize() {
        this._updateLayout();
    }

    /**
     * Mettre à jour la disposition
     */
    _updateLayout() {
        const gameScreen = document.getElementById('game-screen');
        const miniBar = document.querySelector('.miniatures-bar');
        const dashboardLeft = document.getElementById('dashboard-left');

        if (this.orientation === 'portrait') {
            // Mode portrait: afficher la barre de miniatures
            if (miniBar) miniBar.style.display = 'flex';
            if (dashboardLeft) dashboardLeft.style.display = 'none';
        } else {
            // Mode paysage: cacher la barre et afficher le dashboard
            if (miniBar) miniBar.style.display = 'none';
            if (dashboardLeft) dashboardLeft.style.display = 'flex';
            
            // Mettre à jour la liste des joueurs
            this._updatePlayersDashboard();
        }
    }

    /**
     * Mettre à jour le dashboard des joueurs
     */
    _updatePlayersDashboard() {
        const playersList = document.getElementById('players-list');
        if (!playersList || !gameEngine.players) return;

        playersList.innerHTML = gameEngine.players.map(player => `
            <div class="player-dashboard-item ${player.isActive ? 'active' : ''}">
                <div class="player-info">
                    <div class="player-info-name" style="color: ${player.color || '#2c3e50'}">
                        ${player.pseudo}
                    </div>
                    <div class="player-info-stats">
                        ${player.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                    </div>
                </div>
                <div class="player-info-score">${player.totalScore}</div>
            </div>
        `).join('');
    }

    /**
     * Mettre à jour les miniatures
     */
    updateMiniatures() {
        const container = document.getElementById('miniatures-container');
        if (!container || !gameEngine.players) return;

        container.innerHTML = gameEngine.players.map((player, index) => `
            <div class="miniature-card ${player.isActive ? 'active' : ''} ${player.isOnline ? 'online' : ''}"
                 onclick="gameEngine.currentPlayerIndex = ${index}; uiManager.updateUI();">
                <div class="miniature-name">${player.pseudo}</div>
                <div class="miniature-score">${player.totalScore}</div>
            </div>
        `).join('');
    }

    /**
     * Mettre à jour l'interface générale
     */
    updateUI() {
        if (this.orientation === 'portrait') {
            this.updateMiniatures();
        } else {
            this._updatePlayersDashboard();
        }
    }
}

// Instance globale
const responsiveUIManager = new ResponsiveUIManager();
