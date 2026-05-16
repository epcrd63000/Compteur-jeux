# Configuration de Supabase pour Compteur de Points Multi-Jeux

## Informations du projet

- **Project Reference**: `zfsmszjrybpqnqbvkaeb`
- **Project URL**: `https://zfsmszjrybpqnqbvkaeb.supabase.co`
- **Anon Public Key**: `sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ`

## Étapes de configuration

### 1. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Cliquer sur "New Project"
3. Configurer:
   - **Project name**: "Compteur Jeux"
   - **Database password**: Générer un mot de passe fort
   - **Region**: Choisir la plus proche (ex: Europe-West)
4. Attendre 2-3 minutes que le projet soit créé

### 2. Configurer l'authentification

1. Aller à **Authentication** > **Providers**
2. Activer **Email** auth:
   - Activer le provider
   - Configurer les emails d'authentification si souhaité
3. Dans **Settings**, configurer:
   - **JWT Expiry**: 1 heure (3600 secondes)
   - **Refresh token Expiry**: 7 jours
   - **JWT Secret**: Générer si nécessaire

### 3. Initialiser le schéma de base de données

1. Aller à **SQL Editor**
2. Créer une nouvelle query
3. Copier le contenu de `database/schema.sql`
4. Exécuter la query

Cela crée:
- Table `users` pour les profils des joueurs
- Table `groups` pour les groupes/familles
- Table `games` pour les parties
- Table `score_events` pour l'historique immuable des scores
- Politiques RLS pour la sécurité

### 4. Configurer les politiques RLS

Les politiques sont incluses dans `schema.sql`. Elles garantissent:

- Les utilisateurs ne peuvent voir que leurs groupes
- Les utilisateurs ne peuvent ajouter des scores que pour leurs parties
- L'isolation complète entre les groupes

### 5. Copier les clés API

1. Aller à **Settings** > **API**
2. Copier:
   - **Project URL**: URL base pour les appels API
   - **Anon Public Key**: Clé publique pour le client web
   - **Service Role Key**: Clé secrète (NE PAS partager)

3. Mettre à jour `js/config.js`:
   ```javascript
   SUPABASE_URL: 'https://XXX.supabase.co',
   SUPABASE_KEY: 'sk_anon_XXX',
   SUPABASE_PROJECT_REF: 'XXX',
   ```

## Appels API REST

L'application utilise l'API REST de Supabase pour communiquer avec PostgreSQL.

### Exemples

```javascript
// Obtenir les utilisateurs
GET https://zfsmszjrybpqnqbvkaeb.supabase.co/rest/v1/users?select=*
Headers: apikey: sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ

// Insérer un score
POST https://zfsmszjrybpqnqbvkaeb.supabase.co/rest/v1/score_events
Headers: 
  apikey: sb_publishable_iekT5I8JuWdxT34ereMb_Q_QY2vx9pZ
  Authorization: Bearer {JWT_TOKEN}
Body: {
  "game_id": "...",
  "user_id": "...",
  "points": 100
}
```

## Sécurité

### Points importants

1. **Ne JAMAIS** commiter les clés secrètes
2. La clé "Anon Public" est publique et peut être exposée
3. Les RLS gèrent la sécurité réelle au niveau de la base de données
4. Les tokens JWT expirent et doivent être rafraîchis

### RLS (Row Level Security)

Les politiques SQL restrictives dans `schema.sql`:
- Empêchent un utilisateur d'accéder aux données d'un autre groupe
- Forcent l'authentification pour modifier les données
- Protègent contre les injections SQL via PostgREST

## Monitoring et Debugging

1. **Logs en temps réel**: Aller à **Logs** > **API requests**
2. **SQL Editor**: Tester les requêtes SQL directement
3. **Database** > **Tables**: Inspécter les données

## Limites et quotas (Plan gratuit)

- 500 MB de stockage
- 2 GB de bande passante par mois
- Jusqu'à 50 000 lignes par table
- Pas de Realtime sur le plan gratuit

Pour la production avec Realtime:
- Upgrades vers les plans payants
- Configurer Realtime dans les settings

## Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Reference API REST](https://supabase.com/docs/reference/javascript)
- [Authentification JWT](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
