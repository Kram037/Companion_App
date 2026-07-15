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
import { appBasenameFromPath, appRoutes } from '../router';
import { LegacyNavigationSync } from './LegacyNavigationSync';

export function AppRouter() {
  return (
    <BrowserRouter basename={appBasenameFromPath(window.location.pathname)}>
      <LegacyNavigationSync />
      <Routes>
        <Route path="/" element={<Navigate replace to={appRoutes.campagne} />} />
        <Route path={appRoutes.campagne} element={<CampaignsRoutePage />} />
        <Route path={appRoutes.campagnaDetails} element={<CampaignDetailsPage />} />
        <Route path={appRoutes.sessione} element={<SessionPage />} />
        <Route path={appRoutes.combattimento} element={<CombatPage />} />
        <Route path={appRoutes.personaggi} element={<CharactersPage />} />
        <Route path={appRoutes.personaggioCreate} element={<CharacterCreationPage />} />
        <Route path={appRoutes.personaggio} element={<CharacterSheetPage />} />
        <Route path={appRoutes.compendio} element={<CompendiumPage />} />
        <Route path={appRoutes.laboratorio} element={<LaboratoryPage />} />
        <Route path={appRoutes.amici} element={<FriendsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
