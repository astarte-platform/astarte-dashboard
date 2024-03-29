/*
   This file is part of Astarte.

   Copyright 2020-24 SECO Mind Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   SPDX-License-Identifier: Apache-2.0
*/

import type { AstarteDataValue } from './dataType';

export interface AstartePropertiesInterfaceValues {
  [subPath: string]: AstartePropertiesInterfaceValues | AstarteDataValue;
}

export interface AstarteIndividualDatastreamInterfaceValue {
  value: AstarteDataValue;
  timestamp: string;
}
export type AstarteIndividualDatastreamInterfaceValues =
  | AstarteIndividualDatastreamInterfaceValue[]
  | {
      [subPath: string]:
        | AstarteIndividualDatastreamInterfaceValues
        | AstarteIndividualDatastreamInterfaceValue;
    };

export type AstarteAggregatedDatastreamInterfaceValue = {
  [key: string]: AstarteDataValue;
  timestamp: string;
};
export type AstarteAggregatedDatastreamInterfaceValues =
  | AstarteAggregatedDatastreamInterfaceValue
  | AstarteAggregatedDatastreamInterfaceValue[]
  | { [subPath: string]: AstarteAggregatedDatastreamInterfaceValues };

export type AstarteInterfaceValues =
  | AstartePropertiesInterfaceValues
  | AstarteIndividualDatastreamInterfaceValues
  | AstarteAggregatedDatastreamInterfaceValues;
