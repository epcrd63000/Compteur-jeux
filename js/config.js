/**
 * Configuration globale de l'application
 */

const CONFIG = {
    // URLs et clés Supabase
    SUPABASE_URL: 'https://zfsmszjrybpqnqbvkaeb.supabase.co',
    SUPABASE_KEY: 'sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ',
    SUPABASE_PROJECT_REF: 'zfsmszjrybpqnqbvkaeb',

    // Base de données IndexedDB
    DB_NAME: 'compteur-db',
    DB_VERSION: 1,
    STORES: {
        users: 'local_users',
        groups: 'local_groups',
        groupMembers: 'local_group_members',
        games: 'local_games',
        scoreEvents: 'local_score_events',
        syncQueue: 'sync_queue',
        auth: 'local_auth'
    },

    // Paramètres de jeu
    GAME_DEFAULTS: {
        10000: {
            name: 'Le 10 000',
            victoryScore: 10000,
            quickButtons: [100, 150, 200, 300],
            allowZeroTurn: true
        },
        scrabble: {
            name: 'Scrabble',
            victoryScore: null,  // Déterminé par les joueurs
            quickButtons: []
        }
    },

    // Paramètres d'interface
    UI: {
        turnPauseDuration: 1000,  // ms avant passage au joueur suivant
        swipeThreshold: 50,  // pixels minimum pour détecter un swipe
        toastDuration: 3000  // ms
    },

    // Paramètres Realtime
    REALTIME: {
        reconnectInterval: 5000,  // ms
        maxReconnectAttempts: 10
    },

    // Localisation
    LOCALE: 'fr-FR',
    TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Logging
    DEBUG: false
};

// Export pour ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
