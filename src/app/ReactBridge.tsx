import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppProviders } from './AppProviders';
import { AppRouter } from './AppRouter';

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
