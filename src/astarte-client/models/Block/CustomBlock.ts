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

import type { AstarteBlockType, AstarteCustomBlockDTO } from '../../types';

export class AstarteCustomBlock {
  name: string;

  source: string;

  type: AstarteBlockType;

  schema: Record<string, unknown>;

  constructor(block: AstarteCustomBlockDTO) {
    this.name = block.name;
    this.source = block.source;
    this.type = block.type;
    this.schema = block.schema;
  }

  static fromObject(dto: AstarteCustomBlockDTO): AstarteCustomBlock {
    return new AstarteCustomBlock(dto);
  }
}
