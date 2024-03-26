/*
   This file is part of Astarte.

   Copyright 2020-2021 Ispirata Srl

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

import React, { useMemo } from 'react';
import { BrowserRouter as RouterProvider } from 'react-router-dom';
import { Col, Container, Row } from 'react-bootstrap';
import { Provider as ReduxProvider } from 'react-redux';

import AlertsProvider from './AlertManager';
import ConfigProvider, { useConfig } from './ConfigManager';
import InterfaceEditorPage from './InterfaceEditorPage';
import Sidebar from './Sidebar';
import PageRouter from './Router';
import AstarteProvider, { useAstarte } from './AstarteManager';
import type { DashboardConfig } from './types';
import Snackbar from './ui/Snackbar';
import createReduxStore from './store';

const DashboardSidebar = () => {
  const config = useConfig();
  const astarte = useAstarte();

  if (!astarte.isAuthenticated) {
    return null;
  }

  return (
    <Col id="main-navbar" className="col-auto nav-col">
      <Sidebar>
        <Sidebar.Brand />
        <Sidebar.Item label="Home" link="/" icon="home" />
        <Sidebar.Separator />
        <Sidebar.Item label="Interfaces" link="/interfaces" icon="interfaces" />
        <Sidebar.Item label="Triggers" link="/triggers" icon="triggers" />
        <Sidebar.Item label="Delivery Policies" link="/trigger-delivery-policies" icon="policy" />
        <Sidebar.Separator />
        <Sidebar.Item label="Devices" link="/devices" icon="devices" />
        <Sidebar.Item label="Groups" link="/groups" icon="groups" />
        <Sidebar.Separator />
        {config.features.flow && (
          <>
            <Sidebar.Item label="Flows" link="/flows" icon="flows" />
            <Sidebar.Item label="Pipelines" link="/pipelines" icon="pipelines" />
            <Sidebar.Item label="Blocks" link="/blocks" icon="blocks" />
            <Sidebar.Separator />
          </>
        )}
        <Sidebar.Item label="Realm settings" link="/settings" icon="settings" />
        <Sidebar.Separator />
        <Sidebar.ApiStatus />
        <Sidebar.Separator />
        <Sidebar.Item label="Logout" link="/logout" icon="logout" />
        <Sidebar.AppInfo appVersion={import.meta.env.VITE_APP_VERSION || ''} />
      </Sidebar>
    </Col>
  );
};

const Dashboard = () => {
  const astarte = useAstarte();
  const reduxStore = useMemo(() => createReduxStore(astarte.client), [astarte.client]);
  return (
    <ReduxProvider store={reduxStore}>
      <Container fluid className="px-0">
        <Row className="g-0">
          <DashboardSidebar />
          <Col className="main-content vh-100 overflow-auto">
            <PageRouter />
          </Col>
        </Row>
      </Container>
    </ReduxProvider>
  );
};

const StandaloneEditor = () => (
  <Container fluid className="px-0">
    <Row className="g-0">
      <Col id="main-navbar" className="col-auto nav-col">
        <Sidebar>
          <Sidebar.Brand />
          <Sidebar.Item label="Interface Editor" link="/" icon="interfaces" />
        </Sidebar>
      </Col>
      <Col className="main-content vh-100 overflow-auto">
        <InterfaceEditorPage />
      </Col>
    </Row>
  </Container>
);

interface Props {
  config: DashboardConfig | null;
}

export default ({ config }: Props): React.ReactElement => (
  <AlertsProvider>
    <RouterProvider>
      {config ? (
        <ConfigProvider config={config}>
          <AstarteProvider config={config}>
            <Dashboard />
          </AstarteProvider>
        </ConfigProvider>
      ) : (
        <StandaloneEditor />
      )}
    </RouterProvider>
    <Snackbar />
  </AlertsProvider>
);
