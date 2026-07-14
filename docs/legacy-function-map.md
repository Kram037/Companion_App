# Legacy Function Map

Questa mappa registra i renderer principali sostituiti durante la migrazione.

| Renderer rimosso | Nuovo confine |
| --- | --- |
| `loadCampagne` | `src/api/campaignsApi.ts` + `src/features/campaigns/campaignQueries.ts` |
| `loadCampagnaDetails` | `src/api/campaignsApi.ts` + `src/features/campaigns/campaignDetailQueries.ts` |
| `renderSessioneContent` | `src/api/sessionsApi.ts` + `activeSessionByCampaignQuery` |
| `renderSchedaPersonaggio` | `src/features/characters/CharacterSheetPage.tsx` + `characterQuery` |
| `loadCompendio` e renderer di liste/card | `src/features/compendium/CompendiumPage.tsx` + adapter `getCompendioReact*` |

Il combattimento e' gestito da `CombatPage`; il runtime legacy conserva solo dialog e mutazioni ancora richiamate dalla pagina React.
