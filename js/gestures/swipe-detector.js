/**
 * Détecteur de gestes tactiles (Swipe)
 * Détecte les balayages (swipe) gauche/droite/haut/bas
 */

class SwipeDetector {
    constructor(element) {
        this.element = element;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.callbacks = {};

        this._setupEventListeners();
    }

    /**
     * Configurer les écouteurs d'événements
     */
    _setupEventListeners() {
        this.element.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: true });
        this.element.addEventListener('touchend', (e) => this._handleTouchEnd(e), { passive: true });
    }

    /**
     * Gérer le début du toucher
     */
    _handleTouchStart(event) {
        const touch = event.changedTouches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    /**
     * Gérer la fin du toucher
     */
    _handleTouchEnd(event) {
        const touch = event.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;

        this._detectSwipe();
    }

    /**
     * Détecter le type de swipe
     */
    _detectSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const threshold = CONFIG.UI.swipeThreshold;  // par défaut 50px

        // Déterminer l'axe principal du mouvement
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
        const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

        if (isHorizontal && Math.abs(deltaX) > threshold) {
            if (deltaX < 0) {
                this._trigger('swiped-left');
            } else {
                this._trigger('swiped-right');
            }
        }

        if (isVertical && Math.abs(deltaY) > threshold) {
            if (deltaY < 0) {
                this._trigger('swiped-up');
            } else {
                this._trigger('swiped-down');
            }
        }
    }

    /**
     * S'enregistrer pour un événement de swipe
     */
    on(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        this.callbacks[eventType].push(callback);
        console.log(`[SwipeDetector] Registered '${eventType}' callback`);
    }

    /**
     * Se désinscrire d'un événement
     */
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType] = this.callbacks[eventType].filter(cb => cb !== callback);
        }
    }

    /**
     * Déclencher les callbacks
     */
    _trigger(eventType) {
        console.log('[SwipeDetector] Event:', eventType);
        if (this.callbacks[eventType]) {
            for (const callback of this.callbacks[eventType]) {
                try {
                    callback();
                } catch (error) {
                    console.error(`[SwipeDetector] Callback error (${eventType}):`, error);
                }
            }
        }
    }
}

// Créer une instance globale pour la zone du joueur actif
let globalSwipeDetector = null;

window.addEventListener('DOMContentLoaded', () => {
    const activePlayerZone = document.getElementById('active-player-zone');
    if (activePlayerZone) {
        globalSwipeDetector = new SwipeDetector(activePlayerZone);
        console.log('[SwipeDetector] Initialized');
    }
});
