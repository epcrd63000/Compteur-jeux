-- ============================================================================
-- Schéma PostgreSQL pour Compteur de Points Multi-Jeux
-- Hébergé sur Supabase
-- ============================================================================

-- Assurez-vous que UTF-8 est activé
-- \encoding UTF8

-- ============================================================================
-- Table USERS - Profils des joueurs
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pseudo VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3498db',
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_pseudo ON users(pseudo);

-- ============================================================================
-- Table GROUPS - Familles ou groupes de joueurs
-- ============================================================================

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON groups(created_by);

-- ============================================================================
-- Table GROUP_MEMBERS - Appartenance des joueurs aux groupes
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members(user_id);

-- ============================================================================
-- Table GAMES - Parties en cours
-- ============================================================================

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    module_type VARCHAR(50) NOT NULL CHECK (module_type IN ('10000', 'scrabble')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX idx_games_group ON games(group_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_winner ON games(winner_id);

-- ============================================================================
-- Table SCORE_EVENTS - Registre immuable des événements de points (Event Sourcing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    is_undo BOOLEAN DEFAULT FALSE,
    is_manual_edit BOOLEAN DEFAULT FALSE,
    undo_of UUID REFERENCES score_events(id),
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_events_game ON score_events(game_id);
CREATE INDEX idx_score_events_user ON score_events(user_id);
CREATE INDEX idx_score_events_created_at ON score_events(created_at);

-- ============================================================================
-- Row Level Security (RLS) - Politiques de sécurité
-- ============================================================================

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;

-- Politiques pour USERS
CREATE POLICY "Les utilisateurs peuvent voir tous les profils"
    ON users FOR SELECT
    USING (TRUE);

CREATE POLICY "Les utilisateurs peuvent créer un profil"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur profil"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Politiques pour GROUPS
CREATE POLICY "Les utilisateurs peuvent voir les groupes auxquels ils appartiennent"
    ON groups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
        OR created_by = auth.uid()
    );

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des groupes"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Politiques pour GROUP_MEMBERS
CREATE POLICY "Les utilisateurs peuvent voir les membres de leurs groupes"
    ON group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND (
                EXISTS (
                    SELECT 1 FROM group_members gm2
                    WHERE gm2.group_id = g.id
                    AND gm2.user_id = auth.uid()
                )
                OR g.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Les créateurs de groupes peuvent ajouter des membres"
    ON group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_id
            AND groups.created_by = auth.uid()
        )
    );

-- Politiques pour GAMES
CREATE POLICY "Les joueurs d'un groupe peuvent voir ses parties"
    ON games FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = games.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Les joueurs d'un groupe peuvent créer des parties"
    ON games FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = games.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Les joueurs peuvent mettre à jour les parties"
    ON games FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = games.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Politiques pour SCORE_EVENTS
CREATE POLICY "Les joueurs d'un groupe peuvent voir les événements de score"
    ON score_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM games g
            JOIN group_members gm ON gm.group_id = g.group_id
            WHERE g.id = score_events.game_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Les joueurs d'un groupe peuvent insérer des événements de score"
    ON score_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM games g
            JOIN group_members gm ON gm.group_id = g.group_id
            WHERE g.id = score_events.game_id
            AND gm.user_id = auth.uid()
            AND g.status = 'active'
        )
        AND score_events.user_id = auth.uid()
    );

-- ============================================================================
-- Fonctions d'aide (Helpers)
-- ============================================================================

-- Fonction pour calculer le score total d'un joueur dans une partie
CREATE OR REPLACE FUNCTION get_player_score(game_id UUID, player_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        SUM(CASE 
            WHEN is_undo THEN -points 
            ELSE points 
        END),
        0
    )
    FROM score_events
    WHERE score_events.game_id = get_player_score.game_id
    AND score_events.user_id = get_player_score.player_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le score de tous les joueurs dans une partie
CREATE OR REPLACE FUNCTION get_game_scores(game_id UUID)
RETURNS TABLE (user_id UUID, total_score INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        score_events.user_id,
        COALESCE(
            SUM(CASE 
                WHEN is_undo THEN -points 
                ELSE points 
            END),
            0
        ) as total_score
    FROM score_events
    WHERE score_events.game_id = get_game_scores.game_id
    GROUP BY score_events.user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Vues (Views)
-- ============================================================================

-- Vue: Scores actuels des joueurs pour chaque partie
CREATE OR REPLACE VIEW game_player_scores AS
SELECT 
    se.game_id,
    se.user_id,
    u.pseudo,
    u.color,
    COALESCE(
        SUM(CASE 
            WHEN se.is_undo THEN -se.points 
            ELSE se.points 
        END),
        0
    ) as total_score,
    COUNT(CASE WHEN NOT se.is_undo THEN 1 END) as move_count,
    MAX(se.created_at) as last_move_at
FROM score_events se
JOIN users u ON u.id = se.user_id
GROUP BY se.game_id, se.user_id, u.pseudo, u.color;

-- Vue: Historique complet des événements de score pour debug
CREATE OR REPLACE VIEW score_events_history AS
SELECT 
    se.id,
    se.game_id,
    se.user_id,
    u.pseudo,
    se.points,
    se.is_undo,
    se.is_manual_edit,
    se.created_at,
    ROW_NUMBER() OVER (PARTITION BY se.game_id ORDER BY se.created_at) as sequence_number
FROM score_events se
JOIN users u ON u.id = se.user_id;

-- ============================================================================
-- Migrations/Tests (à exécuter une fois pour initialiser)
-- ============================================================================

-- Insérer un utilisateur de test
-- INSERT INTO users (pseudo, color) VALUES ('Test Player', '#e74c3c');

-- ============================================================================
-- Fin du schéma
-- ============================================================================
