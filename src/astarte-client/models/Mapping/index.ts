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

import { AstarteMappingDTO } from '../../types';

export class AstarteMapping {
  endpoint: string;

  type:
    | 'double'
    | 'integer'
    | 'boolean'
    | 'longinteger'
    | 'string'
    | 'binaryblob'
    | 'datetime'
    | 'doublearray'
    | 'integerarray'
    | 'booleanarray'
    | 'longintegerarray'
    | 'stringarray'
    | 'binaryblobarray'
    | 'datetimearray';

  reliability?: 'unreliable' | 'guaranteed' | 'unique';

  retention?: 'discard' | 'volatile' | 'stored';

  expiry?: number;

  databaseRetentionPolicy?: 'no_ttl' | 'use_ttl';

  databaseRetentionTtl?: number;

  allowUnset?: boolean;

  explicitTimestamp?: boolean;

  description?: string;

  documentation?: string;

  constructor(mapping: AstarteMappingDTO) {
    this.endpoint = mapping.endpoint;
    this.type = mapping.type;
    if (mapping.reliability != null) {
      this.reliability = mapping.reliability;
    }
    if (mapping.retention != null) {
      this.retention = mapping.retention;
    }
    if (mapping.expiry != null) {
      this.expiry = mapping.expiry;
    }
    if (mapping.database_retention_policy != null) {
      this.databaseRetentionPolicy = mapping.database_retention_policy;
    }
    if (mapping.database_retention_ttl != null) {
      this.databaseRetentionTtl = mapping.database_retention_ttl;
    }
    if (mapping.allow_unset != null) {
      this.allowUnset = mapping.allow_unset;
    }
    if (mapping.explicit_timestamp != null) {
      this.explicitTimestamp = mapping.explicit_timestamp;
    }
    if (mapping.description != null) {
      this.description = mapping.description;
    }
    if (mapping.doc != null) {
      this.documentation = mapping.doc;
    }
  }

  static fromObject(dto: AstarteMappingDTO): AstarteMapping {
    return new AstarteMapping(dto);
  }
}
