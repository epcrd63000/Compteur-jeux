/**
 * Client Supabase
 * Gère l'authentification, les appels API et la synchronisation temps réel
 */

class SupabaseClient {
    constructor() {
        this.baseUrl = CONFIG.SUPABASE_URL;
        this.apiKey = CONFIG.SUPABASE_KEY;
        this.auth = null;
        this.realtimeChannels = new Map();
        this.isConnected = false;
    }

    /**
     * Initialiser le client
     */
    async init() {
        try {
            // Charger la session depuis IndexedDB
            const session = await indexedDBManager.getSession();
            if (session && session.access_token) {
                this.auth = session;
                console.log('[Supabase] Session restored from IndexedDB');
            }
        } catch (error) {
            console.warn('[Supabase] No session found:', error);
        }
    }

    /**
     * Authentification - Inscription
     */
    async signUp(email, password) {
        try {
            const response = await fetch(
                `${this.baseUrl}/auth/v1/signup`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.msg || error.error_description || 'Signup failed');
            }

            const data = await response.json();
            this.auth = data.session;
            await indexedDBManager.saveSession(this.auth);
            console.log('[Supabase] Signup successful');
            return { user: data.user, session: data.session };
        } catch (error) {
            console.error('[Supabase] Signup error:', error);
            throw error;
        }
    }

    /**
     * Authentification - Connexion
     */
    async signIn(email, password) {
        try {
            const response = await fetch(
                `${this.baseUrl}/auth/v1/token?grant_type=password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error_description || 'Login failed');
            }

            const data = await response.json();
            this.auth = data;
            await indexedDBManager.saveSession(this.auth);
            console.log('[Supabase] Login successful');
            return data;
        } catch (error) {
            console.error('[Supabase] Login error:', error);
            throw error;
        }
    }

    /**
     * Déconnexion
     */
    async signOut() {
        try {
            // Fermer tous les canaux Realtime
            for (const channel of this.realtimeChannels.values()) {
                await this._unsubscribe(channel);
            }
            this.realtimeChannels.clear();

            this.auth = null;
            await indexedDBManager.deleteSession();
            this.isConnected = false;
            console.log('[Supabase] Logged out');
        } catch (error) {
            console.error('[Supabase] Logout error:', error);
            throw error;
        }
    }

    /**
     * Obtenir l'utilisateur actuel
     */
    async getCurrentUser() {
        if (!this.auth) return null;

        try {
            const response = await this._request('GET', '/auth/v1/user');
            return response;
        } catch (error) {
            console.error('[Supabase] Get user error:', error);
            return null;
        }
    }

    /**
     * Appel API REST
     */
    async _request(method, path, body = null) {
        const url = `${this.baseUrl}/rest/v1${path}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey
            }
        };

        if (this.auth?.access_token) {
            options.headers['Authorization'] = `Bearer ${this.auth.access_token}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Insérer un enregistrement
     */
    async insert(table, data) {
        try {
            const response = await this._request('POST', `/${table}`, data);
            console.log(`[Supabase] Inserted into ${table}`);
            return response;
        } catch (error) {
            console.error(`[Supabase] Insert into ${table} failed:`, error);
            throw error;
        }
    }

    /**
     * Mettre à jour un enregistrement
     */
    async update(table, data, filter) {
        try {
            let path = `/${table}?`;
            for (const [key, value] of Object.entries(filter)) {
                path += `${key}=eq.${value}&`;
            }
            path = path.slice(0, -1);  // Supprimer le dernier &

            const response = await this._request('PATCH', path, data);
            console.log(`[Supabase] Updated ${table}`);
            return response;
        } catch (error) {
            console.error(`[Supabase] Update ${table} failed:`, error);
            throw error;
        }
    }

    /**
     * Lire des enregistrements
     */
    async select(table, filters = {}) {
        try {
            let path = `/${table}?`;
            for (const [key, value] of Object.entries(filters)) {
                path += `${key}=eq.${value}&`;
            }
            if (Object.keys(filters).length > 0) {
                path = path.slice(0, -1);
            }

            const response = await this._request('GET', path);
            return response;
        } catch (error) {
            console.error(`[Supabase] Select from ${table} failed:`, error);
            throw error;
        }
    }

    /**
     * Supprimer un enregistrement
     */
    async delete(table, filter) {
        try {
            let path = `/${table}?`;
            for (const [key, value] of Object.entries(filter)) {
                path += `${key}=eq.${value}&`;
            }
            path = path.slice(0, -1);

            await this._request('DELETE', path);
            console.log(`[Supabase] Deleted from ${table}`);
        } catch (error) {
            console.error(`[Supabase] Delete from ${table} failed:`, error);
            throw error;
        }
    }

    /**
     * S'abonner à un canal Realtime (Postgres Changes)
     */
    subscribe(table, eventType, callback) {
        const channelName = `${table}:${eventType}`;
        
        // Enregistrer le callback
        if (!this.realtimeChannels.has(channelName)) {
            this.realtimeChannels.set(channelName, { callbacks: [] });
        }
        
        this.realtimeChannels.get(channelName).callbacks.push(callback);
        console.log(`[Supabase] Subscribed to ${channelName}`);

        // Retourner une fonction de désinscription
        return () => {
            const channel = this.realtimeChannels.get(channelName);
            if (channel) {
                channel.callbacks = channel.callbacks.filter(cb => cb !== callback);
                console.log(`[Supabase] Unsubscribed from ${channelName}`);
            }
        };
    }

    /**
     * Émettre un événement Broadcast
     */
    broadcastEvent(channel, event, data) {
        // Simuler le broadcast en appelant localement les callbacks
        // En production, utiliser l'API WebSocket de Supabase
        const callbacks = this.realtimeChannels.get(channel)?.callbacks || [];
        for (const callback of callbacks) {
            callback({ type: event, payload: data });
        }
    }

    /**
     * Se désabonner d'un canal
     */
    async _unsubscribe(channel) {
        // À implémenter avec WebSocket réel
    }
}

// Instance globale
const supabaseClient = new SupabaseClient();

