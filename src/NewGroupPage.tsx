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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Form, InputGroup, Spinner } from 'react-bootstrap';
import type { AstarteDevice } from 'astarte-client';

import { AlertsBanner, useAlerts } from './AlertManager';
import { useAstarte } from './AstarteManager';
import Empty from './components/Empty';
import Icon from './components/Icon';
import WaitForData from './components/WaitForData';
import useFetch from './hooks/useFetch';
import SingleCardPage from './ui/SingleCardPage';
import CheckableDeviceTable from './ui/CheckableDeviceTable';

interface GroupNameFormGroupProps {
  groupName: string;
  onGroupNameChange: (groupName: string) => void;
}

const GroupNameFormGroup = ({
  groupName,
  onGroupNameChange,
}: GroupNameFormGroupProps): React.ReactElement => {
  const isValidGroupName = !groupName.startsWith('@') && !groupName.startsWith('~');
  return (
    <Form.Group controlId="groupNameInput">
      <Form.Label>Group name</Form.Label>
      <Form.Control
        type="text"
        placeholder="Your group name"
        value={groupName}
        onChange={(e) => onGroupNameChange(e.target.value.trim())}
        autoComplete="off"
        required
        isValid={groupName !== '' && isValidGroupName}
        isInvalid={groupName !== '' && !isValidGroupName}
      />
      {!isValidGroupName && (
        <Form.Control.Feedback type="invalid">
          The group name cannot start with ~ or @.
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

interface FilterInputBoxProps {
  filter: string;
  onFilterChange: (filter: string) => void;
}

const FilterInputBox = ({ filter, onFilterChange }: FilterInputBoxProps): React.ReactElement => (
  <Form.Group>
    <Form.Label srOnly>Table filter</Form.Label>
    <InputGroup>
      <InputGroup.Prepend>
        <InputGroup.Text>
          <Icon icon="filter" />
        </InputGroup.Text>
      </InputGroup.Prepend>
      <Form.Control
        type="text"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        placeholder="Device ID/alias"
      />
    </InputGroup>
  </Form.Group>
);

export default (): React.ReactElement => {
  const [groupName, setGroupName] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<Set<AstarteDevice['id']>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const astarte = useAstarte();

  const devicesFetcher = useFetch(() =>
    astarte.client.getDevices({ details: true }).then(({ devices }) => devices),
  );
  const [formAlerts, formAlertsController] = useAlerts();
  const navigate = useNavigate();

  const createGroup = (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault();
    setIsCreatingGroup(true);
    astarte.client
      .createGroup({
        groupName,
        deviceIds: Array.from(selectedDevices),
      })
      .then(() => {
        navigate({ pathname: '/groups' });
      })
      .catch((err) => {
        formAlertsController.showError(`Could not create group: ${err.message}`);
        setIsCreatingGroup(false);
      });
  };

  const handleDeviceToggle = (deviceId: string, checked: boolean) => {
    setSelectedDevices((previousSelection) => {
      const newSelection = new Set(previousSelection);
      if (checked) {
        newSelection.add(deviceId);
      } else {
        newSelection.delete(deviceId);
      }
      return newSelection;
    });
  };

  const selectedDeviceCount = selectedDevices.size;
  const isValidGroupName =
    groupName !== '' && !groupName.startsWith('@') && !groupName.startsWith('~');
  const isValidForm = isValidGroupName && selectedDeviceCount > 0;

  return (
    <SingleCardPage title="Create a New Group" backLink="/groups">
      <AlertsBanner alerts={formAlerts} />
      <WaitForData
        data={devicesFetcher.value}
        status={devicesFetcher.status}
        fallback={
          <Container fluid className="text-center">
            <Spinner animation="border" role="status" />
          </Container>
        }
        errorFallback={
          <Empty title="Couldn't load the device list" onRetry={devicesFetcher.refresh} />
        }
      >
        {(devices) => (
          <Form onSubmit={createGroup}>
            <GroupNameFormGroup groupName={groupName} onGroupNameChange={setGroupName} />
            <div className="table-toolbar p-1">
              <span>
                {selectedDeviceCount > 0
                  ? `${selectedDeviceCount} ${
                      selectedDeviceCount === 1 ? 'device' : 'devices'
                    } selected.`
                  : 'Please select at least one device.'}
              </span>
              <div className="float-end">
                <FilterInputBox filter={deviceFilter} onFilterChange={setDeviceFilter} />
              </div>
            </div>
            <CheckableDeviceTable
              filter={deviceFilter}
              devices={devices}
              selectedDevices={selectedDevices}
              onToggleDevice={handleDeviceToggle}
            />
            <Form.Row className="flex-row-reverse pe-2">
              <Button variant="primary" type="submit" disabled={!isValidForm || isCreatingGroup}>
                {isCreatingGroup && (
                  <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                )}
                Create group
              </Button>
            </Form.Row>
          </Form>
        )}
      </WaitForData>
    </SingleCardPage>
  );
};
