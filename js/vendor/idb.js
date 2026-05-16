/**
 * Wrapper IndexedDB basé sur les Promesses
 * Version simplifiée de la bibliothèque "idb"
 */

const idb = (() => {
    /**
     * Ouvrir une base de données
     */
    function openDB(name, version, { upgrade } = {}) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(name, version);

            request.onerror = () => reject(request.error);
            request.onblocked = () => console.warn('DB open blocked');
            
            request.onupgradeneeded = (event) => {
                if (upgrade) {
                    upgrade(event.target.result, event.oldVersion);
                }
            };

            request.onsuccess = () => resolve(request.result);
        });
    }

    /**
     * Classe Transaction
     */
    class Transaction {
        constructor(transaction) {
            this.transaction = transaction;
        }

        objectStore(name) {
            return new ObjectStore(this.transaction.objectStore(name));
        }
    }

    /**
     * Classe ObjectStore
     */
    class ObjectStore {
        constructor(store) {
            this.store = store;
        }

        get(key) {
            return this._request(this.store.get(key));
        }

        getAll(query) {
            return this._request(this.store.getAll(query));
        }

        getAllKeys(query) {
            return this._request(this.store.getAllKeys(query));
        }

        add(value, key) {
            return this._request(this.store.add(value, key));
        }

        put(value, key) {
            return this._request(this.store.put(value, key));
        }

        delete(key) {
            return this._request(this.store.delete(key));
        }

        clear() {
            return this._request(this.store.clear());
        }

        count(query) {
            return this._request(this.store.count(query));
        }

        getKey(query) {
            return this._request(this.store.getKey(query));
        }

        _request(request) {
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
    }

    /**
     * Classe Database
     */
    class Database {
        constructor(db) {
            this.db = db;
        }

        transaction(storeNames, mode = 'readonly') {
            return new Transaction(this.db.transaction(storeNames, mode));
        }

        close() {
            this.db.close();
        }

        get version() {
            return this.db.version;
        }

        get objectStoreNames() {
            return this.db.objectStoreNames;
        }
    }

    return {
        /**
         * Ouvrir une base de données
         */
        async open(name, version, options) {
            const rawDb = await openDB(name, version, options);
            return new Database(rawDb);
        },

        /**
         * Supprimer une base de données
         */
        deleteDB(name) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(name);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    };
})();

// Export
if (typeof window !== 'undefined') {
    window.idb = idb;
}
