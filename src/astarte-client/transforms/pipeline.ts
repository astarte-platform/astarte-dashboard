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

import _ from 'lodash';

import type { AstartePipeline } from '../models/Pipeline';
import type { AstartePipelineDTO } from '../types';

export const fromAstartePipelineDTO = (dto: AstartePipelineDTO): AstartePipeline => {
  return {
    name: dto.name,
    description: dto.description,
    schema: dto.schema || {},
    source: dto.source,
  };
};

export const toAstartePipelineDTO = (obj: AstartePipeline): AstartePipelineDTO => {
  return {
    name: obj.name,
    description: obj.description,
    schema: _.isEmpty(obj.schema) ? undefined : obj.schema,
    source: obj.source,
  };
};
