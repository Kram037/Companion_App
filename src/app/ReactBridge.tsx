import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppProviders } from './AppProviders';

export function mountReactBridge(element: HTMLElement): Root {
  const root = createRoot(element);

  root.render(
    <StrictMode>
      <AppProviders>
        <div data-react-bridge="ready" hidden />
      </AppProviders>
    </StrictMode>,
  );

  return root;
}
