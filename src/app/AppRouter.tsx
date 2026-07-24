import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { CombatPage } from '../features/combat/CombatPage';
import { CampaignDetailsPage } from '../features/campaigns/CampaignDetailsPage';
import { CampaignsRoutePage } from '../features/campaigns/CampaignsRoutePage';
import { SessionPage } from '../features/campaigns/SessionPage';
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
        <Route path={appRoutes.amici} element={<FriendsPage />} />
        <Route path="*" element={null} />
      </Routes>
    </BrowserRouter>
  );
}
