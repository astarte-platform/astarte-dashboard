/* eslint-disable camelcase */
/*
   This file is part of Astarte.

   Copyright 2021 Ispirata Srl

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

type DashboardAuthConfig =
  | {
      auth: [{ type: 'token' }];
      defaultAuth?: 'token';
      defaultRealm?: string;
    }
  | {
      auth: [{ type: 'oauth'; oauth_api_url?: string }];
      defaultAuth?: 'oauth';
      defaultRealm?: string;
    }
  | {
      auth: [{ type: 'token' }, { type: 'oauth'; oauth_api_url?: string }];
      defaultAuth?: 'token' | 'oauth';
      defaultRealm?: string;
    };

type DashboardConfig = {
  astarteApiUrl: string;
  appEngineApiUrl?: string;
  realmManagementApiUrl?: string;
  pairingApiUrl?: string;
  flowApiUrl?: string;
  enableFlowPreview: boolean;
} & DashboardAuthConfig;

export type { DashboardConfig };
