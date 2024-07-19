/*
   This file is part of Astarte.

   Copyright 2024 SECO Mind Srl

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

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Container, Table } from 'react-bootstrap';
import {
  AstarteDataTuple,
  AstarteDatastreamIndividualData,
  AstarteDatastreamObjectData,
  AstarteInterface,
  AstarteInterfaceValues,
} from 'astarte-client';
import _ from 'lodash';

import BackButton from './ui/BackButton';
import { useAstarte } from './AstarteManager';
import { AlertsBanner, useAlerts } from 'AlertManager';
import 'react-datepicker/dist/react-datepicker.css';
import RenderAstarteData from 'components/RenderAstarteData';
import useFetch from 'hooks/useFetch';
import FilterData from 'components/FilterData';

function formatAstarteData(data?: AstarteDataTuple): string {
  if (data == null) {
    return '';
  }
  if (_.isArray(data)) {
    return JSON.stringify(data);
  }
  if (_.isBoolean(data)) {
    return data ? 'true' : 'false';
  }
  if (_.isNumber(data)) {
    return data.toString();
  }
  if (_.isNull(data)) {
    return '';
  }
  return String(data);
}

interface IndividualDatastreamTableProps {
  data: AstarteDatastreamIndividualData[];
}

const IndividualDatastreamTable = ({
  data,
}: IndividualDatastreamTableProps): React.ReactElement => {
  return (
    <Table responsive>
      <thead>
        <tr>
          <th>Path</th>
          <th>Value</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {data.map((tree) => (
          <tr key={tree.endpoint}>
            <td>{tree.endpoint}</td>
            <td>{tree.value}</td>
            <td>{new Date(tree.timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

interface ObjectDatastreamTableProps {
  data: AstarteDatastreamObjectData[];
}

const ObjectDatastreamTable = ({ data }: ObjectDatastreamTableProps): React.ReactElement => {
  const objectProperties = Object.keys(data[0].value);
  return (
    <>
      <Table responsive>
        <thead>
          <tr>
            {objectProperties.map((property) => (
              <th key={property}>{property}</th>
            ))}
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((test) => (
            <tr key={test.timestamp}>
              {objectProperties.map((property) => (
                <td key={property}>{formatAstarteData(test.value[property])}</td>
              ))}
              <td>{new Date(test.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

interface InterfaceDataProps {
  interfaceData: AstarteDatastreamIndividualData[] | AstarteDatastreamObjectData[];
  aggregation: AstarteInterface['aggregation'];
}

const InterfaceData = ({ interfaceData, aggregation }: InterfaceDataProps): React.ReactElement => {
  if (interfaceData.length === 0) {
    return <p>No data in the selected timeframe.</p>;
  } else if (aggregation === 'individual') {
    return <IndividualDatastreamTable data={interfaceData as AstarteDatastreamIndividualData[]} />;
  }
  return <ObjectDatastreamTable data={interfaceData as AstarteDatastreamObjectData[]} />;
};

export default (): React.ReactElement => {
  const { interfaceName = '', deviceId = '', interfaceMajor } = useParams();
  const astarte = useAstarte();
  const [requestingData, setRequestingData] = useState(false);
  const [fetchedData, setFetchedData] = useState<AstarteInterfaceValues>();
  const [formAlerts, formAlertsController] = useAlerts();
  const [interfaceData, setInterfaceData] = useState<AstarteInterface>();

  const deviceDataFetcher = useFetch(() =>
    astarte.client.getDeviceData({
      deviceId,
      interfaceName,
    }),
  );

  const fetchData = async (path?: string, since?: string, to?: string) => {
    setRequestingData(true);
    astarte.client
      .getDeviceData({
        deviceId,
        interfaceName,
        path,
        since,
        to,
      })
      .then((data) => {
        setFetchedData(data);
      })
      .catch((err) => {
        formAlertsController.showError(
          `Could not fetch data to interface: ${err.response.data.errors.detail}`,
        );
      })
      .finally(() => {
        setRequestingData(false);
      });
  };

  useEffect(() => {
    if (interfaceMajor) {
      const major = parseInt(interfaceMajor, 10);
      astarte.client
        .getInterface({ interfaceName, interfaceMajor: major })
        .then((data) => setInterfaceData(data));
    }
  }, []);

  return (
    <Container fluid className="p-3">
      <div className="d-flex justify-content-between">
        <h2>
          <BackButton href={`/devices/${deviceId}/interfaces/${interfaceName}/${interfaceMajor}`} />
          Interface Datastream Data
        </h2>
      </div>
      <AlertsBanner alerts={formAlerts} />
      <Card className="mt-4">
        <Card.Header>
          <span className="font-monospace">{deviceId}</span> /{interfaceName}
        </Card.Header>
        <Card.Body>
          <FilterData
            data={deviceDataFetcher.value}
            fetchData={fetchData}
            requestingData={requestingData}
          />
          {fetchedData && deviceDataFetcher.value && (
            <RenderAstarteData
              data={fetchedData}
              interfaceData={interfaceData}
              values={deviceDataFetcher.value}
            >
              {(transformedData) => (
                <InterfaceData
                  interfaceData={transformedData}
                  aggregation={interfaceData?.aggregation}
                />
              )}
            </RenderAstarteData>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};
