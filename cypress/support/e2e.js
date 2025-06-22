import websocketMock from './websocket';

// TODO: we're defining a dynamicIntercept command since we cannot override interceptors
// For more details see issue: https://github.com/cypress-io/cypress/issues/9302
Cypress.Commands.add('dynamicIntercept', (alias, method, url, response) => {
  const key = `${alias}-${method}-${url}`;
  const intercepts = Cypress.config('intercepts');
  if (!(key in intercepts)) {
    cy.intercept(method, url, (req) => {
      return req.reply(intercepts[key]);
    }).as(alias);
  }
  intercepts[key] = response;
});

// This hook runs before each test of every test suite
// So this query will be already mocked in every test
beforeEach(() => {
  // Reset cached intercept responses
  Cypress.config('intercepts', {});
  // unless overwritten, test expecting https connections
  cy.fixture('config/https').then((userConfig) => {
    cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', { body: userConfig });
  });
});

Cypress.Commands.add('login', () => {
  cy.fixture('realm').then((realm) => {
    const session = {
      _version: 1,
      realm: realm.name,
      token: realm.infinite_token,
    };
    cy.setCookie('session', JSON.stringify(session))
  });
});

Cypress.Commands.add('dragOnto', { prevSubject: 'element' }, (subject, targetSelector) => {
  const dataTransfer = new DataTransfer();
  cy.wrap(subject.get(0)).trigger('dragstart', { dataTransfer });
  cy.get(targetSelector).trigger('drop', { dataTransfer, force: true });
});

Cypress.Commands.add('moveTo', { prevSubject: 'element' }, (subject, diffX, diffY) => {
  return cy
    .wrap(subject.get(0))
    .trigger('mousedown', { button: 0 }, { force: true })
    .trigger('mousemove', diffX, diffY, { force: true })
    .trigger('mouseup', { force: true });
});

Cypress.Commands.add('moveOnto', { prevSubject: 'element' }, (subject, targetSelector) => {
  cy.get(targetSelector).then((target) => {
    const targetRect = target.get(0).getBoundingClientRect();
    const subjectRect = subject.get(0).getBoundingClientRect();
    const diffX = targetRect.left - subjectRect.left;
    const diffY = targetRect.top - subjectRect.top;
    cy.wrap(subject.get(0))
      .trigger('mousedown', { button: 0 }, { force: true })
      .trigger('mousemove', diffX, diffY, { force: true });
    cy.wrap(target.get(0)).trigger('mouseup', { force: true });
  });
});

Cypress.Commands.add('mockWebSocket', ({ url }) => {
  cy.on('window:before:load', (win) => {
    websocketMock.injectMock(win, url);
  });
});

Cypress.Commands.add('sendWebSocketDeviceConnected', ({ deviceId, deviceIpAddress }) => {
  cy.window().then((win) => {
    websocketMock.sendDeviceConnected(win, { deviceId, deviceIpAddress });
  });
});

Cypress.Commands.add('sendWebSocketDeviceDisconnected', ({ deviceId }) => {
  cy.window().then((win) => {
    websocketMock.sendDeviceDisconnected(win, { deviceId });
  });
});

Cypress.Commands.add('sendWebSocketDeviceEvent', ({ deviceId, event }) => {
  cy.window().then((win) => {
    websocketMock.sendDeviceEvent(win, { deviceId, event });
  });
});

Cypress.Commands.add(
  'paste',
  {
    prevSubject: true,
    element: true,
  },
  ($element, text = '') => {
    cy.get($element)
      .click()
      .then(() => {
        $element.text(text);
        $element.val(text);
        const sampleCharacter = text.length > 0 ? text[text.length - 1] : 'a';
        cy.get($element).type(`${sampleCharacter}{backspace}{movetoend}`);
      });
  },
);

Cypress.Commands.add('pasteJsonIntoEditor', ({ json_object }) => {
  cy.waitForMonacoEditor().then((editor) => {
    editor.setValue(JSON.stringify(json_object, null, 2));
  });
});

Cypress.Commands.add('waitForMonacoEditor', () => {
  cy.window().should('have.property', 'monaco').then((monaco) => {
    return new Cypress.Promise((resolve, reject) => {
      const checkEditorInitialized = () => {
        const editorModels = monaco.editor.getModels();
        if (editorModels.length > 0) {
          resolve(editorModels[0]);
        } else {
          setTimeout(checkEditorInitialized, 1000);
        }
      };
      checkEditorInitialized();
    });
  });
});

Cypress.on('uncaught:exception', (err, runnable) => {
  if (err.message.includes("Failed to execute 'importScripts' on 'WorkerGlobalScope'") &&
      err.message.includes("monaco-editor")) {
    return false;
  }
});
