-- ============================================
-- SCHÉMA SUPABASE - COMPTEUR DE POINTS V4
-- ============================================

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE: GROUPS (Groupes/Familles)
-- ============================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Code d'invitation (ex: "ABC123")
  created_by TEXT, -- Email ou ID du créateur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lire tous les groupes publiquement"
  ON public.groups FOR SELECT USING (true);

CREATE POLICY "Créer des groupes pour tous"
  ON public.groups FOR INSERT WITH CHECK (true);

CREATE POLICY "Mettre à jour les groupes pour le créateur"
  ON public.groups FOR UPDATE USING (true);

-- ============================================
-- 2. TABLE: PLAYERS (Joueurs)
-- ============================================
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6', -- Couleur HEX du joueur
  device_id TEXT, -- Identifiant unique de l'appareil
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lire tous les joueurs du groupe"
  ON public.players FOR SELECT USING (true);

CREATE POLICY "Créer des joueurs publiquement"
  ON public.players FOR INSERT WITH CHECK (true);

CREATE POLICY "Mettre à jour les joueurs"
  ON public.players FOR UPDATE USING (true);

CREATE POLICY "Supprimer les joueurs"
  ON public.players FOR DELETE USING (true);

-- Index pour améliorer les requêtes
CREATE INDEX idx_players_group_id ON public.players(group_id);

-- ============================================
-- 3. TABLE: GAMES (Parties)
-- ============================================
CREATE TYPE game_status AS ENUM ('setup', 'active', 'finished');
CREATE TYPE game_type AS ENUM ('10000', 'scrabble'); -- Extensible

CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  game_type game_type DEFAULT '10000',
  status game_status DEFAULT 'setup',
  current_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lire toutes les parties"
  ON public.games FOR SELECT USING (true);

CREATE POLICY "Créer des parties"
  ON public.games FOR INSERT WITH CHECK (true);

CREATE POLICY "Mettre à jour les parties"
  ON public.games FOR UPDATE USING (true);

CREATE INDEX idx_games_group_id ON public.games(group_id);
CREATE INDEX idx_games_status ON public.games(status);

-- ============================================
-- 4. TABLE: GAME_SCORES (Scores par joueur/partie)
-- ============================================
CREATE TABLE public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  total_score INT DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb, -- Historique [{score: 50, timestamp: ...}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_id, player_id)
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lire tous les scores"
  ON public.game_scores FOR SELECT USING (true);

CREATE POLICY "Créer des scores"
  ON public.game_scores FOR INSERT WITH CHECK (true);

CREATE POLICY "Mettre à jour les scores"
  ON public.game_scores FOR UPDATE USING (true);

CREATE INDEX idx_game_scores_game_id ON public.game_scores(game_id);
CREATE INDEX idx_game_scores_player_id ON public.game_scores(player_id);

-- ============================================
-- 5. TABLE: SCORE_HISTORY (Historique détaillé)
-- ============================================
CREATE TABLE public.score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_score_id UUID NOT NULL REFERENCES public.game_scores(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  score_added INT NOT NULL,
  turn_number INT,
  input_method TEXT, -- 'button', 'voice', 'manual'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lire tout l'historique"
  ON public.score_history FOR SELECT USING (true);

CREATE POLICY "Créer des entrées d'historique"
  ON public.score_history FOR INSERT WITH CHECK (true);

CREATE INDEX idx_score_history_game_score_id ON public.score_history(game_score_id);
CREATE INDEX idx_score_history_player_id ON public.score_history(player_id);

-- ============================================
-- 6. FONCTION: Générer code d'invitation
-- ============================================
CREATE OR REPLACE FUNCTION generate_group_code()
RETURNS TEXT AS $$
BEGIN
  RETURN SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6) | 
         UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 3));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGERS: Mise à jour de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_game_scores_updated_at
  BEFORE UPDATE ON public.game_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
