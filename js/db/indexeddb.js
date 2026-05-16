/**
 * Gestionnaire IndexedDB
 * Gère la persistance locale des données et la file d'attente de synchronisation
 */

class IndexedDBManager {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    /**
     * Initialiser la base de données
     */
    async init() {
        if (this.initialized) return;

        try {
            this.db = await idb.open(CONFIG.DB_NAME, CONFIG.DB_VERSION, {
                upgrade: (db) => this._upgradeDatabase(db)
            });
            this.initialized = true;
            console.log('[IndexedDB] Initialized successfully');
        } catch (error) {
            console.error('[IndexedDB] Initialization error:', error);
            throw error;
        }
    }

    /**
     * Mettre à niveau la base de données
     */
    _upgradeDatabase(db) {
        // Créer les object stores s'ils n'existent pas
        const storeConfigs = [
            { name: CONFIG.STORES.users, keyPath: 'id' },
            { name: CONFIG.STORES.groups, keyPath: 'id' },
            { name: CONFIG.STORES.groupMembers, keyPath: ['group_id', 'user_id'] },
            { name: CONFIG.STORES.games, keyPath: 'id' },
            { name: CONFIG.STORES.scoreEvents, keyPath: 'id' },
            { name: CONFIG.STORES.syncQueue, keyPath: 'id' },
            { name: CONFIG.STORES.auth, keyPath: 'key' }
        ];

        for (const config of storeConfigs) {
            if (!db.objectStoreNames.contains(config.name)) {
                const store = db.createObjectStore(config.name, { keyPath: config.keyPath });
                console.log(`[IndexedDB] Created store: ${config.name}`);
            }
        }
    }

    /**
     * Lire un utilisateur
     */
    async getUser(userId) {
        const tx = this.db.transaction(CONFIG.STORES.users, 'readonly');
        return await tx.objectStore(CONFIG.STORES.users).get(userId);
    }

    /**
     * Sauvegarder un utilisateur
     */
    async saveUser(user) {
        const tx = this.db.transaction(CONFIG.STORES.users, 'readwrite');
        await tx.objectStore(CONFIG.STORES.users).put(user);
    }

    /**
     * Lire tous les utilisateurs
     */
    async getAllUsers() {
        const tx = this.db.transaction(CONFIG.STORES.users, 'readonly');
        return await tx.objectStore(CONFIG.STORES.users).getAll();
    }

    /**
     * Lire un groupe
     */
    async getGroup(groupId) {
        const tx = this.db.transaction(CONFIG.STORES.groups, 'readonly');
        return await tx.objectStore(CONFIG.STORES.groups).get(groupId);
    }

    /**
     * Sauvegarder un groupe
     */
    async saveGroup(group) {
        const tx = this.db.transaction(CONFIG.STORES.groups, 'readwrite');
        await tx.objectStore(CONFIG.STORES.groups).put(group);
    }

    /**
     * Lire tous les groupes
     */
    async getAllGroups() {
        const tx = this.db.transaction(CONFIG.STORES.groups, 'readonly');
        return await tx.objectStore(CONFIG.STORES.groups).getAll();
    }

    /**
     * Lire les membres d'un groupe
     */
    async getGroupMembers(groupId) {
        const tx = this.db.transaction(CONFIG.STORES.groupMembers, 'readonly');
        const store = tx.objectStore(CONFIG.STORES.groupMembers);
        return await store.getAll(IDBKeyRange.bound([groupId], [groupId, '\uffff']));
    }

    /**
     * Ajouter un membre à un groupe
     */
    async addGroupMember(groupId, userId) {
        const tx = this.db.transaction(CONFIG.STORES.groupMembers, 'readwrite');
        await tx.objectStore(CONFIG.STORES.groupMembers).put({
            group_id: groupId,
            user_id: userId,
            joined_at: new Date().toISOString()
        });
    }

    /**
     * Lire une partie
     */
    async getGame(gameId) {
        const tx = this.db.transaction(CONFIG.STORES.games, 'readonly');
        return await tx.objectStore(CONFIG.STORES.games).get(gameId);
    }

    /**
     * Sauvegarder une partie
     */
    async saveGame(game) {
        const tx = this.db.transaction(CONFIG.STORES.games, 'readwrite');
        await tx.objectStore(CONFIG.STORES.games).put(game);
    }

