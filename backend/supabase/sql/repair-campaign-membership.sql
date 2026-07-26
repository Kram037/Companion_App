-- Ripara inviti accettati che non sono stati aggiunti a campagne.giocatori.
BEGIN;

WITH accepted_players AS (
    SELECT campagna_id, ARRAY_AGG(DISTINCT invitato_id) AS player_ids
    FROM inviti_campagna
    WHERE stato = 'accepted'
    GROUP BY campagna_id
)
UPDATE campagne c
SET giocatori = ARRAY(
    SELECT DISTINCT player_id
    FROM UNNEST(
        COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[])
        || accepted_players.player_ids
    ) AS players(player_id)
    WHERE player_id IS NOT NULL
)
FROM accepted_players
WHERE c.id = accepted_players.campagna_id
  AND EXISTS (
      SELECT 1
      FROM UNNEST(accepted_players.player_ids) AS missing(player_id)
      WHERE NOT COALESCE(missing.player_id = ANY(c.giocatori), FALSE)
  );

COMMIT;

SELECT i.campagna_id, i.invitato_id
FROM inviti_campagna i
JOIN campagne c ON c.id = i.campagna_id
WHERE i.stato = 'accepted'
  AND NOT COALESCE(i.invitato_id = ANY(c.giocatori), FALSE);
