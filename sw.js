/**
 * Service Worker - Compteur de Points Multi-Jeux
 * 
 * Gère le caching, la synchronisation en arrière-plan et l'offline-first
 */

const CACHE_NAME = 'compteur-v1';
const RUNTIME_CACHE = 'runtime-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/config.js',
    '/js/vendor/idb.js',
    '/js/db/indexeddb.js',
    '/js/api/supabase.js',
    '/js/nlp/french-number-parser.js',
    '/js/nlp/speech-recognition.js',
    '/js/gestures/swipe-detector.js',
    '/js/modules/engine.js',
    '/js/modules/game-10000.js',
    '/js/ui/responsive.js',
    '/js/sync/realtime-sync.js',
    '/js/ui/ui-manager.js',
    '/js/main.js'
];

/**
 * Installation du Service Worker
 * Pré-cache les ressources essentielles
 */
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching core files');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Cache installation error:', err))
    );
});

/**
 * Activation du Service Worker
 * Nettoie les anciens caches
 */
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/**
 * Interception des requêtes
 * Stratégie: Stale-While-Revalidate pour l'app shell
 *             Network-First pour les API calls
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-GET
    if (request.method !== 'GET') {
        return;
    }

    // Strategy pour les ressources statiques (CSS, JS, images)
    if (isStaticAsset(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Strategy pour les appels API (Network-First)
    if (url.host !== location.host) {
        event.respondWith(networkFirst(request));
        return;
    }

    // App shell - Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request));
});

/**
 * Synchronisation en arrière-plan
 * Déclenché quand le réseau revient après une déconnexion
 */
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-scores') {
        event.waitUntil(syncScores());
    }
});

/**
 * Messages du client vers le Service Worker
 */
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/**
 * Stratégie Stale-While-Revalidate
 * Retourne le cache immédiatement, met à jour en arrière-plan
 */
function staleWhileRevalidate(request) {
    return caches.match(request).then(cachedResponse => {
        // Retourner le cache s'il existe
        if (cachedResponse) {
            // Mettre à jour en arrière-plan
            fetch(request).then(response => {
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
            }).catch(() => {
                // Erreur réseau - utiliser le cache
            });
            
            return cachedResponse;
        }

        // Pas de cache, faire la requête
        return fetch(request).then(response => {
            // Valider la réponse
            if (!response || response.status !== 200 || response.type === 'error') {
                return response;
            }

            // Cacher la réponse
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, responseToCache);
            });

            return response;
        }).catch(() => {
            // Erreur réseau et pas de cache
            return caches.match('/index.html');
        });
    });
}

/**
 * Stratégie Network-First
 * Essayer le réseau d'abord, puis le cache
 */
function networkFirst(request) {
    return fetch(request).then(response => {
        // Valider la réponse
        if (!response || response.status !== 200) {
            return response;
        }

        // Cacher la réponse valide
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
        });

        return response;
    }).catch(() => {
        // Erreur réseau - utiliser le cache
        return caches.match(request).catch(() => {
            return new Response('Offline', { status: 503 });
        });
    });
}

/**
 * Vérifier si l'URL est un asset statique
 */
function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(pathname);
}

/**
 * Synchroniser les scores depuis la file d'attente
 * Lit la sync_queue d'IndexedDB et envoie les requêtes
 */
async function syncScores() {
    console.log('[SW] Starting score synchronization...');
    
    try {
        // Ouvrir la base de données IndexedDB
        const dbRequest = indexedDB.open('compteur-db', 1);
        
        return new Promise((resolve, reject) => {
            dbRequest.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction('sync_queue', 'readonly');
                const store = transaction.objectStore('sync_queue');
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = function(event) {
                    const queuedScores = event.target.result;
                    console.log(`[SW] Found ${queuedScores.length} scores to sync`);

                    if (queuedScores.length === 0) {
                        resolve();
                        return;
                    }

                    // Envoyer les scores en séquence
                    syncScoresSequentially(queuedScores)
                        .then(resolve)
                        .catch(reject);
                };

                getAllRequest.onerror = () => reject(getAllRequest.error);
            };

            dbRequest.onerror = () => reject(dbRequest.error);
        });
    } catch (error) {
        console.error('[SW] Sync error:', error);
        throw error;
    }
}

/**
 * Envoyer les scores en séquence vers Supabase
 */
async function syncScoresSequentially(scores) {
    const SUPABASE_URL = 'https://zfsmszjrybpqnqbvkaeb.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ';

    for (const scoreEvent of scores) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/score_events`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${await getAuthToken()}`
                    },
                    body: JSON.stringify(scoreEvent)
                }
            );

            if (response.ok) {
                console.log('[SW] Score synced:', scoreEvent.id);
                // Supprimer de la file d'attente
                await removeFromSyncQueue(scoreEvent.id);
            } else {
                console.error('[SW] Sync failed for score:', scoreEvent.id);
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('[SW] Error syncing score:', error);
            // Conserver dans la file d'attente pour nouvelle tentative
            break;
        }
    }
}

/**
 * Récupérer le token d'authentification depuis IndexedDB
 */
async function getAuthToken() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('compteur-db', 1);
        
        dbRequest.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction('local_auth', 'readonly');
            const store = transaction.objectStore('local_auth');
            const getRequest = store.get('session');

            getRequest.onsuccess = function(event) {
                const session = event.target.result;
                if (session && session.access_token) {
                    resolve(session.access_token);
                } else {
                    reject(new Error('No auth token found'));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        };

        dbRequest.onerror = () => reject(dbRequest.error);
    });
}

/**
 * Supprimer un score de la file d'attente
 */
async function removeFromSyncQueue(scoreId) {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('compteur-db', 1);
        
        dbRequest.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction('sync_queue', 'readwrite');
            const store = transaction.objectStore('sync_queue');
            const deleteRequest = store.delete(scoreId);

            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };

        dbRequest.onerror = () => reject(dbRequest.error);
    });
}

console.log('[SW] Service Worker loaded');
