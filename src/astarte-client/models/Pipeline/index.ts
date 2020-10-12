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

import { AstartePipelineDTO } from '../../types';

export class AstartePipeline {
  name: string;

  description: string;

  schema: {
    [key: string]: any;
  };

  source: string;

  constructor(pipeline: AstartePipelineDTO) {
    this.name = pipeline.name;
    this.description = pipeline.description;
    this.schema = pipeline.schema;
    this.source = pipeline.source;
  }

  static fromObject(dto: AstartePipelineDTO): AstartePipeline {
    return new AstartePipeline(dto);
  }
}
