import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { appBasenameFromPath, appRoutes } from '../router';
import { LegacyNavigationSync } from './LegacyNavigationSync';

export function AppRouter() {
  return (
    <BrowserRouter basename={appBasenameFromPath(window.location.pathname)}>
      <LegacyNavigationSync />
      <Routes>
        <Route path="/" element={<Navigate replace to={appRoutes.campagne} />} />
        <Route path="*" element={null} />
      </Routes>
    </BrowserRouter>
  );
}
