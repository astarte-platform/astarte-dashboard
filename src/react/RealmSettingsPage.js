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

import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

import SingleCardPage from "./ui/SingleCardPage.js";

let alertId = 0;

export default ({ astarte, history }) => {
  const [alerts, setAlerts] = useState(new Map());
  const [phase, setPhase] = useState("loading");
  const [userPublicKey, setUserPublicKey] = useState("");
  const [draftPublicKey, setDraftPublicKey] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const addAlert = useCallback(
    (message) => {
      alertId += 1;
      setAlerts((alerts) => {
        const newAlerts = new Map(alerts);
        newAlerts.set(alertId, message);
        return newAlerts;
      });
    },
    [setAlerts]
  );

  const closeAlert = useCallback(
    (alertId) => {
      setAlerts((alerts) => {
        const newAlerts = new Map(alerts);
        newAlerts.delete(alertId);
        return newAlerts;
      });
    },
    [setAlerts]
  );

  const showModal = useCallback(() => setIsModalVisible(true), [
    setIsModalVisible,
  ]);

  const dismissModal = useCallback(() => setIsModalVisible(false), [
    setIsModalVisible,
  ]);

  const applyNewSettings = useCallback(() => {
    setIsUpdatingSettings(true);
    astarte
      .updateConfigAuth(draftPublicKey)
      .then(() => {
        history.push("/logout");
      })
      .catch((err) => {
        setIsUpdatingSettings(false);
        dismissModal();
        addAlert(err.message);
      });
  }, [
    setIsUpdatingSettings,
    astarte,
    draftPublicKey,
    history,
    dismissModal,
    addAlert,
  ]);

  useEffect(() => {
    astarte
      .getConfigAuth()
      .then((response) => {
        const publicKey = response.data.jwt_public_key_pem;
        setUserPublicKey(publicKey);
        setDraftPublicKey(publicKey);
        setPhase("ok");
      })
      .catch((err) => setPhase("err"));
  }, [astarte, setUserPublicKey, setDraftPublicKey, setPhase]);

  let innerHTML;

  switch (phase) {
    case "ok":
      innerHTML = (
        <Form>
          <Form.Group controlId="public-key">
            <Form.Label>Public key</Form.Label>
            <Form.Control
              as="textarea"
              className="text-monospace"
              rows="16"
              value={draftPublicKey}
              onChange={(e) => setDraftPublicKey(e.target.value)}
            />
          </Form.Group>
          {/* TODO: this action is destructive, maybe we should use danger/warning variants */}
          <Button
            variant="primary"
            disabled={draftPublicKey === userPublicKey}
            onClick={showModal}
          >
            Apply
          </Button>
        </Form>
      );
      break;

    case "err":
      innerHTML = <p>Couldn't load realm settings</p>;
      break;

    default:
      innerHTML = (
        <div>
          <Spinner animation="border" role="status" />
        </div>
      );
      break;
  }

  return (
    <SingleCardPage
      title="Realm Settings"
      errorMessages={alerts}
      onAlertClose={closeAlert}
    >
      {innerHTML}
      <ConfirmKeyChanges
        isUpdating={isUpdatingSettings}
        show={isModalVisible}
        onCancel={dismissModal}
        onConfirm={applyNewSettings}
      />
    </SingleCardPage>
  );
};

const ConfirmKeyChanges = ({ show, isUpdating, onCancel, onConfirm }) => {
  return (
    <div
      onKeyDown={(e) => {
        if (e.key == "Enter" && !isUpdating) onConfirm();
      }}
    >
      <Modal
        size="lg"
        show={show}
        onHide={onCancel}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Public Key Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Realm public key will be changed, users will not be able to make
            further API calls using their current auth token. Confirm?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isUpdating}>
            {isUpdating && (
              <Spinner
                className="mr-2"
                size="sm"
                animation="border"
                role="status"
              />
            )}
            Update settings
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
