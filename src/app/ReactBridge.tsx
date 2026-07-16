import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppRouter } from './AppRouter';

export function mountReactBridge(element: HTMLElement): Root {
  const root = createRoot(element);

  root.render(
    <StrictMode>
      <AppRouter />
    </StrictMode>,
  );

  return root;
}
