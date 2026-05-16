/**
 * Parser de nombres français (NLP)
 * Convertit les nombres prononcés en français en entiers
 * 
 * Exemples:
 * "cent cinquante" => 150
 * "trois cent quarante" => 340
 * "quatre-vingt-dix-neuf" => 99
 * "mille deux cent trente-quatre" => 1234
 */

class FrenchNumberParser {
    constructor() {
        this.lexicon = this._buildLexicon();
    }

    /**
     * Construire le lexique français
     */
    _buildLexicon() {
        return {
            // Zéro
            'zéro': 0,
            
            // Unités (1-9)
            'un': 1,
            'une': 1,
            'deux': 2,
            'trois': 3,
            'quatre': 4,
            'cinq': 5,
            'six': 6,
            'sept': 7,
            'huit': 8,
            'neuf': 9,
            
            // Dix à dix-neuf
            'dix': 10,
            'onze': 11,
            'douze': 12,
            'treize': 13,
            'quatorze': 14,
            'quinze': 15,
            'seize': 16,
            'dix-sept': 17,
            'dixsept': 17,
            'dix-huit': 18,
            'dixhuit': 18,
            'dix-neuf': 19,
            'dixneuf': 19,
            
            // Dizaines (20-90)
            'vingt': 20,
            'trente': 30,
            'quarante': 40,
            'cinquante': 50,
            'soixante': 60,
            'soixante-dix': 70,
            'soixantedix': 70,
            'septante': 70,  // Belgique/Suisse
            'quatre-vingt': 80,
            'quatrevingt': 80,
            'huitante': 80,  // Suisse
            'quatre-vingt-dix': 90,
            'quatrevingdix': 90,
            'nonante': 90,  // Belgique/Suisse
            
            // Multiplicateurs
            'cent': 100,
            'cents': 100,
            'mille': 1000,
            'million': 1000000,
            'milliard': 1000000000,
            
            // Conjonctions et mots ignorés
            'et': null,
            'plus': null,
        };
    }

    /**
     * Parser un nombre français en entier
     */
    parse(text) {
        if (!text || typeof text !== 'string') return null;

        try {
            // Nettoyer et normaliser le texte
            let cleaned = text.toLowerCase()
                .trim()
                .replace(/[\s-]+/g, ' ')  // Normaliser les espaces et tirets
                .replace(/\s+/g, ' ');

            console.log('[FrenchNumberParser] Input:', cleaned);

            // Tokenizer
            const tokens = cleaned.split(' ').filter(t => t.length > 0);
            
            let result = this._parseTokens(tokens);
            console.log('[FrenchNumberParser] Output:', result);
            
            return result;
        } catch (error) {
            console.error('[FrenchNumberParser] Parse error:', error);
            return null;
        }
    }

    /**
     * Parser les tokens
     */
    _parseTokens(tokens) {
        let current = 0;  // Valeur courante
        let total = 0;    // Total accumulé

        for (const token of tokens) {
            const value = this.lexicon[token];

            if (value === null) {
                // Mot ignoré (et, plus, etc.)
                continue;
            }

            if (value === undefined) {
                // Token non reconnu
                console.warn('[FrenchNumberParser] Unknown token:', token);
                continue;
            }

            // Traiter les multiplicateurs
            if (value === 100) {
                // "cent"
                if (current === 0) {
                    current = 100;
                } else {
                    current *= 100;
                }
            } else if (value === 1000) {
                // "mille"
                current = (current === 0 ? 1 : current) * 1000;
                total += current;
                current = 0;
            } else if (value === 1000000) {
                // "million"
                current = (current === 0 ? 1 : current) * 1000000;
                total += current;
                current = 0;
            } else if (value === 1000000000) {
                // "milliard"
                current = (current === 0 ? 1 : current) * 1000000000;
                total += current;
                current = 0;
            } else {
                // Nombre simple ou dizaine
                current += value;
            }
        }

        // Ajouter la valeur courante au total
        total += current;

        return total;
    }

    /**
     * Valider si une chaîne ressemble à un nombre français
     */
    isNumericText(text) {
        if (!text || typeof text !== 'string') return false;
        
        const tokens = text.toLowerCase()
            .split(/[\s-]+/)
            .filter(t => t.length > 0);

        for (const token of tokens) {
            if (this.lexicon[token] !== undefined && this.lexicon[token] !== null) {
                return true;
            }
        }

        return false;
    }
}

// Instance globale
const frenchNumberParser = new FrenchNumberParser();
