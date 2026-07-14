# Legacy Function Map

Questa mappa registra i renderer principali sostituiti durante la migrazione.

| Renderer rimosso | Nuovo confine |
| --- | --- |
| `loadCampagne` | `src/api/campaignsApi.ts` + `src/features/campaigns/campaignQueries.ts` |
| `loadCampagnaDetails` | `src/api/campaignsApi.ts` + `src/features/campaigns/campaignDetailQueries.ts` |
| `renderSessioneContent` | `src/api/sessionsApi.ts` + `activeSessionByCampaignQuery` |
| `renderSchedaPersonaggio` | `src/features/characters/CharacterSheetPage.tsx` + `characterQuery` |

`renderCombattimentoContent` resta temporaneamente un bridge di invalidazione; la UI e' gia' in `CombatPage`.
