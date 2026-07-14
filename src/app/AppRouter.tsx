import { BrowserRouter, Route, Routes } from 'react-router';

import { CampaignsRoutePage } from '../features/campaigns/CampaignsRoutePage';
import { CampaignDetailsPage } from '../features/campaigns/CampaignDetailsPage';
import { SessionPage } from '../features/campaigns/SessionPage';
import { CombatPage } from '../features/combat/CombatPage';
import { CharactersPage } from '../features/characters/CharactersPage';
import { CharacterSheetPage } from '../features/characters/CharacterSheetPage';
import { CompendiumPage } from '../features/compendium/CompendiumPage';
import { LaboratoryPage } from '../features/laboratory/LaboratoryPage';
import { appBasenameFromPath } from '../router';
import { CampaignRedirect, LegacyPageAdapter } from './LegacyPageAdapter';
import { LegacyNavigationSync } from './LegacyNavigationSync';

export function AppRouter() {
  return (
    <BrowserRouter basename={appBasenameFromPath(window.location.pathname)}>
      <LegacyNavigationSync />
      <Routes>
        <Route path="/" element={<CampaignRedirect />} />
        <Route path="/campagne" element={<CampaignsRoutePage />} />
        <Route path="/campagne/:campagnaId" element={<CampaignDetailsPage />} />
        <Route path="/campagne/:campagnaId/sessione" element={<SessionPage />} />
        <Route path="/campagne/:campagnaId/sessione/:sessioneId/combattimento" element={<CombatPage />} />
        <Route path="/personaggi" element={<CharactersPage />} />
        <Route path="/personaggi/nuovo" element={<LegacyPageAdapter page="personaggioCreate" />} />
        <Route path="/personaggi/:personaggioId" element={<CharacterSheetPage />} />
        <Route path="/compendio" element={<CompendiumPage />} />
        <Route path="/laboratorio" element={<LaboratoryPage />} />
        <Route path="/amici" element={<LegacyPageAdapter page="amici" />} />
      </Routes>
    </BrowserRouter>
  );
}
