const _ = require('lodash');

describe('Login tests', () => {
  it('successfully loads', () => {
    cy.visit('/login');
  });

  context('after login pages', () => {
    beforeEach(() => {
      cy.fixture('realm').as('realm');
      cy.intercept('http://**/appengine/v1/*/stats/devices', { fixture: 'devices_stats' }).as(
        'httpRequest',
      );
      cy.intercept('https://**/appengine/v1/*/stats/devices', { fixture: 'devices_stats' }).as(
        'httpsRequest',
      );
    });

    it('successfully login', function () {
      cy.visit('/login');

      cy.get('input[id=astarteRealm]').clear().paste(this.realm.name);
      cy.get('textarea[id=astarteToken]').paste(this.realm.infinite_token);
      cy.get('.btn[type=submit]').click();

      cy.location('pathname').should('eq', '/');

      cy.get('h2').contains('Astarte Dashboard');
      cy.get('.nav-status').contains(this.realm.name);
    });

    it('use unsecure HTTP when configured to do so', function () {
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', {
        fixture: 'config/http',
      });

      cy.visit('/login');

      cy.get('input[id=astarteRealm]').clear().paste(this.realm.name);
      cy.get('textarea[id=astarteToken]').paste(this.realm.infinite_token);
      cy.get('.btn[type=submit]').click();

      cy.wait('@httpRequest');
    });

    it('use HTTPS when configured to do so', function () {
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', {
        fixture: 'config/https',
      });

      cy.visit('/login');

      cy.get('input[id=astarteRealm]').clear().paste(this.realm.name);
      cy.get('textarea[id=astarteToken]').paste(this.realm.infinite_token);
      cy.get('.btn[type=submit]').click();

      cy.wait('@httpsRequest');
    });

    it('correctly loads without Flow features when configured to do so', function () {
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', {
        fixture: 'config/flowDisabled',
      });

      cy.visit('/login');

      cy.get('input[id=astarteRealm]').clear().paste(this.realm.name);
      cy.get('textarea[id=astarteToken]').paste(this.realm.infinite_token);
      cy.get('.btn[type=submit]').click();

      cy.get('#status-card').should('not.contain', 'Flow');
      cy.get('#main-navbar').should('be.visible');
      cy.get('#main-navbar').should('not.contain', 'Flows');
      cy.get('#main-navbar').should('not.contain', 'Pipelines');
      cy.get('#main-navbar').should('not.contain', 'Blocks');
    });

    it('use custom Astarte URLs when configured to do so', function () {
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', {
        fixture: 'config/custom_urls',
      });

      cy.intercept('https://api.example.com/custom-appengine/health', '').as(
        'appEngineHealthRequest',
      );
      cy.intercept('https://api.example.com/custom-realmmanagement/health', '').as(
        'realmManagementHealthRequest',
      );
      cy.intercept('https://api.example.com/custom-pairing/health', '').as('pairingHealthRequest');
      cy.intercept('https://api.example.com/custom-flow/health', '').as('flowHealthRequest');

      cy.visit('/login');

      cy.get('input[id=astarteRealm]').clear().paste(this.realm.name);
      cy.get('textarea[id=astarteToken]').paste(this.realm.infinite_token);
      cy.get('.btn[type=submit]').click();

      cy.wait([
        '@appEngineHealthRequest',
        '@realmManagementHealthRequest',
        '@pairingHealthRequest',
        '@flowHealthRequest',
      ]);
    });

    it('saves session as a cookie after login, deletes it after logout', function () {
      cy.visit('/login');

      cy.get('input[id=astarteRealm]').clear().paste(this.realm.name);
      cy.get('textarea[id=astarteToken]').paste(this.realm.infinite_token);
      cy.get('.btn[type=submit]').click();

      cy.getCookie('session').its("value").then(decodeURIComponent).then(JSON.parse).should('deep.eq', {
        _version: 1,
        realm: this.realm.name,
        token: this.realm.infinite_token,
        authUrl: null
      })

      cy.get('#main-navbar').contains('Logout').scrollIntoView().click();

      cy.getCookie("session").should('not.exist');
    });
  });

  context('login form on multiple auth methods', () => {
    beforeEach(() => {
      cy.fixture('config/multiple_auth').as('config');
    });

    it('allows switching from OAuth to token login', function () {
      const oauthLoginConfig = {
        ...this.config,
        default_auth: 'oauth',
      };
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', oauthLoginConfig);
      cy.visit('/login');
      cy.contains('.btn-link', 'Switch to token login');
    });

    it('allows switching from token to OAuth login', function () {
      const tokenLoginConfig = {
        ...this.config,
        default_auth: 'token',
      };
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', tokenLoginConfig);
      cy.visit('/login');
      cy.contains('.btn-link', 'Switch to OAuth login');
    });
  });

  context('OAuth login', () => {
    beforeEach(() => {
      cy.fixture('config/oauth').as('config');
    });

    it('does not show OAuth URL field when already configured', function () {
      const config = _.cloneDeep(this.config);
      config.auth[0].oauth_api_url = 'http://www.oauth.example.com';
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', config);
      cy.visit('/login');

      cy.get('input[id=astarteRealm]').should('be.empty');
      cy.get('input[id=oauthProviderUrl]').should('not.exist');
    });

    /*
      TODO: reenable when cypress adds support to multi-domain testing
      see https://github.com/cypress-io/cypress/issues/944
    */
    it.skip('successfully redirect users', function () {
      cy.dynamicIntercept('getUserConfig', 'GET', '/user-config/config.json', this.config);
      cy.visit('/login');

      cy.get('input[id=astarteRealm]').clear().paste('testrealm');
      cy.get('input[id=oauthProviderUrl]').paste('http://www.oauth.example.com');
      cy.get('.btn[type=submit]').click();

      cy.url().should(
        'eq',
        'http://www.oauth.example.com/?client_id=astarte-dashboard&response_type=token&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%3Frealm%3Dtestrealm%26authUrl%3Dhttp%253A%252F%252Fwww.oauth.example.com/login',
      );
    });
  });
});
