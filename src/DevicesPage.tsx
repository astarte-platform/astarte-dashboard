/*
   This file is part of Astarte.

   Copyright 2020-2022 Ispirata Srl

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

import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Col,
  Container,
  Form,
  Pagination,
  Row,
  Spinner,
  Stack,
  Table,
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import _ from 'lodash';
import type { AstarteDevice } from 'astarte-client';

import { Link, useNavigate } from 'react-router-dom';
import SingleCardPage from './ui/SingleCardPage';
import Empty from './components/Empty';
import Highlight from './components/Highlight';
import Icon from './components/Icon';
import WaitForData from './components/WaitForData';
import useFetch from './hooks/useFetch';
import { useAstarte } from './AstarteManager';

interface DeviceFilters {
  deviceId?: AstarteDevice['id'];
  showConnected?: boolean;
  showDisconnected?: boolean;
  showNeverConnected?: boolean;
  attributeKey?: string;
  attributeValue?: string;
  activeSinceDate?: Date;
  showDeletionInProgress?: boolean;
}

const DEVICES_PER_PAGE = 20;
const DEVICES_PER_REQUEST = 100;
const MAX_SHOWN_PAGES = 10;

const matchAttribute = (
  key: string,
  value: string,
  filterKey: string,
  filterValue: string,
): boolean => {
  if (filterKey !== '' && !key.includes(filterKey)) {
    return false;
  }
  if (filterValue !== '' && !value.includes(filterValue)) {
    return false;
  }
  return true;
};

interface MatchedAttributesProps {
  filters: DeviceFilters;
  attributes: AstarteDevice['attributes'];
}

const MatchedAttributes = ({
  filters,
  attributes,
}: MatchedAttributesProps): React.ReactElement | null => {
  const { attributeKey = '', attributeValue = '' } = filters;

  if (attributeKey === '' && attributeValue === '') {
    return null;
  }

  return (
    <>
      {Array.from(attributes)
        .filter(([key, value]) => matchAttribute(key, value, attributeKey, attributeValue))
        .map(([key, value]) => (
          <div key={key} style={{ overflowWrap: 'anywhere' }}>
            <Highlight word={attributeKey}>{key}</Highlight>
            {': '}
            <Highlight word={attributeValue}>{value}</Highlight>
          </div>
        ))}
    </>
  );
};

interface DeviceRowProps {
  device: AstarteDevice;
  filters: DeviceFilters;
}

const DeviceRow = ({ device, filters }: DeviceRowProps): React.ReactElement => {
  let lastEvent;
  let icon;
  let iconTooltip;
  let statusLabel;

  if (device.isConnected) {
    icon = 'statusConnected' as const;
    iconTooltip = 'Connected';
    statusLabel = 'Connected';
    lastEvent = `Connected on ${(device.lastConnection as Date).toLocaleString()}`;
  } else if (device.lastConnection) {
    icon = 'statusDisconnected' as const;
    iconTooltip = 'Disconnected';
    statusLabel = 'Disconnected';
    lastEvent = `Disconnected on ${(device.lastDisconnection as Date).toLocaleString()}`;
  } else {
    icon = 'statusNeverConnected' as const;
    iconTooltip = 'Never connected';
    statusLabel = 'Never connected';
    lastEvent = 'Never connected';
  }

  if (device.deletionInProgress) {
    icon = 'statusInDeletion' as const;
    iconTooltip = 'In deletion';
    statusLabel = 'In deletion';
  }

  return (
    <tr>
      <td>
        <Icon className="me-2" icon={icon} tooltip={iconTooltip} tooltipPlacement="right" />
        <span>{statusLabel}</span>
      </td>
      <td className={device.hasNameAlias ? '' : 'font-monospace'}>
        <Link to={`/devices/${device.id}/edit`}>{device.name}</Link>
        <MatchedAttributes filters={filters} attributes={device.attributes} />
      </td>
      <td>{lastEvent}</td>
    </tr>
  );
};

interface DeviceTableProps {
  deviceList: AstarteDevice[];
  filters: DeviceFilters;
}

const DeviceTable = ({ deviceList, filters }: DeviceTableProps): React.ReactElement => (
  <Table responsive>
    <thead>
      <tr>
        <th>Status</th>
        <th>Device handle</th>
        <th>Last connection event</th>
      </tr>
    </thead>
    <tbody>
      {deviceList.map((device) => (
        <DeviceRow key={device.id} device={device} filters={filters} />
      ))}
    </tbody>
  </Table>
);

const matchFilters = (device: AstarteDevice, filters: DeviceFilters) => {
  const {
    deviceId = '',
    attributeKey = '',
    attributeValue = '',
    showConnected = true,
    showDisconnected = true,
    showNeverConnected = true,
    showDeletionInProgress = true,
    activeSinceDate,
  } = filters;

  if (
    activeSinceDate != null &&
    !device.isConnected &&
    (device.lastDisconnection == null || device.lastDisconnection < activeSinceDate)
  ) {
    return false;
  }

  if (!showConnected && device.isConnected) {
    return false;
  }
  if (!showDisconnected && !device.isConnected && device.lastConnection) {
    return false;
  }
  if (!showNeverConnected && !device.isConnected && !device.lastConnection) {
    return false;
  }

  if (!showDeletionInProgress && device.deletionInProgress) {
    return false;
  }

  if (
    (attributeKey !== '' || attributeValue !== '') &&
    !Array.from(device.attributes).some(([key, value]) =>
      matchAttribute(key, value, attributeKey, attributeValue),
    )
  ) {
    return false;
  }

  if (deviceId === '') {
    return true;
  }

  const aliases = Array.from(device.aliases.values());
  return device.id.includes(deviceId) || aliases.some((alias) => alias.includes(deviceId));
};

interface TablePaginationProps {
  activePage: number;
  canLoadMorePages: boolean;
  isLoadingMorePages?: boolean;
  lastPage: number;
  onPageChange: (pageIndex: number) => void;
}

const TablePagination = ({
  activePage,
  canLoadMorePages,
  isLoadingMorePages,
  lastPage,
  onPageChange,
}: TablePaginationProps): React.ReactElement | null => {
  if (lastPage < 2 && !isLoadingMorePages) {
    return null;
  }

  let endPage = activePage + Math.floor((MAX_SHOWN_PAGES + 1) / 2);
  if (endPage < MAX_SHOWN_PAGES) {
    endPage = MAX_SHOWN_PAGES;
  }
  if (endPage > lastPage) {
    endPage = lastPage;
  }

  let startingPage = endPage - MAX_SHOWN_PAGES;
  if (startingPage < 0) {
    startingPage = 0;
  }

  const items = [];
  for (let number = startingPage; number < endPage; number += 1) {
    items.push(
      <Pagination.Item
        key={number}
        active={number === activePage}
        onClick={() => {
          onPageChange(number);
        }}
      >
        {number + 1}
      </Pagination.Item>,
    );
  }

  return (
    <Pagination>
      {startingPage > 0 && (
        <Pagination.Prev
          onClick={() => {
            onPageChange(activePage - 1);
          }}
        />
      )}
      {items}
      {(endPage < lastPage || canLoadMorePages) && (
        <Pagination.Next
          disabled={isLoadingMorePages}
          onClick={() => {
            onPageChange(activePage + 1);
          }}
        >
          {isLoadingMorePages && <Spinner animation="border" role="status" size="sm" />}
        </Pagination.Next>
      )}
    </Pagination>
  );
};

interface FilterFormProps {
  filters: DeviceFilters;
  onUpdateFilters: (filters: DeviceFilters) => void;
}

const FilterForm = ({ filters, onUpdateFilters }: FilterFormProps): React.ReactElement => {
  const {
    deviceId = '',
    showConnected = true,
    showDisconnected = true,
    showNeverConnected = true,
    showDeletionInProgress = true,
    attributeKey = '',
    attributeValue = '',
    activeSinceDate,
  } = filters;

  return (
    <Form className="p-2">
      <Stack gap={3}>
        <Form.Group controlId="filterId">
          <Form.Label>
            <b>Device ID/name</b>
          </Form.Label>
          <Form.Control
            type="text"
            value={deviceId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateFilters({ ...filters, deviceId: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group controlId="filterStatus">
          <Form.Label>
            <b>Device status</b>
          </Form.Label>
          <Form.Check
            type="checkbox"
            id="checkbox-connected"
            label="Connected"
            checked={showConnected}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateFilters({ ...filters, showConnected: e.target.checked })
            }
          />
          <Form.Check
            type="checkbox"
            id="checkbox-disconnected"
            label="Disconnected"
            checked={showDisconnected}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateFilters({ ...filters, showDisconnected: e.target.checked })
            }
          />
          <Form.Check
            type="checkbox"
            id="checkbox-never-connected"
            label="Never connected"
            checked={showNeverConnected}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateFilters({ ...filters, showNeverConnected: e.target.checked })
            }
          />
          <Form.Check
            type="checkbox"
            id="checkbox-deletion-in-progress"
            label="Deletion in progress"
            checked={showDeletionInProgress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateFilters({ ...filters, showDeletionInProgress: e.target.checked })
            }
          />
        </Form.Group>
        <Form.Group controlId="filterActiveSince">
          <Form.Label>
            <b>Active since</b>
          </Form.Label>
          <div className="d-block">
            <DatePicker
              maxDate={new Date()}
              selected={activeSinceDate}
              onChange={(date: Date) =>
                onUpdateFilters({
                  ...filters,
                  activeSinceDate: date,
                  showConnected: true,
                  showDisconnected: true,
                  showNeverConnected: true,
                })
              }
              customInput={<Form.Control type="search" />}
            />
          </div>
        </Form.Group>
        <div>
          <b>Attributes</b>
        </div>
        <Form.Group controlId="filterAttributeKey">
          <Form.Label>Key</Form.Label>
          <Form.Control
            type="text"
            value={attributeKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateFilters({ ...filters, attributeKey: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group controlId="filterAttributeValue">
          <Form.Label>Value</Form.Label>
          <Form.Control
            type="text"
            value={attributeValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateFilters({ ...filters, attributeValue: e.target.value })
            }
          />
        </Form.Group>
      </Stack>
    </Form>
  );
};

export default (): React.ReactElement => {
  const [activePage, setActivePage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();
  const astarte = useAstarte();

  const fetchDevices = useCallback(
    async (
      params: {
        fromToken?: string;
        fetchAll?: boolean;
        previousDevices?: AstarteDevice[];
      } = {},
    ): Promise<{ devices: AstarteDevice[]; nextToken: string | null }> => {
      const { devices, nextToken } = await astarte.client.getDevices({
        details: true,
        from: params.fromToken,
        limit: DEVICES_PER_REQUEST,
      });
      const updatedDevices = (params.previousDevices || []).concat(devices);
      const pageCount = Math.ceil(updatedDevices.length / DEVICES_PER_PAGE);
      const shouldLoadMore = pageCount < activePage + MAX_SHOWN_PAGES || !!params.fetchAll;
      if (shouldLoadMore && nextToken) {
        return fetchDevices({
          fromToken: nextToken,
          fetchAll: params.fetchAll,
          previousDevices: updatedDevices,
        });
      }
      return { devices: updatedDevices, nextToken };
    },
    [astarte.client, activePage],
  );

  const devicesFetcher = useFetch(fetchDevices, {});

  const pagedDevices = useMemo(() => {
    if (devicesFetcher.value == null) {
      return _.chunk([], DEVICES_PER_PAGE);
    }
    const devices = devicesFetcher.value.devices.filter((device) => matchFilters(device, filters));
    return _.chunk(devices, DEVICES_PER_PAGE);
  }, [devicesFetcher.value, filters]);

  const pageDevices = (activePage < pagedDevices.length && pagedDevices[activePage]) || [];

  const handlePageChange = (pageIndex: number) => {
    const fromToken = devicesFetcher.value?.nextToken;
    const previousDevices = devicesFetcher.value?.devices || [];
    if (pageIndex > pagedDevices.length - MAX_SHOWN_PAGES && fromToken) {
      devicesFetcher.refresh({ previousDevices, fromToken });
    }
    setActivePage(pageIndex);
  };

  const handleFilterUpdate = (newFilters: DeviceFilters) => {
    if (activePage !== 0) {
      setActivePage(0);
    }
    const fromToken = devicesFetcher.value?.nextToken;
    const previousDevices = devicesFetcher.value?.devices || [];
    if (fromToken && devicesFetcher.status !== 'loading') {
      devicesFetcher.refresh({ previousDevices, fromToken, fetchAll: true });
    }
    setFilters(newFilters);
  };

  return (
    <SingleCardPage title="Devices">
      <WaitForData
        data={devicesFetcher.value}
        status={devicesFetcher.status}
        fallback={
          <Container fluid className="text-center">
            <Spinner animation="border" role="status" />
          </Container>
        }
        errorFallback={
          <Empty title="Couldn't load the device list" onRetry={() => devicesFetcher.refresh()} />
        }
      >
        {({ devices, nextToken }) =>
          devices.length === 0 ? (
            <p>No registered devices</p>
          ) : (
            <>
              <Container fluid>
                <Row>
                  <Col>
                    {pageDevices.length === 0 ? (
                      <p>No device matches current filters</p>
                    ) : (
                      <DeviceTable deviceList={pageDevices} filters={filters} />
                    )}
                  </Col>
                  <Col xs="auto" className="p-1">
                    <div className="p-2 mb-2" onClick={() => setShowSidebar(!showSidebar)}>
                      <Icon icon="filter" className="me-1" />
                      {showSidebar && <b>Filters</b>}
                    </div>
                    {showSidebar && (
                      <FilterForm filters={filters} onUpdateFilters={handleFilterUpdate} />
                    )}
                  </Col>
                </Row>
                <Row>
                  <Col />
                  <Col>
                    <TablePagination
                      activePage={activePage}
                      canLoadMorePages={!!nextToken}
                      isLoadingMorePages={devicesFetcher.status === 'loading'}
                      lastPage={pagedDevices.length}
                      onPageChange={handlePageChange}
                    />
                  </Col>
                  <Col />
                </Row>
              </Container>
            </>
          )
        }
      </WaitForData>
      <Button
        variant="primary"
        onClick={() => {
          navigate('/devices/register');
        }}
      >
        Register a new device
      </Button>
    </SingleCardPage>
  );
};
