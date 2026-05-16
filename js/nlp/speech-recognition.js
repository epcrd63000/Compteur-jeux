/**
 * Gestionnaire de reconnaissance vocale
 * Utilise la Web Speech API pour transcrire la voix en français
 */

class SpeechRecognitionManager {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
        this.isListening = false;
        this.callbacks = {
            onStart: [],
            onEnd: [],
            onResult: [],
            onError: [],
            onInterimResult: []
        };

        if (this.recognition) {
            this._setupRecognition();
        } else {
            console.warn('[SpeechRecognition] Web Speech API not supported');
        }
    }

    /**
     * Configurer la reconnaissance vocale
     */
    _setupRecognition() {
        // Configuration pour le français
        this.recognition.lang = 'fr-FR';
        this.recognition.continuous = false;  // Une phrase à la fois
        this.recognition.interimResults = true;  // Afficher les résultats provisoires
        this.recognition.maxAlternatives = 1;

        // Événement: début
        this.recognition.onstart = () => {
            this.isListening = true;
            this._triggerCallback('onStart');
            console.log('[SpeechRecognition] Listening...');
        };

        // Événement: fin
        this.recognition.onend = () => {
            this.isListening = false;
            this._triggerCallback('onEnd');
            console.log('[SpeechRecognition] Stopped');
        };

        // Événement: résultat
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                console.log('[SpeechRecognition] Final:', finalTranscript.trim());
                this._triggerCallback('onResult', { transcript: finalTranscript.trim(), isFinal: true });
            }

            if (interimTranscript) {
                this._triggerCallback('onInterimResult', { transcript: interimTranscript, isFinal: false });
            }
        };

        // Événement: erreur
        this.recognition.onerror = (event) => {
            console.error('[SpeechRecognition] Error:', event.error);
            this._triggerCallback('onError', { error: event.error });
        };
    }

    /**
     * Enregistrer un callback
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Déclencher un callback
     */
    _triggerCallback(event, data = null) {
        for (const callback of this.callbacks[event]) {
            try {
                callback(data);
            } catch (error) {
                console.error(`[SpeechRecognition] Callback error (${event}):`, error);
            }
        }
    }

    /**
     * Démarrer la reconnaissance
     */
    start() {
        if (!this.recognition) {
            console.error('[SpeechRecognition] Not supported');
            return false;
        }

        if (this.isListening) {
            console.warn('[SpeechRecognition] Already listening');
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('[SpeechRecognition] Start error:', error);
            return false;
        }
    }

    /**
     * Arrêter la reconnaissance
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            return true;
        }
        return false;
    }

    /**
     * Abandonner la reconnaissance
     */
    abort() {
        if (this.recognition) {
            this.recognition.abort();
        }
    }

    /**
     * Vérifier si la Web Speech API est supportée
     */
    isSupported() {
        return this.recognition !== null;
    }

    /**
     * Obtenir la langue actuelle
     */
    getLanguage() {
        return this.recognition ? this.recognition.lang : null;
    }

    /**
     * Définir la langue
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }
}

// Instance globale
const speechRecognitionManager = new SpeechRecognitionManager();

// Afficher un avertissement si pas supporté
if (!speechRecognitionManager.isSupported()) {
    console.warn('[SpeechRecognition] Web Speech API is not available in this browser');
}