    /**
     * Lire les parties d'un groupe
     */
    async getGamesByGroup(groupId) {
        const tx = this.db.transaction(CONFIG.STORES.games, 'readonly');
        const store = tx.objectStore(CONFIG.STORES.games);
        const allGames = await store.getAll();
        return allGames.filter(g => g.group_id === groupId);
    }

    /**
     * Lire un événement de score
     */
    async getScoreEvent(eventId) {
        const tx = this.db.transaction(CONFIG.STORES.scoreEvents, 'readonly');
        return await tx.objectStore(CONFIG.STORES.scoreEvents).get(eventId);
    }

    /**
     * Sauvegarder un événement de score
     */
    async saveScoreEvent(event) {
        const tx = this.db.transaction(CONFIG.STORES.scoreEvents, 'readwrite');
        await tx.objectStore(CONFIG.STORES.scoreEvents).put(event);
    }

    /**
     * Lire tous les événements de score d'une partie
     */
    async getScoreEventsByGame(gameId) {
        const tx = this.db.transaction(CONFIG.STORES.scoreEvents, 'readonly');
        const store = tx.objectStore(CONFIG.STORES.scoreEvents);
        const allEvents = await store.getAll();
        return allEvents.filter(e => e.game_id === gameId).sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
        );
    }

    /**
     * Lire tous les événements d'un joueur dans une partie
     */
    async getUserScoreEvents(gameId, userId) {
        const allEvents = await this.getScoreEventsByGame(gameId);
        return allEvents.filter(e => e.user_id === userId);
    }

    /**
     * Ajouter un score à la file d'attente de synchronisation
     */
    async queueScoreForSync(scoreEvent) {
        const tx = this.db.transaction(CONFIG.STORES.syncQueue, 'readwrite');
        await tx.objectStore(CONFIG.STORES.syncQueue).put(scoreEvent);
        console.log('[IndexedDB] Score queued for sync:', scoreEvent.id);
    }

    /**
     * Lire la file d'attente de synchronisation
     */
    async getSyncQueue() {
        const tx = this.db.transaction(CONFIG.STORES.syncQueue, 'readonly');
        return await tx.objectStore(CONFIG.STORES.syncQueue).getAll();
    }

    /**
     * Supprimer un score de la file d'attente
     */
    async removeFromSyncQueue(scoreId) {
        const tx = this.db.transaction(CONFIG.STORES.syncQueue, 'readwrite');
        await tx.objectStore(CONFIG.STORES.syncQueue).delete(scoreId);
    }

    /**
     * Vider la file d'attente
     */
    async clearSyncQueue() {
        const tx = this.db.transaction(CONFIG.STORES.syncQueue, 'readwrite');
        await tx.objectStore(CONFIG.STORES.syncQueue).clear();
    }

    /**
     * Sauvegarder la session d'authentification
     */
    async saveSession(session) {
        const tx = this.db.transaction(CONFIG.STORES.auth, 'readwrite');
        await tx.objectStore(CONFIG.STORES.auth).put({
            key: 'session',
            ...session
        });
    }

    /**
     * Lire la session d'authentification
     */
    async getSession() {
        const tx = this.db.transaction(CONFIG.STORES.auth, 'readonly');
        return await tx.objectStore(CONFIG.STORES.auth).get('session');
    }

    /**
     * Supprimer la session
     */
    async deleteSession() {
        const tx = this.db.transaction(CONFIG.STORES.auth, 'readwrite');
        await tx.objectStore(CONFIG.STORES.auth).delete('session');
    }

    /**
     * Nettoyer toutes les données (debug/test)
     */
    async clear() {
        const storeNames = [
            CONFIG.STORES.users,
            CONFIG.STORES.groups,
            CONFIG.STORES.groupMembers,
            CONFIG.STORES.games,
            CONFIG.STORES.scoreEvents,
            CONFIG.STORES.syncQueue,
            CONFIG.STORES.auth
        ];

        for (const storeName of storeNames) {
            const tx = this.db.transaction(storeName, 'readwrite');
            await tx.objectStore(storeName).clear();
        }
        console.log('[IndexedDB] All stores cleared');
    }
}

// Instance globale
const indexedDBManager = new IndexedDBManager();

