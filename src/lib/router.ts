import { useEffect, useState } from 'react';

export type Route =
  | 'dashboard'
  | 'analyze'
  | 'upload'
  | 'analytics'
  | 'reports'
  | 'history'
  | 'model'
  | 'settings';

const ROUTES: Route[] = ['dashboard', 'analyze', 'upload', 'analytics', 'reports', 'history', 'model', 'settings'];

function parseHash(): Route {
  const h = window.location.hash.replace('#/', '').replace('#', '') as Route;
  return ROUTES.includes(h) ? h : 'dashboard';
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: Route) => {
    window.location.hash = `/${r}`;
  };

  return { route, navigate };
}
