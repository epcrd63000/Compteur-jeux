-- ============================================
-- SCHÉMA SUPABASE - COMPTEUR DE JEUX CLOUD
-- ============================================

-- 1. Table de la partie active (Scrabble et 10 000)
CREATE TABLE IF NOT EXISTS public.active_games (
    game_mode TEXT PRIMARY KEY,
    players JSONB NOT NULL,
    current_turn INT NOT NULL,
    history JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des groupes de rivalités (listes de joueurs sauvegardées)
CREATE TABLE IF NOT EXISTS public.rivalries (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    player_names TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des statistiques historiques des parties terminées
CREATE TABLE IF NOT EXISTS public.games_history (
    id BIGINT PRIMARY KEY,
    game_mode TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    winner TEXT NOT NULL,
    players JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de la sécurité Row Level Security (RLS)
ALTER TABLE public.active_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rivalries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games_history ENABLE ROW LEVEL SECURITY;

-- Création des politiques d'accès public anonyme (Lecture / Écriture sans authentification)
CREATE POLICY "Accès anonyme complet sur active_games" ON public.active_games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accès anonyme complet sur rivalries" ON public.rivalries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accès anonyme complet sur games_history" ON public.games_history FOR ALL USING (true) WITH CHECK (true);
