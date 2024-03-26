/*
   This file is part of Astarte.

   Copyright 2020-2024 SECO Mind Srl

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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Spinner } from 'react-bootstrap';
import Ajv from 'ajv';
import { AstartePipeline } from 'astarte-client';
import type { AstarteBlock } from 'astarte-client';
import _ from 'lodash';

import { AlertsBanner, useAlerts } from './AlertManager';
import { useAstarte } from './AstarteManager';
import FormModal from './components/modals/Form';
import VisualFlowEditor, { getNewModel, nodeModelToSource } from './components/VisualFlowEditor';
import type NativeBlockModel from './models/NativeBlockModel';
import SingleCardPage from './ui/SingleCardPage';

const ajv = new Ajv();

interface CommandRowProps {
  className?: string;
  children: React.ReactNode;
}

const CommandRow = ({ className = '', children }: CommandRowProps): React.ReactElement => (
  <div className={['d-flex flex-row-reverse', className].join(' ')}>{children}</div>
);

const NewPipelinePage = (): React.ReactElement => {
  const [editorModel] = useState(getNewModel());
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [blocks, setBlocks] = useState<AstarteBlock[]>([]);
  const [activeModal, setActiveModal] = useState<React.ReactElement | null>(null);
  const [pipeline, setPipeline] = useState({
    name: '',
    description: '',
    source: '',
    schema: '',
  });
  const [formAlerts, formAlertsController] = useAlerts();
  const astarte = useAstarte();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    astarte.client
      .getBlocks()
      .then((astarteBlocks) => {
        if (!mounted) {
          return;
        }
        const containerBlock = astarteBlocks.find(
          (block) => block.name === 'container' && block.type === 'producer_consumer',
        );
        if (!containerBlock) {
          setBlocks(astarteBlocks);
        } else {
          const container = _.merge({}, containerBlock);
          _.unset(container, 'schema.properties.type');
          const containerProducer = _.merge({}, container, { type: 'producer' });
          const containerConsumer = _.merge({}, container, { type: 'consumer' });
          const parsedBlocks = astarteBlocks
            .filter((b) => b.name !== 'container')
            .concat([container, containerConsumer, containerProducer]);
          setBlocks(parsedBlocks);
        }
      })
      .catch((error) => {
        mounted &&
          formAlertsController.showError(`Couldn't retrieve block descriptions: ${error.message}`);
      });

    return () => {
      mounted = false;
    };
  }, [astarte.client, formAlertsController]);

  const schemaObject = useMemo(() => {
    if (pipeline.schema === '') {
      return undefined;
    }
    try {
      const schema = JSON.parse(pipeline.schema);
      return schema;
    } catch (e) {
      return undefined;
    }
  }, [pipeline.schema]);

  const createPipeline = useCallback(() => {
    setIsCreatingPipeline(true);
    astarte.client
      .registerPipeline(
        new AstartePipeline({
          name: pipeline.name,
          source: pipeline.source,
          description: pipeline.description,
          schema: schemaObject || {},
        }),
      )
      .then(() => navigate('/pipelines'))
      .catch((err) => {
        setIsCreatingPipeline(false);
        formAlertsController.showError(`Couldn't create pipeline: ${err.message}`);
      });
  }, [
    astarte.client,
    navigate,
    setIsCreatingPipeline,
    formAlertsController,
    pipeline,
    schemaObject,
  ]);

  const isValidSchema = useMemo(() => {
    if (!schemaObject) {
      return false;
    }
    try {
      ajv.compile(schemaObject);
      return true;
    } catch (e) {
      return false;
    }
  }, [schemaObject]);

  const blockSettingsClickHandler = useCallback(
    (node: NativeBlockModel) => {
      const blockDefinition = blocks.find(
        (block) => node.name === block.name && node.blockType === block.type,
      );
      if (!blockDefinition) {
        return;
      }

      editorModel.setLocked(true);

      setActiveModal(
        <FormModal
          title={`Settings for ${node.name}`}
          schema={blockDefinition.schema}
          initialData={node.getProperties()}
          confirmLabel="Apply settings"
          onCancel={() => {
            setActiveModal(null);
            editorModel.setLocked(false);
          }}
          onConfirm={(props) => {
            node.setProperties(props);
            setActiveModal(null);
            editorModel.setLocked(false);
          }}
        />,
      );
    },
    [blocks, editorModel],
  );

  const sourceConversionHandler = () => {
    try {
      const pipelineSource = nodeModelToSource(editorModel);
      setPipeline({ ...pipeline, source: pipelineSource });
    } catch (error: any) {
      formAlertsController.showError(error.message);
    }
  };

  const isValidPipelineName = pipeline.name !== '';
  const isValidSource = pipeline.source !== '';
  const isValidForm = isValidPipelineName && isValidSource;

  return (
    <SingleCardPage
      title="New Pipeline"
      backLink="/pipelines"
      docsLink="https://docs.astarte-platform.org/flow/snapshot/"
    >
      <AlertsBanner alerts={formAlerts} />
      <Form>
        <Form.Group controlId="pipeline-name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={pipeline.name}
            onChange={(e) => setPipeline({ ...pipeline, name: e.target.value })}
          />
        </Form.Group>
        {pipeline.source === '' ? (
          <>
            <Form.Group controlId="pipeline-source">
              <VisualFlowEditor
                className="mb-2"
                blocks={blocks}
                model={editorModel}
                onNodeSettingsClick={blockSettingsClickHandler}
              />
            </Form.Group>
            <CommandRow>
              <Button variant="primary" onClick={sourceConversionHandler}>
                Generate pipeline source
              </Button>
            </CommandRow>
          </>
        ) : (
          <>
            <Form.Group controlId="pipeline-source">
              <Form.Label>Source</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                spellCheck={false}
                value={pipeline.source}
                onChange={(e) => setPipeline({ ...pipeline, source: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="pipeline-schema">
              <Form.Label>Schema</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                spellCheck={false}
                value={pipeline.schema}
                isValid={pipeline.schema !== '' && isValidSchema}
                isInvalid={pipeline.schema !== '' && !isValidSchema}
                onChange={(e) => setPipeline({ ...pipeline, schema: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="pipeline-description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={pipeline.description}
                onChange={(e) => setPipeline({ ...pipeline, description: e.target.value })}
              />
            </Form.Group>
            <CommandRow>
              <Button
                variant="primary"
                onClick={createPipeline}
                disabled={!isValidForm || isCreatingPipeline}
              >
                {isCreatingPipeline && (
                  <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                )}
                Create new pipeline
              </Button>
            </CommandRow>
          </>
        )}
      </Form>
      {activeModal}
    </SingleCardPage>
  );
};

export default NewPipelinePage;
