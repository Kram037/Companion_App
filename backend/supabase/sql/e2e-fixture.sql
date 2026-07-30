-- Deterministic, synthetic fixture for CompanionApp-E2E (smekahfvjbfyyoknucqe).
-- Create and auto-confirm the three Auth users in the dashboard before running.
-- No production data or credentials belong in this file.

DO $fixture$
DECLARE
    dm_uid TEXT;
    player_uid TEXT;
    external_uid TEXT;
BEGIN
    SELECT id::TEXT INTO dm_uid FROM auth.users
    WHERE email = 'companion.e2e.dm.ci+smekahfvjbfyyoknucqe@example.com';

    SELECT id::TEXT INTO player_uid FROM auth.users
    WHERE email = 'companion.e2e.player.ci+smekahfvjbfyyoknucqe@example.com';

    SELECT id::TEXT INTO external_uid FROM auth.users
    WHERE email = 'companion.e2e.external.ci+smekahfvjbfyyoknucqe@example.com';

    IF dm_uid IS NULL OR player_uid IS NULL OR external_uid IS NULL THEN
        RAISE EXCEPTION 'Create the three confirmed CompanionApp E2E Auth users first';
    END IF;

    INSERT INTO utenti (id, uid, cid, nome_utente, email)
    VALUES
        ('e2edm00001', dm_uid, 910001, 'E2E Dungeon Master', 'companion.e2e.dm.ci+smekahfvjbfyyoknucqe@example.com'),
        ('e2epl00001', player_uid, 910002, 'E2E Player', 'companion.e2e.player.ci+smekahfvjbfyyoknucqe@example.com'),
        ('e2eex00001', external_uid, 910003, 'E2E External', 'companion.e2e.external.ci+smekahfvjbfyyoknucqe@example.com')
    ON CONFLICT (id) DO UPDATE SET
        uid = EXCLUDED.uid,
        cid = EXCLUDED.cid,
        nome_utente = EXCLUDED.nome_utente,
        email = EXCLUDED.email;

    INSERT INTO campagne (id, nome_campagna, id_dm, giocatori, note)
    VALUES
        (
            'e2ecamp001',
            'E2E Realtime Campaign',
            'e2edm00001',
            ARRAY['e2epl00001']::VARCHAR(10)[],
            ARRAY['Fixture automatizzata: non usare dati reali']
        ),
        (
            'e2ecamp002',
            'E2E Empty Campaign',
            'e2edm00001',
            ARRAY[]::VARCHAR(10)[],
            ARRAY['Fixture start/stop sessione']
        )
    ON CONFLICT (id) DO UPDATE SET
        nome_campagna = EXCLUDED.nome_campagna,
        id_dm = EXCLUDED.id_dm,
        giocatori = EXCLUDED.giocatori,
        note = EXCLUDED.note;

    INSERT INTO personaggi (
        id, user_id, nome, razza, classe, livello, punti_vita_max,
        pv_attuali, classe_armatura, iniziativa, privilegi, classi
    )
    VALUES (
        'e2echar001',
        'e2epl00001',
        'E2E Sentinel',
        'Umano',
        'Guerriero',
        1,
        12,
        12,
        16,
        2,
        '{"custom_features":{"Razza":[{"name":"Fixture stabile","description":"Dati sintetici per i test di migrazione React."}]}}',
        '[{"nome":"Guerriero","livello":1}]'
    )
    ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        nome = EXCLUDED.nome,
        razza = EXCLUDED.razza,
        classe = EXCLUDED.classe,
        livello = EXCLUDED.livello,
        punti_vita_max = EXCLUDED.punti_vita_max,
        pv_attuali = EXCLUDED.pv_attuali,
        classe_armatura = EXCLUDED.classe_armatura,
        iniziativa = EXCLUDED.iniziativa,
        privilegi = EXCLUDED.privilegi,
        classi = EXCLUDED.classi;

    INSERT INTO personaggi_campagna (id, campagna_id, user_id, personaggio_id)
    VALUES ('e2epc00001', 'e2ecamp001', 'e2epl00001', 'e2echar001')
    ON CONFLICT (campagna_id, user_id) DO UPDATE
    SET personaggio_id = EXCLUDED.personaggio_id;

    INSERT INTO sessioni (id, campagna_id, note, combat_round, combat_turn_index)
    VALUES ('e2esess001', 'e2ecamp001', 'Fixture Realtime permanente', 1, 0)
    ON CONFLICT (id) DO UPDATE SET
        campagna_id = EXCLUDED.campagna_id,
        data_fine = NULL,
        durata_minuti = NULL,
        note = EXCLUDED.note,
        combat_round = 1,
        combat_turn_index = 0;

    INSERT INTO richieste_tiro_iniziativa (
        id, sessione_id, giocatore_id, valore, tiro_naturale, stato
    )
    VALUES ('e2eroll001', 'e2esess001', 'e2epl00001', 12, 10, 'completed')
    ON CONFLICT (sessione_id, giocatore_id) DO UPDATE SET
        valore = EXCLUDED.valore,
        tiro_naturale = EXCLUDED.tiro_naturale,
        stato = 'completed';

    DELETE FROM homebrew_classi WHERE nome LIKE 'E2E RLS %';
    INSERT INTO homebrew_classi (id, user_id, nome, visibility, campaign_id)
    VALUES
        ('00000000-0000-4000-8000-000000000001', dm_uid::UUID, 'E2E RLS private', 'private', NULL),
        ('00000000-0000-4000-8000-000000000002', dm_uid::UUID, 'E2E RLS campaign', 'campaign', 'e2ecamp001'),
        ('00000000-0000-4000-8000-000000000003', dm_uid::UUID, 'E2E RLS public', 'public', NULL);
END
$fixture$;
