import { BrowserRouter, Route, Routes } from 'react-router';

import { CampaignsRoutePage } from '../features/campaigns/CampaignsRoutePage';
import { CampaignDetailsPage } from '../features/campaigns/CampaignDetailsPage';
import { appBasenameFromPath } from '../router';
import { CampaignRedirect, LegacyPageAdapter } from './LegacyPageAdapter';

export function AppRouter() {
  return (
    <BrowserRouter basename={appBasenameFromPath(window.location.pathname)}>
      <Routes>
        <Route path="/" element={<CampaignRedirect />} />
        <Route path="/campagne" element={<CampaignsRoutePage />} />
        <Route path="/campagne/:campagnaId" element={<CampaignDetailsPage />} />
        <Route path="/campagne/:campagnaId/sessione" element={<LegacyPageAdapter page="sessione" />} />
        <Route path="/campagne/:campagnaId/sessione/:sessioneId/combattimento" element={<LegacyPageAdapter page="combattimento" />} />
        <Route path="/personaggi" element={<LegacyPageAdapter page="personaggi" />} />
        <Route path="/personaggi/:personaggioId" element={<LegacyPageAdapter page="scheda" />} />
        <Route path="/compendio" element={<LegacyPageAdapter page="compendio" />} />
        <Route path="/laboratorio" element={<LegacyPageAdapter page="laboratorio" />} />
        <Route path="/amici" element={<LegacyPageAdapter page="amici" />} />
      </Routes>
    </BrowserRouter>
  );
}
