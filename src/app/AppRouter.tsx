import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { CampaignsRoutePage } from '../features/campaigns/CampaignsRoutePage';
import { CampaignDetailsPage } from '../features/campaigns/CampaignDetailsPage';
import { SessionPage } from '../features/campaigns/SessionPage';
import { CombatPage } from '../features/combat/CombatPage';
import { CharactersPage } from '../features/characters/CharactersPage';
import { CharacterCreationPage } from '../features/characters/CharacterCreationPage';
import { CharacterSheetPage } from '../features/characters/CharacterSheetPage';
import { CompendiumPage } from '../features/compendium/CompendiumPage';
import { LaboratoryPage } from '../features/laboratory/LaboratoryPage';
import { FriendsPage } from '../features/friends/FriendsPage';
import { appBasenameFromPath } from '../router';
import { LegacyNavigationSync } from './LegacyNavigationSync';

export function AppRouter() {
  return (
    <BrowserRouter basename={appBasenameFromPath(window.location.pathname)}>
      <LegacyNavigationSync />
      <Routes>
        <Route path="/" element={<Navigate replace to="/campagne" />} />
        <Route path="/campagne" element={<CampaignsRoutePage />} />
        <Route path="/campagne/:campagnaId" element={<CampaignDetailsPage />} />
        <Route path="/campagne/:campagnaId/sessione" element={<SessionPage />} />
        <Route path="/campagne/:campagnaId/sessione/:sessioneId/combattimento" element={<CombatPage />} />
        <Route path="/personaggi" element={<CharactersPage />} />
        <Route path="/personaggi/nuovo" element={<CharacterCreationPage />} />
        <Route path="/personaggi/:personaggioId" element={<CharacterSheetPage />} />
        <Route path="/compendio" element={<CompendiumPage />} />
        <Route path="/laboratorio" element={<LaboratoryPage />} />
        <Route path="/amici" element={<FriendsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
