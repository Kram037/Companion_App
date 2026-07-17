import { useLayoutEffect, type ReactNode } from 'react';

export function ReactPage({ children, name }: { children: ReactNode; name: string }) {
  useLayoutEffect(() => {
    document.body.dataset.reactOwner = name;
    return () => {
      if (document.body.dataset.reactOwner === name) delete document.body.dataset.reactOwner;
    };
  }, [name]);

  return <section className="react-page-shell page active">{children}</section>;
}
