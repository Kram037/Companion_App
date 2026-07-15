import { useEffect, useLayoutEffect, useState } from 'react';

import { ReactPage } from '../../app/ReactPage';

declare global {
  interface Window {
    closePersonaggioModal?: () => void;
    pgEnsureWizardPageMount?: () => boolean;
    _pgWizardPageTitle?: string;
  }
}

export function CharacterCreationPage() {
  const [title, setTitle] = useState(() => window._pgWizardPageTitle || 'Nuovo Personaggio');

  useLayoutEffect(() => {
    window.pgEnsureWizardPageMount?.();
    return () => {
      const panel = document.getElementById('personaggioWizardPanel');
      const modal = document.getElementById('personaggioModal');
      if (panel && modal && panel.parentElement !== modal) modal.appendChild(panel);
    };
  }, []);

  useEffect(() => {
    const updateTitle = (event: Event) => {
      setTitle((event as CustomEvent<{ title?: string }>).detail?.title || 'Nuovo Personaggio');
    };
    window.addEventListener('companion:character-wizard-title', updateTitle);
    return () => window.removeEventListener('companion:character-wizard-title', updateTitle);
  }, []);

  return <ReactPage name="personaggioCreate">
    <div className="page-content personaggio-create-content" id="personaggioCreatePage">
      <div className="page-top-stack">
        <div className="page-header page-header-with-back">
          <button className="page-header-back" type="button" aria-label="Torna ai personaggi" onClick={() => window.closePersonaggioModal?.()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1>{title}</h1>
        </div>
      </div>
      <div id="personaggioCreateMount" className="personaggio-create-mount" />
    </div>
  </ReactPage>;
}
