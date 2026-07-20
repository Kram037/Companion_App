import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { CampaignsRoutePage } from '../features/campaigns/CampaignsRoutePage';
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
        <Route path={appRoutes.amici} element={<FriendsPage />} />
        <Route path="*" element={null} />
      </Routes>
    </BrowserRouter>
  );
}
