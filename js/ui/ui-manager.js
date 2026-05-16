/**
 * Gestionnaire d'interface utilisateur
 * Orchestre l'affichage et les interactions de l'interface
 */

class UIManager {
    constructor() {
        this.currentScreen = 'home';
        this.setupEventListeners();
    }

    /**
     * Configurer les écouteurs d'événements
     */
    setupEventListeners() {
        // Accueil
        const newProfileBtn = document.getElementById('new-profile-btn');
        if (newProfileBtn) newProfileBtn.addEventListener('click', () => this.showCreateGroupDialog());

        // Jeu
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('undo-btn').addEventListener('click', () => this.handleUndo());
        document.getElementById('edit-score-btn').addEventListener('click', () => this.showEditScore());

        // Paramètres
        document.getElementById('settings-close-btn').addEventListener('click', () => this.hideSettings());
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('add-player-btn').addEventListener('click', () => this.addPlayerUI());
        document.getElementById('create-group-btn').addEventListener('click', () => this.showCreateGroupDialog());

        // Dialogues
        document.getElementById('score-confirm-btn').addEventListener('click', () => this.confirmEditScore());
        document.getElementById('score-cancel-btn').addEventListener('click', () => this.hideEditScore());
        document.getElementById('group-confirm-btn').addEventListener('click', () => this.createGroup());
        document.getElementById('group-cancel-btn').addEventListener('click', () => this.hideCreateGroupDialog());
    }

    /**
     * Afficher un écran
     */
    showScreen(screenName) {
        // Masquer tous les écrans
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Afficher l'écran demandé
        const screen = document.getElementById(`${screenName}-screen`);
        if (screen) {
            screen.classList.remove('hidden');
            this.currentScreen = screenName;
            console.log('[UIManager] Screen:', screenName);
        }
    }

