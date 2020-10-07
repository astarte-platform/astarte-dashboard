/* eslint-disable max-classes-per-file */
/*
   This file is part of Astarte.

   Copyright 2020 Ispirata Srl

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

import { AstarteMapping } from '../Mapping';
import { AstarteInterfaceDTO } from '../../types';

export class AstarteInterface {
  name: string;

  major: number;

  minor: number;

  type: 'properties' | 'datastream';

  ownership: 'device' | 'server';

  aggregation?: 'individual' | 'object';

  description?: string;

  documentation?: string;

  mappings: AstarteMapping[];

  constructor(iface: AstarteInterfaceDTO) {
    this.name = iface.interface_name;
    this.major = iface.version_major;
    this.minor = iface.version_minor;
    this.type = iface.type;
    this.ownership = iface.ownership;
    if (iface.type === 'datastream') {
      this.aggregation = iface.aggregation;
    }
    if (iface.description) {
      this.description = iface.description;
    }
    if (iface.doc) {
      this.documentation = iface.doc;
    }
    this.mappings = iface.mappings.map((mapping) => AstarteMapping.fromObject(mapping));
  }

  static fromObject(dto: AstarteInterfaceDTO): AstarteInterface {
    return new AstarteInterface(dto);
  }
}
