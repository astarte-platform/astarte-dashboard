/*
   This file is part of Astarte.

   Copyright 2020-2024 SECO Mind Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AstarteClient, { AstarteToken } from 'astarte-client';
import _ from 'lodash';
import { useCookies } from 'react-cookie';
import type { DashboardConfig } from './types';

const parseAstarteApiUrls = (params: DashboardConfig) => {
  const { astarteApiUrl } = params;
  let appEngineApiUrl: URL;
  let realmManagementApiUrl: URL;
  let pairingApiUrl: URL;
  let flowApiUrl: URL;

  if (astarteApiUrl === 'localhost') {
    appEngineApiUrl = new URL('http://localhost:4002');
    realmManagementApiUrl = new URL('http://localhost:4000');
    pairingApiUrl = new URL('http://localhost:4003');
    flowApiUrl = new URL('http://localhost:4009');
  } else {
    appEngineApiUrl = new URL('appengine/', astarteApiUrl);
    realmManagementApiUrl = new URL('realmmanagement/', astarteApiUrl);
    pairingApiUrl = new URL('pairing/', astarteApiUrl);
    flowApiUrl = new URL('flow/', astarteApiUrl);
  }

  if (params.appEngineApiUrl) {
    appEngineApiUrl = new URL(params.appEngineApiUrl);
  }
  if (params.realmManagementApiUrl) {
    realmManagementApiUrl = new URL(params.realmManagementApiUrl);
  }
  if (params.pairingApiUrl) {
    pairingApiUrl = new URL(params.pairingApiUrl);
  }
  if (params.flowApiUrl) {
    flowApiUrl = new URL(params.flowApiUrl);
  }

  return {
    appEngineApiUrl: appEngineApiUrl.toString(),
    realmManagementApiUrl: realmManagementApiUrl.toString(),
    pairingApiUrl: pairingApiUrl.toString(),
    flowApiUrl: flowApiUrl.toString(),
  };
};

type Session = {
  realm: string;
  token: string;
  authUrl: string | null;
};

const SESSION_VERSION = 1;

type AstarteContextValue = {
  client: AstarteClient;
  realm: string | null;
  token: AstarteToken | null;
  isAuthenticated: boolean;
  login: (params: { realm: string; token: string; authUrl: string | null }) => boolean;
  logout: () => void;
};

const AstarteContext = createContext<AstarteContextValue | null>(null);

interface AstarteProviderProps {
  children: React.ReactNode;
  config: DashboardConfig;
}

const AstarteProvider = ({
  children,
  config,
  ...props
}: AstarteProviderProps): React.ReactElement => {
  const [cookie, setCookie, removeCookie] = useCookies(['session']);
  if (cookie.session?.token) {
    const tokenValidation = AstarteToken.validate(cookie.session.token ?? '');
    if (tokenValidation != 'valid') {
      removeCookie('session');
    }
  }

  const client = useMemo(() => {
    const apiConfig = parseAstarteApiUrls(config);
    const authConfig = _.pick(cookie.session, ['realm', 'token']);
    const clientConfig = _.merge({}, apiConfig, authConfig);
    return new AstarteClient(clientConfig);
  }, [config, cookie, cookie.session]);

  const updateSession = useCallback(
    (newSession: Session | null) => {
      client.setCredentials(
        newSession && {
          realm: newSession.realm,
          token: newSession.token,
        },
      );
      if (!newSession) {
        removeCookie('session');
      } else {
        setCookie('session', JSON.stringify({ ...newSession }));
      }
    },
    [client, cookie, cookie.session],
  );

  const login = useCallback(
    (params: { realm: string; token: string; authUrl: string | null }) => {
      const { realm, token, authUrl } = params;
      if (!realm || !token) {
        return false;
      }
      if (
        cookie.session?.authUrl === authUrl &&
        cookie.session.realm === realm &&
        cookie.session.token === token
      ) {
        return true;
      }
      updateSession({ realm, token, authUrl });
      return true;
    },
    [cookie, cookie.session, updateSession],
  );

  const logout = useCallback(() => updateSession(null), [updateSession]);

  const contextValue = useMemo(
    () => ({
      client,
      realm: cookie.session && cookie.session.realm,
      token: cookie.session && new AstarteToken(cookie.session.token),
      isAuthenticated: cookie.session != null,
      login,
      logout,
    }),
    [client, login, logout, cookie.session, cookie],
  );

  return (
    <AstarteContext.Provider value={contextValue} {...props}>
      {children}
    </AstarteContext.Provider>
  );
};

const useAstarte = (): AstarteContextValue => {
  const contextValue = useContext(AstarteContext);
  if (contextValue == null) {
    throw new Error('AstarteContext has not been Provided');
  }
  return contextValue;
};

export { useAstarte };

export default AstarteProvider;
