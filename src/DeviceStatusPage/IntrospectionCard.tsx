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

import React, { useState, useEffect } from 'react';
import { Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type {
  AstarteDevice,
  AstarteDeviceInterfaceStats,
  AstarteInterfaceDescriptor,
} from 'astarte-client';
import FullHeightCard from '../components/FullHeightCard';
import { useAstarte } from 'AstarteManager';

interface IntrospectionTableProps {
  deviceId: string;
  introspection: AstarteDeviceInterfaceStats[];
  interfacesData: AstarteInterfaceDescriptor[];
}

const IntrospectionTable = ({
  deviceId,
  introspection,
  interfacesData,
}: IntrospectionTableProps): React.ReactElement => {
  const astarte = useAstarte();

  const renderInterfaceName = (iface: AstarteInterfaceDescriptor, isInstalled: boolean) => {
    if (astarte.token?.can('appEngine', 'GET', `/devices/${deviceId}/interfaces/${iface.name}`)) {
      return !isInstalled ? (
        <>
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id={`tooltip-${iface.name}`}>Interface not installed in the realm</Tooltip>
            }
          >
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle border border-danger bg-white text-danger fw-bold me-2"
              style={{
                width: '20px',
                height: '20px',
              }}
            >
              !
            </span>
          </OverlayTrigger>
          {iface.name}
        </>
      ) : (
        <Link to={`/devices/${deviceId}/interfaces/${iface.name}/${iface.major}`}>
          {iface.name}
        </Link>
      );
    }
    return iface.name;
  };

  return (
    <Table responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Major</th>
          <th>Minor</th>
        </tr>
      </thead>
      <tbody>
        {introspection.map((iface) => {
          const isInterfaceInstalled = interfacesData.some(
            (interfaceData) =>
              interfaceData.name === iface.name &&
              interfaceData.major === iface.major &&
              interfaceData.minor === iface.minor,
          );
          return (
            <tr key={iface.name}>
              <td>{renderInterfaceName(iface, isInterfaceInstalled)}</td>
              <td>{iface.major}</td>
              <td>{iface.minor}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

interface IntrospectionCardProps {
  device: AstarteDevice;
}

const IntrospectionCard = ({ device }: IntrospectionCardProps): React.ReactElement => {
  const [interfacesData, setInterfacesData] = useState<AstarteInterfaceDescriptor[]>([]);
  const introspection = Array.from(device.introspection.values()) as AstarteDeviceInterfaceStats[]; // Cast to expected type
  const astarte = useAstarte();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await astarte.client.getInterfaces();
        const fullInterfacesData: AstarteInterfaceDescriptor[] = [];

        for (const interfaceName of data) {
          const interfaceMajors = await astarte.client.getInterfaceMajors(interfaceName);

          for (const major of interfaceMajors) {
            const interfaceDetails = await astarte.client.getInterface({
              interfaceName,
              interfaceMajor: major,
            });

            fullInterfacesData.push({
              name: interfaceDetails.name,
              major: interfaceDetails.major,
              minor: interfaceDetails.minor,
            });
          }
        }
        setInterfacesData(fullInterfacesData);
      } catch (error) {
        console.error('Failed to fetch interfaces:', error);
        setInterfacesData([]);
      }
    };

    fetchData();
  }, [astarte]);

  return (
    <FullHeightCard xs={12} md={6} className="mb-4">
      <Card.Header as="h5">Interfaces</Card.Header>
      <Card.Body className="d-flex flex-column">
        {introspection.length > 0 ? (
          <IntrospectionTable
            deviceId={device.id}
            introspection={introspection}
            interfacesData={interfacesData}
          />
        ) : (
          <p>No introspection info</p>
        )}
      </Card.Body>
    </FullHeightCard>
  );
};

export default IntrospectionCard;
