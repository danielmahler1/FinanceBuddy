import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { Auth0Provider } from '@auth0/auth0-react';
import * as TanstackQuery from './integrations/root-provider';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext();

  // Use the environment variable for redirect URI to support SSR
  const redirect_uri = import.meta.env.VITE_AUTH0_CALLBACK_URL;

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <Auth0Provider
          domain={import.meta.env.VITE_AUTH0_DOMAIN}
          clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
          authorizationParams={{
            redirect_uri: redirect_uri,
          }}
        >
          <TanstackQuery.Provider {...rqContext}>
            {props.children}
          </TanstackQuery.Provider>
        </Auth0Provider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
};
