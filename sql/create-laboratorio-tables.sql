-- ============================================================================
-- LABORATORIO: Homebrew content tables
-- ============================================================================

-- Homebrew Classi
CREATE TABLE IF NOT EXISTS homebrew_classi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    dado_vita INTEGER NOT NULL DEFAULT 8,
    tiri_salvezza JSONB DEFAULT '[]',
    tipo_caster TEXT DEFAULT NULL,
    risorse_speciali JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homebrew Razze
CREATE TABLE IF NOT EXISTS homebrew_razze (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    taglia TEXT DEFAULT 'Media',
    velocita REAL DEFAULT 9,
    competenze_abilita JSONB DEFAULT '[]',
    resistenze JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homebrew Background
CREATE TABLE IF NOT EXISTS homebrew_background (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    competenze_abilita JSONB DEFAULT '[]',
    competenze_strumenti JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homebrew Incantesimi
CREATE TABLE IF NOT EXISTS homebrew_incantesimi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    livello INTEGER NOT NULL DEFAULT 0,
    scuola TEXT DEFAULT NULL,
    tempo_lancio TEXT DEFAULT NULL,
    gittata TEXT DEFAULT NULL,
    componenti TEXT DEFAULT NULL,
    durata TEXT DEFAULT NULL,
    descrizione TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homebrew Nemici (persistent enemy library)
CREATE TABLE IF NOT EXISTS homebrew_nemici (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    taglia TEXT DEFAULT 'Media',
    tipo TEXT DEFAULT NULL,
    allineamento TEXT DEFAULT NULL,
    classe_armatura INTEGER DEFAULT 10,
    punti_vita_max INTEGER DEFAULT 10,
    velocita TEXT DEFAULT '9m',
    forza INTEGER DEFAULT 10,
    destrezza INTEGER DEFAULT 10,
    costituzione INTEGER DEFAULT 10,
    intelligenza INTEGER DEFAULT 10,
    saggezza INTEGER DEFAULT 10,
    carisma INTEGER DEFAULT 10,
    grado_sfida TEXT DEFAULT '0',
    attacchi JSONB DEFAULT '[]',
    resistenze JSONB DEFAULT '[]',
    immunita JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homebrew Talenti
CREATE TABLE IF NOT EXISTS homebrew_talenti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    prerequisiti TEXT DEFAULT NULL,
    effetti TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homebrew Oggetti
CREATE TABLE IF NOT EXISTS homebrew_oggetti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT DEFAULT NULL,
    rarita TEXT DEFAULT 'Comune',
    proprieta TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MicroScheda: add tipo_scheda column to personaggi
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS tipo_scheda TEXT DEFAULT 'completa';

-- Talenti column for personaggi
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS talenti JSONB DEFAULT '[]';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE homebrew_classi ENABLE ROW LEVEL SECURITY;
ALTER TABLE homebrew_razze ENABLE ROW LEVEL SECURITY;
ALTER TABLE homebrew_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE homebrew_incantesimi ENABLE ROW LEVEL SECURITY;
ALTER TABLE homebrew_nemici ENABLE ROW LEVEL SECURITY;
ALTER TABLE homebrew_talenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE homebrew_oggetti ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'homebrew_classi','homebrew_razze','homebrew_background',
        'homebrew_incantesimi','homebrew_nemici','homebrew_talenti','homebrew_oggetti'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select', tbl);
        EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (auth.uid() = user_id)', tbl || '_select', tbl);

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_insert', tbl);
        EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl || '_insert', tbl);

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_update', tbl);
        EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (auth.uid() = user_id)', tbl || '_update', tbl);

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_delete', tbl);
        EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (auth.uid() = user_id)', tbl || '_delete', tbl);
    END LOOP;
END $$;

-- Colonne aggiuntive homebrew_nemici (allineamento app; idempotente)
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS tiri_salvezza JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS competenze_abilita JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS azioni_leggendarie JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS resistenze_leggendarie INTEGER DEFAULT 0;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS slot_incantesimo JSONB DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS caratteristica_incantatore TEXT DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS azioni_legg_max INTEGER DEFAULT 0;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS mod_iniziativa INTEGER DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS maestrie_abilita JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS dadi_vita_num INTEGER DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS dado_vita INTEGER DEFAULT NULL;
