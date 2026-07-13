import { BrowserRouter, Route, Routes } from 'react-router';

import { CampaignRedirect, LegacyPageAdapter } from './LegacyPageAdapter';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CampaignRedirect />} />
        <Route path="/campagne" element={<LegacyPageAdapter page="campagne" />} />
        <Route path="/campagne/:campagnaId" element={<LegacyPageAdapter page="dettagli" />} />
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
