import {
  AstarteInterfaceValues,
  AstarteDatastreamIndividualData,
  AstarteDatastreamObjectData,
  AstarteDataValue,
  AstarteDataTuple,
  AstarteInterface,
} from 'astarte-client';
import _ from 'lodash';

export const transformObjectData = (
  fetchedData: AstarteInterfaceValues,
  nesto: AstarteInterfaceValues,
): AstarteDatastreamObjectData[] => {
  const result: AstarteDatastreamObjectData[] = [];

  const processNode = (node: any) => {
    if (Array.isArray(node)) {
      node.forEach((item) => processNode(item));
    } else if (node && typeof node === 'object' && node.timestamp) {
      const { timestamp, ...data } = node;
      const path = Object.keys(nesto);
      const transformedData: AstarteDatastreamObjectData = {
        endpoint: `/${path}`,
        timestamp,
        value: data,
      };
      result.push(transformedData);
    } else if (node && typeof node === 'object') {
      Object.keys(node).forEach((subPath) => {
        processNode(node[subPath]);
      });
    }
  };

  processNode(fetchedData);

  return result;
};

function mapValueToAstarteDataTuple(value: AstarteDataValue): AstarteDataTuple {
  if (_.isNumber(value)) {
    return { type: 'double', value };
  } else if (_.isBoolean(value)) {
    return { type: 'boolean', value };
  } else if (_.isString(value)) {
    return { type: 'string', value };
  } else if (_.isArray(value)) {
    if (value.length > 0) {
      if (_.isNumber(value[0])) {
        return { type: 'doublearray', value: value as number[] };
      } else if (_.isBoolean(value[0])) {
        return { type: 'booleanarray', value: value as boolean[] };
      } else if (_.isString(value[0])) {
        return { type: 'stringarray', value: value as string[] };
      }
    }
    return { type: 'binaryblobarray', value: [] };
  }
  return { type: 'binaryblob', value: null };
}

export const transformIndividualData = (
  fetchedData: AstarteInterfaceValues,
  data: AstarteInterfaceValues,
  interfaceData: AstarteInterface,
): AstarteDatastreamIndividualData[] => {
  const transformedIndividualData: AstarteDatastreamIndividualData[] = [];
  const endpoint = interfaceData.mappings[0].endpoint;
  const parts = endpoint.split('/');
  const subKey = parts[2];
  if (Array.isArray(fetchedData)) {
    fetchedData.forEach((item) => {
      if (item && typeof item === 'object' && 'timestamp' in item && 'value' in item) {
        const { timestamp, value } = item;
        const firstKey = Object.keys(data)[0];
        const astarteDataTuple = mapValueToAstarteDataTuple(value);
        const transformedData: AstarteDatastreamIndividualData = {
          endpoint: `/${firstKey}/${subKey}`,
          timestamp,
          ...astarteDataTuple,
        };
        transformedIndividualData.push(transformedData);
      }
    });
  }
  return transformedIndividualData;
};
