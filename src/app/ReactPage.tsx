import { useEffect, type ReactNode } from 'react';

export function ReactPage({ children, name }: { children: ReactNode; name: string }) {
  useEffect(() => {
    document.body.dataset.reactPage = name;
    return () => {
      if (document.body.dataset.reactPage === name) delete document.body.dataset.reactPage;
    };
  }, [name]);

  return <section className="react-page-shell">{children}</section>;
}
