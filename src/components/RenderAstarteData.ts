import React from 'react';
import {
  AstarteInterfaceValues,
  AstarteDatastreamIndividualData,
  AstarteDatastreamObjectData,
  AstarteInterface,
} from 'astarte-client';
import {
  transformObjectData,
  transformIndividualData,
} from 'astarte-client/transforms/transformData';

interface RenderAstarteDataProps {
  data: AstarteInterfaceValues;
  interfaceData?: AstarteInterface;
  values: AstarteInterfaceValues;
  children: (
    data: AstarteDatastreamIndividualData[] | AstarteDatastreamObjectData[],
  ) => React.ReactElement;
}

const RenderAstarteData: React.FC<RenderAstarteDataProps> = ({
  data,
  interfaceData,
  values,
  children,
}) => {
  if (!data || !interfaceData || !values) {
    return null;
  }

  if (interfaceData.aggregation === 'object' && interfaceData.type === 'datastream') {
    const transformedObjectData = transformObjectData(data, values);
    return children(transformedObjectData);
  } else {
    const transformedIndividualData = transformIndividualData(data, values, interfaceData);
    return children(transformedIndividualData);
  }
};

export default RenderAstarteData;