    /**
     * Charger les profils sur l'écran d'accueil
     */
    async loadProfiles() {
        try {
            const groups = await indexedDBManager.getAllGroups();
            const profilesList = document.getElementById('profiles-list');
            if (!profilesList) return;

            if (groups.length === 0) {
                profilesList.innerHTML = '<p class="empty-state">Aucun profil trouvé. Créez-en un pour commencer !</p>';
                return;
            }

            profilesList.innerHTML = groups.map(group => `
                <div class="profile-card" onclick="uiManager.selectProfile('${group.id}')">
                    <h3>${group.name}</h3>
                    <button class="btn btn-secondary">Jouer</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('[UIManager] Error loading profiles:', error);
        }
    }

    /**
     * Sélectionner un profil depuis l'accueil
     */
    selectProfile(groupId) {
        // Pré-sélectionner le groupe dans les paramètres
        const groupSelect = document.getElementById('group-select');
        if (groupSelect) {
            groupSelect.value = groupId;
        }
        // Afficher l'écran des paramètres pour démarrer la partie
        this.showSettings();
    }

    /**
     * Gérer la connexion
     */
    async handleLogin() {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');
        const errorDiv = document.getElementById('auth-error');

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            this.showError(errorDiv, 'Veuillez remplir tous les champs');
            return;
        }

        try {
            await supabaseClient.signIn(email, password);
            this.showScreen('game');
            await this.initializeGameScreen();
        } catch (error) {
            this.showError(errorDiv, error.message);
        }
    }

    /**
     * Gérer l'inscription
     */
    async handleSignup() {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');
        const errorDiv = document.getElementById('auth-error');

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            this.showError(errorDiv, 'Veuillez remplir tous les champs');
            return;
        }

        try {
            await supabaseClient.signUp(email, password);
            this.showScreen('game');
            await this.initializeGameScreen();
        } catch (error) {
            this.showError(errorDiv, error.message);
        }
    }

    /**
     * Afficher une erreur
     */
    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }

    /**
     * Initialiser l'écran de jeu
     */
    async initializeGameScreen() {
        try {
            // Charger les groupes et les joueurs
            await this.loadGroups();
            
            // Afficher les paramètres pour créer ou rejoindre une partie
            this.showSettings();
        } catch (error) {
            console.error('[UIManager] Error initializing game screen:', error);
        }
    }

    /**
     * Charger les groupes
     */
    async loadGroups() {
        try {
            const groups = await indexedDBManager.getAllGroups();
            const groupSelect = document.getElementById('group-select');
            
            groupSelect.innerHTML = groups.map(group => `
                <option value="${group.id}">${group.name}</option>
            `).join('');
        } catch (error) {
            console.error('[UIManager] Error loading groups:', error);
        }
    }

    /**
     * Afficher les paramètres
     */
    showSettings() {
        this.showScreen('settings');
    }

    /**
     * Masquer les paramètres
     */
    hideSettings() {
        // Retourner à l'écran de jeu si une partie est en cours
        if (gameEngine.isGameActive) {
            this.showScreen('game');
        }
    }

    /**
     * Créer et démarrer une partie
     */
    async startGame() {
        try {
            const groupId = document.getElementById('group-select').value;
            const moduleType = document.getElementById('game-module-select').value;

            if (!groupId) {
                alert('Veuillez sélectionner ou créer un groupe');
                return;
            }

            // Charger les membres du groupe
            const members = await indexedDBManager.getGroupMembers(groupId);
            const players = await Promise.all(
                members.map(m => indexedDBManager.getUser(m.user_id))
            );

            // Créer la partie
            const gameData = {
                id: this._generateUUID(),
                group_id: groupId,
                module_type: moduleType,
                status: 'active',
                created_at: new Date().toISOString()
            };

            await indexedDBManager.saveGame(gameData);

            // Initialiser le moteur de jeu
            await gameEngine.initializeGame(gameData, players, moduleType);

            // Initialiser le module de jeu
            if (gameEngine.gameModule) {
                await gameEngine.gameModule.initializeUI();
                gameEngine.gameModule._initVoiceListeners();
            }

            // Initialiser la synchronisation Realtime
            await realtimeSyncManager.init(gameData.id);

            // Afficher l'écran de jeu
            this.showScreen('game');
            this.updateUI();
        } catch (error) {
            console.error('[UIManager] Error starting game:', error);
            alert('Erreur au démarrage de la partie');
        }
    }

    /**
     * Ajouter un joueur à l'interface
     */
    addPlayerUI() {
        const manager = document.getElementById('players-manager');
        const newPlayerDiv = document.createElement('div');
        newPlayerDiv.className = 'player-input-group';
        newPlayerDiv.innerHTML = `
            <input type="text" placeholder="Nom du joueur" class="form-input player-name-input">
            <input type="color" title="Couleur" class="form-input player-color-input" style="width: 50px; height: 40px;">
            <button class="btn btn-danger" onclick="this.parentElement.remove()">Supprimer</button>
        `;
        manager.appendChild(newPlayerDiv);
    }

    /**
     * Afficher le dialogue de création de groupe
     */
    showCreateGroupDialog() {
        document.getElementById('create-group-dialog').showModal();
    }

    /**
     * Masquer le dialogue de création de groupe
     */
    hideCreateGroupDialog() {
        document.getElementById('create-group-dialog').close();
    }

    /**
     * Créer un groupe
     */
    async createGroup() {
        const nameInput = document.getElementById('group-name-input');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Veuillez entrer un nom de groupe');
            return;
        }

        try {
            const group = {
                id: this._generateUUID(),
                name,
                created_at: new Date().toISOString()
            };

            // Ajouter les joueurs au groupe
            const playerInputs = document.querySelectorAll('.player-name-input');
            const players = [];

            for (const input of playerInputs) {
                const playerName = input.value.trim();
                const playerColor = input.parentElement.querySelector('.player-color-input').value;

                if (playerName) {
                    const user = {
                        id: this._generateUUID(),
                        pseudo: playerName,
                        color: playerColor,
                        created_at: new Date().toISOString()
                    };
                    players.push(user);
                }
            }

            // Sauvegarder localement
            await indexedDBManager.saveGroup(group);
            for (const player of players) {
                await indexedDBManager.saveUser(player);
                await indexedDBManager.addGroupMember(group.id, player.id);
            }

            // Recharger les groupes et profils
            await this.loadGroups();
            await this.loadProfiles();

            // Masquer le dialogue
            this.hideCreateGroupDialog();
            nameInput.value = '';

            // Réinitialiser les joueurs
            document.getElementById('players-manager').innerHTML = '';

            this.showNotification(`Groupe "${name}" créé avec ${players.length} joueur(s)`);
        } catch (error) {
            console.error('[UIManager] Error creating group:', error);
            alert('Erreur lors de la création du groupe');
        }
    }

    /**
     * Gérer l'annulation
     */
    async handleUndo() {
        const success = await gameEngine.undoLastMove();
        if (success) {
            this.updateUI();
            this.showNotification('Coup annulé');
        } else {
            this.showNotification('Aucun coup à annuler', 'warning');
        }
    }

    /**
     * Afficher le dialogue d'édition de score
     */
    showEditScore() {
        const player = gameEngine.getCurrentPlayer();
        const input = document.getElementById('score-input');
        input.value = player.totalScore;
        document.getElementById('edit-score-dialog').showModal();
    }

    /**
     * Masquer le dialogue d'édition de score
     */
    hideEditScore() {
        document.getElementById('edit-score-dialog').close();
    }

    /**
     * Confirmer l'édition de score
     */
    async confirmEditScore() {
        const input = document.getElementById('score-input');
        const newScore = parseInt(input.value);

        if (isNaN(newScore) || newScore < 0) {
            alert('Veuillez entrer un score valide');
            return;
        }

        const success = await gameEngine.editScore(newScore);
        if (success) {
            this.hideEditScore();
            this.updateUI();
            this.showNotification('Score mis à jour');
        }
    }

    /**
     * Gérer la déconnexion
     */
    async handleLogout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
            try {
                await realtimeSyncManager.unsubscribeAll();
                await supabaseClient.signOut();
                gameEngine.isGameActive = false;
                this.showScreen('auth');

                // Effacer les champs
                document.getElementById('email-input').value = '';
                document.getElementById('password-input').value = '';
            } catch (error) {
                console.error('[UIManager] Logout error:', error);
            }
        }
    }

    /**
     * Mettre à jour l'interface
     */
    updateUI() {
        if (gameEngine.isGameActive) {
            responsiveUIManager.updateUI();
        }
    }

    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, CONFIG.UI.toastDuration);
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
}

// Instance globale
const uiManager = new UIManager();
