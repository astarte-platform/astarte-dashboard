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

import AstarteClient from 'astarte-client';

import {
  generateConnectedDevicesProvider,
  generateDeviceDatastreamIndividualProvider,
  generateDeviceDatastreamObjectProvider,
  generateDevicePropertyProvider,
  generateDeviceStatsProvider,
  ChartProvider,
} from './providers';

import type {
  Aggregated,
  TimestampedAggregated,
  TimestampedIndividual,
  ConnectedDevices,
  DeviceStats,
} from './dataKinds';

type AstarteConfig =
  | AstarteClient
  | {
      appEngineApiUrl: string;
      realmManagementApiUrl: string;
      token: string;
      realm: string;
    };

const getAstarteClient = (astarteConfig: AstarteConfig): AstarteClient => {
  if (astarteConfig instanceof AstarteClient) {
    return astarteConfig;
  }
  const astarteClient = new AstarteClient({
    appEngineApiUrl: astarteConfig.appEngineApiUrl,
    realmManagementApiUrl: astarteConfig.realmManagementApiUrl,
    pairingApiUrl: '',
    flowApiUrl: '',
  });
  astarteClient.setCredentials({
    token: astarteConfig.token,
    realm: astarteConfig.realm,
  });
  return astarteClient;
};

const getConnectedDevices = (
  astarteConfig: AstarteConfig,
  params: { name?: string } = {},
): ChartProvider<'Object', ConnectedDevices> =>
  generateConnectedDevicesProvider(getAstarteClient(astarteConfig), params);

const getDeviceDatastreamIndividual = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    interfaceName: string;
    endpoint: string;
  },
): ChartProvider<'Array', TimestampedIndividual> =>
  generateDeviceDatastreamIndividualProvider(getAstarteClient(astarteConfig), params);

const getDeviceDatastreamObject = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    interfaceName: string;
    endpoint: string;
  },
): ChartProvider<'Array', TimestampedAggregated> =>
  generateDeviceDatastreamObjectProvider(getAstarteClient(astarteConfig), params);

const getDeviceProperty = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    interfaceName: string;
    endpoint: string;
  },
): ChartProvider<'Object', Aggregated> =>
  generateDevicePropertyProvider(getAstarteClient(astarteConfig), params);

const getDeviceStats = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    stats?: 'exchangedBytes' | 'exchangedMessages';
  },
): ChartProvider<'Object', DeviceStats> =>
  generateDeviceStatsProvider(getAstarteClient(astarteConfig), params);

export {
  Aggregated,
  TimestampedAggregated,
  TimestampedIndividual,
  ConnectedDevices,
  DeviceStats,
} from './dataKinds';

export type { ChartData, ChartDataKind, ChartDataWrapper } from './dataKinds';

export type { ChartProvider } from './providers';

export {
  getConnectedDevices,
  getDeviceDatastreamIndividual,
  getDeviceDatastreamObject,
  getDeviceProperty,
  getDeviceStats,
};
