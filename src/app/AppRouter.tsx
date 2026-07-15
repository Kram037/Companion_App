import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { appBasenameFromPath } from '../router';
import { LegacyNavigationSync } from './LegacyNavigationSync';

const CampaignsRoutePage = lazy(() => import('../features/campaigns/CampaignsRoutePage').then(module => ({ default: module.CampaignsRoutePage })));
const CampaignDetailsPage = lazy(() => import('../features/campaigns/CampaignDetailsPage').then(module => ({ default: module.CampaignDetailsPage })));
const SessionPage = lazy(() => import('../features/campaigns/SessionPage').then(module => ({ default: module.SessionPage })));
const CombatPage = lazy(() => import('../features/combat/CombatPage').then(module => ({ default: module.CombatPage })));
const CharactersPage = lazy(() => import('../features/characters/CharactersPage').then(module => ({ default: module.CharactersPage })));
const CharacterCreationPage = lazy(() => import('../features/characters/CharacterCreationPage').then(module => ({ default: module.CharacterCreationPage })));
const CharacterSheetPage = lazy(() => import('../features/characters/CharacterSheetPage').then(module => ({ default: module.CharacterSheetPage })));
const CompendiumPage = lazy(() => import('../features/compendium/CompendiumPage').then(module => ({ default: module.CompendiumPage })));
const LaboratoryPage = lazy(() => import('../features/laboratory/LaboratoryPage').then(module => ({ default: module.LaboratoryPage })));
const FriendsPage = lazy(() => import('../features/friends/FriendsPage').then(module => ({ default: module.FriendsPage })));

export function AppRouter() {
  return (
    <BrowserRouter basename={appBasenameFromPath(window.location.pathname)}>
      <LegacyNavigationSync />
      <Suspense fallback={<div className="content-placeholder"><p>Caricamento...</p></div>}>
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
      </Suspense>
    </BrowserRouter>
  );
}
