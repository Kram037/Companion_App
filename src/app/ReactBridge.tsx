import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppRouter } from './AppRouter';
import { AppProviders } from './AppProviders';

export function mountReactBridge(element: HTMLElement): Root {
  const root = createRoot(element);

  root.render(
    <StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </StrictMode>,
  );

  return root;
}
