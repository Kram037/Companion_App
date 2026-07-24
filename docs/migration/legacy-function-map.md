# Legacy Function Map

Questa mappa registra i renderer principali sostituiti durante la migrazione.

| Renderer rimosso | Nuovo confine |
| --- | --- |
| `loadCampagne` | `src/api/campaignsApi.ts` + `src/features/campaigns/campaignQueries.ts` |
| `loadCampagnaDetails` | `src/features/campaigns/CampaignDetailsPage.tsx` + API/query typed |
| `renderSessioneContent` | `src/features/campaigns/SessionPage.tsx` + `src/api/sessionsApi.ts` |
| `renderCombattimentoContent` e `js/Combattimento/combat.js` | `src/features/combat/CombatPage.tsx` + API typed |
| `renderSchedaPersonaggio` | `src/features/characters/CharacterSheetPage.tsx` + `characterQuery` |
| `loadCompendio` e renderer di liste/card | `src/features/compendium/CompendiumPage.tsx` + adapter `getCompendioReact*` |
| renderer hub/lista/impostazioni Laboratorio | `src/features/laboratory/LaboratoryPage.tsx` + adapter `getLaboratorioReact*` |
| `loadAmici` e `renderAmici` | `src/features/friends/FriendsPage.tsx` + `src/api/friendsApi.ts` |
| pagina statica `personaggioCreatePage` | `src/features/characters/CharacterCreationPage.tsx` |

Il combattimento e' interamente gestito da React. L'adapter residuo espone solo
servizi generici della shell (broadcast, notifiche e apertura scheda); non
contiene mutazioni di dominio.

Per il dominio Campagna, il legacy conserva ancora le dialog condivise di
creazione/modifica/eliminazione, inviti, metriche e scelta personaggio, oltre al
prompt/submit del tiro lato giocatore. Questi punti sono adapter di
compatibilita: non devono tornare a possedere il rendering di dettaglio,
sessione o combattimento. Scelta personaggio e submit dei tiri passano
rispettivamente dalle RPC `select_personaggio_campagna`,
`submit_initiative_roll` e `submit_generic_roll`; il client non scrive
direttamente le relative tabelle.

Il frontend migrato richiede gli script indicati nella
[`../../backend/supabase/RLS_DEPLOY_CHECKLIST.md`](../../backend/supabase/RLS_DEPLOY_CHECKLIST.md)
gia applicati al database.
