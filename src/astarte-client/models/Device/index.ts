/* eslint-disable no-template-curly-in-string */
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

import * as yup from 'yup';
import _ from 'lodash';

export interface AstarteDeviceInterfaceStats {
  name: string;
  major: number;
  minor: number;
  exchangedMessages: number;
  exchangedBytes: number;
}

export interface AstarteDeviceObject {
  id: string;

  aliases: Map<string, string>;

  attributes: Map<string, string>;

  isConnected: boolean;

  introspection: Map<AstarteDeviceInterfaceStats['name'], AstarteDeviceInterfaceStats>;

  totalReceivedMessages: number;

  totalReceivedBytes: number;

  hasCredentialsInhibited: boolean;

  groups: string[];

  previousInterfaces: AstarteDeviceInterfaceStats[];

  firstRegistration?: Date;

  firstCredentialsRequest?: Date;

  lastDisconnection?: Date;

  lastConnection?: Date;

  lastSeenIp?: string;

  lastCredentialsRequestIp?: string;

  deletionInProgress: boolean;
}

const generateMapValidation =
  <K, V>(keySchema: yup.Schema<K>, valueSchema: yup.Schema<V>) =>
  (obj: unknown) =>
    _.isMap(obj) &&
    Array.from(obj.entries()).every(
      ([key, value]) => keySchema.isValidSync(key) && valueSchema.isValidSync(value),
    );

const astarteDeviceInterfaceStatsSchema = yup
  .object<AstarteDeviceInterfaceStats>({
    name: yup.string().required(),
    major: yup.number().integer().min(0).required(),
    minor: yup.number().integer().min(0).required(),
    exchangedMessages: yup.number().integer().min(0).required(),
    exchangedBytes: yup.number().integer().min(0).required(),
  })
  .required();

const astarteDeviceObjectSchema = yup
  .object<AstarteDeviceObject>({
    id: yup.string().required(),
    aliases: yup
      .mixed<AstarteDeviceObject['aliases']>()
      .required()
      .test(
        'aliases-values',
        '${path} must be a Map of string -> string',
        generateMapValidation(yup.string().required(), yup.string().required()),
      ),
    attributes: yup
      .mixed<AstarteDeviceObject['attributes']>()
      .required()
      .test(
        'attributes-values',
        '${path} must be a Map of string -> string',
        generateMapValidation(yup.string().required(), yup.string().required()),
      ),
    isConnected: yup.boolean().required(),
    introspection: yup
      .mixed<AstarteDeviceObject['introspection']>()
      .required()
      .test(
        'introspection-values',
        '${path} must be a Map of string -> interface stats object',
        generateMapValidation(yup.string().required(), astarteDeviceInterfaceStatsSchema),
      ),
    totalReceivedMessages: yup.number().integer().min(0).required(),
    totalReceivedBytes: yup.number().integer().min(0).required(),
    hasCredentialsInhibited: yup.boolean().required(),
    groups: yup.array().of(yup.string().required()).defined(),
    // @ts-expect-error TODO update yup and verify its correct typings
    previousInterfaces: yup
      .array<AstarteDeviceInterfaceStats, AstarteDeviceInterfaceStats>()
      .of(astarteDeviceInterfaceStatsSchema)
      .defined(),
    firstRegistration: yup.date().notRequired(),
    firstCredentialsRequest: yup.date().notRequired(),
    lastDisconnection: yup.date().notRequired(),
    lastConnection: yup.date().notRequired(),
    lastSeenIp: yup.string().notRequired(),
    lastCredentialsRequestIp: yup.string().notRequired(),
    deletionInProgress: yup.boolean().required(),
  })
  .required();

type AstarteDeviceStatus = 'never_connected' | 'connected' | 'disconnected' | 'in_deletion';

export class AstarteDevice {
  id: string;

  aliases: Map<string, string>;

  attributes: Map<string, string>;

  isConnected: boolean;

  introspection: Map<AstarteDeviceInterfaceStats['name'], AstarteDeviceInterfaceStats>;

  totalReceivedMessages: number;

  totalReceivedBytes: number;

  hasCredentialsInhibited: boolean;

  groups: string[];

  previousInterfaces: AstarteDeviceInterfaceStats[];

  firstRegistration?: Date;

  firstCredentialsRequest?: Date;

  lastDisconnection?: Date;

  lastConnection?: Date;

  lastSeenIp?: string;

  lastCredentialsRequestIp?: string;

  deletionInProgress: boolean;

  constructor(obj: AstarteDeviceObject) {
    const validatedObj = astarteDeviceObjectSchema.validateSync(obj);
    this.id = validatedObj.id;
    this.aliases = validatedObj.aliases;
    this.attributes = validatedObj.attributes;
    this.isConnected = validatedObj.isConnected;
    this.introspection = validatedObj.introspection;
    this.totalReceivedMessages = validatedObj.totalReceivedMessages;
    this.totalReceivedBytes = validatedObj.totalReceivedBytes;
    this.hasCredentialsInhibited = validatedObj.hasCredentialsInhibited;
    this.groups = validatedObj.groups;
    this.previousInterfaces = validatedObj.previousInterfaces;
    this.firstRegistration = validatedObj.firstRegistration;
    this.firstCredentialsRequest = validatedObj.firstCredentialsRequest;
    this.lastDisconnection = validatedObj.lastDisconnection;
    this.lastConnection = validatedObj.lastConnection;
    this.lastSeenIp = validatedObj.lastSeenIp;
    this.lastCredentialsRequestIp = validatedObj.lastCredentialsRequestIp;
    this.deletionInProgress = validatedObj.deletionInProgress;
  }

  get hasNameAlias(): boolean {
    return this.aliases.has('name');
  }

  get name(): string {
    if (this.hasNameAlias) {
      return this.aliases.get('name') as string;
    }
    return this.id;
  }

  get deviceStatus(): AstarteDeviceStatus {
    if (this.deletionInProgress) {
      return 'in_deletion';
    }
    if (this.lastConnection == null) {
      return 'never_connected';
    }
    return this.isConnected ? 'connected' : 'disconnected';
  }
}
