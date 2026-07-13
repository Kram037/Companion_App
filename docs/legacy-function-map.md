# Legacy Function Map

Questa mappa indica dove deve finire ogni funzione legacy durante la migrazione. Non sposta ancora il rendering esistente.

| Legacy | Nuovo confine |
| --- | --- |
| `loadCampagne` | `src/api/campaignsApi.ts` + `src/features/campaigns/campaignQueries.ts` |
| `loadCampagnaDetails` | `src/api/campaignsApi.ts` + `src/features/campaigns/campaignDetailQueries.ts` |
| `renderSessioneContent` | `src/api/sessionsApi.ts` + `activeSessionByCampaignQuery` |
| `renderCombattimentoContent` | `src/api/combatApi.ts` + `combatMonstersQuery` |
| `renderSchedaPersonaggio` | `src/api/charactersApi.ts` + futura `CharacterSheetPage` |

Regola: mentre una pagina resta legacy, React la apre via `LegacyPageAdapter`. Quando una pagina viene riscritta, il render principale passa a componenti React e la riga legacy corrispondente puo' essere rimossa.
