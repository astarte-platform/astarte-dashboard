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

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Col, Container, Form, Row, Stack } from 'react-bootstrap';
import { AstarteRealm, AstarteToken } from 'astarte-client';
import type { AuthOptions, LoginType } from 'ConfigManager';

function isValidUrl(urlString: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}

function tokenValidationFeedback(
  tokenValidation: 'expired' | 'noAstarteClaims' | 'valid' | 'invalid',
): React.ReactElement {
  let message = null;
  switch (tokenValidation) {
    case 'valid':
      return <></>;
    case 'expired': {
      message = 'Provided JWT token has expired.';
      break;
    }
    case 'noAstarteClaims': {
      message = 'Provided JWT token has no usable Astarte claims.';
      break;
    }
    case 'invalid':
    default:
      message = 'Invalid JWT token.';
  }
  return <Form.Control.Feedback type="invalid">{message}</Form.Control.Feedback>;
}

interface TokenFormProps {
  canSwitchLoginType: boolean;
  defaultRealm: string;
  onSwitchLoginType: (loginType: LoginType) => void;
}

const TokenForm = ({
  canSwitchLoginType,
  defaultRealm,
  onSwitchLoginType,
}: TokenFormProps): React.ReactElement => {
  const navigate = useNavigate();
  const [realm, setRealm] = useState(defaultRealm);
  const [jwt, setJwt] = useState('');

  const isValidRealm = AstarteRealm.isValidName(realm);

  const tokenValidation = useMemo(() => AstarteToken.validate(jwt), [jwt]);

  const canSubmitForm = isValidRealm && tokenValidation === 'valid';

  const handleTokenLogin = (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const searchParams = new URLSearchParams({ realm });
    const hashParams = new URLSearchParams({ access_token: jwt });
    navigate(`/auth?${searchParams}#${hashParams}`, { replace: true });
  };

  const AstartectlLink = () => (
    <a
      href="https://github.com/astarte-platform/astartectl#installation"
      target="_blank"
      rel="noreferrer"
    >
      astartectl
    </a>
  );

  return (
    <Form className="login-form p-3 w-100" onSubmit={handleTokenLogin}>
      <Stack gap={3}>
        <Form.Group controlId="astarteRealm">
          <Form.Label>Realm</Form.Label>
          <Form.Control
            type="text"
            placeholder="Astarte Realm"
            value={realm}
            onChange={(e) => {
              setRealm(e.target.value);
            }}
            isValid={realm !== '' && isValidRealm}
            isInvalid={realm !== '' && !isValidRealm}
            required
          />
        </Form.Group>
        <Form.Group controlId="astarteToken">
          <Form.Label>Token</Form.Label>
          <Form.Control
            as="textarea"
            rows={6}
            placeholder="Auth token"
            value={jwt}
            onChange={(e) => {
              setJwt(e.target.value.trim());
            }}
            isValid={jwt !== '' && tokenValidation === 'valid'}
            isInvalid={jwt !== '' && tokenValidation !== 'valid'}
            required
          />
          {tokenValidationFeedback(tokenValidation)}
        </Form.Group>
        <Button type="submit" variant="primary" disabled={!canSubmitForm} className="w-100">
          Login
        </Button>
        {canSwitchLoginType && (
          <div className="d-flex flex-row-reverse">
            <Button variant="link" onClick={() => onSwitchLoginType('oauth')}>
              Switch to OAuth login
            </Button>
          </div>
        )}
        <div className="container-fluid border rounded p-2 bg-light">
          A valid JWT token should be used, you can use <AstartectlLink /> to generate one:
          <br />
          <code>$ astartectl utils gen-jwt all-realm-apis -k your_key.pem</code>
        </div>
      </Stack>
    </Form>
  );
};

interface OAuthFormProps {
  canSwitchLoginType: boolean;
  defaultRealm: string;
  defaultOAuthURL: string;
  onSwitchLoginType: (loginType: LoginType) => void;
}

const OAuthForm = ({
  canSwitchLoginType,
  onSwitchLoginType,
  defaultRealm,
  defaultOAuthURL = '',
}: OAuthFormProps): React.ReactElement => {
  const [realm, setRealm] = useState(defaultRealm);
  const [providerUrl, setProviderUrl] = useState(defaultOAuthURL);
  const isValidRealm = AstarteRealm.isValidName(realm);
  const isValidProviderUrl = isValidUrl(providerUrl);

  const handleOAuthLogin = (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const dashboardLoginUrl = new URL('auth', window.location.toString());
    dashboardLoginUrl.search = new URLSearchParams({
      realm,
      authUrl: providerUrl,
    }).toString();
    const oauthLoginUrl = new URL(providerUrl);
    oauthLoginUrl.search = new URLSearchParams({
      client_id: 'astarte-dashboard',
      response_type: 'token',
      redirect_uri: dashboardLoginUrl.toString(),
    }).toString();
    window.location.href = oauthLoginUrl.toString();
  };

  return (
    <Form className="login-form p-3 w-100" onSubmit={handleOAuthLogin}>
      <Stack gap={3}>
        <Form.Group controlId="astarteRealm">
          <Form.Label>Realm</Form.Label>
          <Form.Control
            type="text"
            placeholder="Astarte Realm"
            value={realm}
            onChange={(e) => {
              setRealm(e.target.value);
            }}
            isValid={realm !== '' && isValidRealm}
            isInvalid={realm !== '' && !isValidRealm}
            required
          />
        </Form.Group>
        {!defaultOAuthURL && (
          <Form.Group controlId="oauthProviderUrl">
            <Form.Label>OAuth provider URL</Form.Label>
            <Form.Control
              type="text"
              placeholder="https://auth.example.com"
              value={providerUrl}
              onChange={(e) => {
                setProviderUrl(e.target.value);
              }}
              isValid={providerUrl !== '' && isValidProviderUrl}
              isInvalid={providerUrl !== '' && !isValidProviderUrl}
              required
            />
          </Form.Group>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={!isValidRealm || !isValidProviderUrl}
          className="w-100"
        >
          Login
        </Button>
        {canSwitchLoginType && (
          <div className="d-flex flex-row-reverse">
            <Button variant="link" onClick={() => onSwitchLoginType('token')}>
              Switch to token login
            </Button>
          </div>
        )}
      </Stack>
    </Form>
  );
};

const LeftColumn = (): React.ReactElement => (
  <Col lg={6} className="p-0 g-0 d-none d-lg-block">
    <div className="d-flex flex-column align-items-center justify-content-center position-relative login-image-container">
      <img
        src="/static/img/background-login-top.svg"
        alt="Background visual spacer"
        className="w-100 position-absolute top-background-image"
      />
      <img
        src="/static/img/background-login-bottom.svg"
        alt="Background visual spacer"
        className="w-100 position-absolute bottom-background-image"
      />
      <img src="/static/img/logo-login.svg" alt="Astarte logo" className="logo m-4" />
      <img
        src="/static/img/mascotte-computer.svg"
        alt="Astarte mascotte"
        className="mascotte m-4"
      />
    </div>
  </Col>
);

interface RightColumnProps {
  authOptions: AuthOptions;
  defaultRealm: string;
  defaultAuth: LoginType;
}

const RightColumn = ({
  authOptions,
  defaultRealm,
  defaultAuth,
}: RightColumnProps): React.ReactElement => {
  const [loginType, setLoginType] = useState(defaultAuth);
  const handleLoginTypeSwitch = (newLoginType: LoginType) => {
    setLoginType(newLoginType);
  };
  const canSwitchLoginType = authOptions.token.enabled && authOptions.oauth.enabled;

  return (
    <Col
      lg={6}
      sm={12}
      className="bg-white d-flex flex-column align-items-center justify-content-center min-vh-100"
    >
      <h1>Sign In</h1>
      {loginType === 'oauth' ? (
        <OAuthForm
          defaultRealm={defaultRealm}
          defaultOAuthURL={authOptions.oauth.oauthApiUrl || ''}
          canSwitchLoginType={canSwitchLoginType}
          onSwitchLoginType={handleLoginTypeSwitch}
        />
      ) : (
        <TokenForm
          defaultRealm={defaultRealm}
          canSwitchLoginType={canSwitchLoginType}
          onSwitchLoginType={handleLoginTypeSwitch}
        />
      )}
    </Col>
  );
};

interface Props {
  authOptions: AuthOptions;
  defaultRealm: string;
  defaultAuth: keyof AuthOptions;
}

export default ({ authOptions, defaultAuth, defaultRealm }: Props): React.ReactElement => (
  <Container fluid>
    <Row>
      <LeftColumn />
      <RightColumn
        authOptions={authOptions}
        defaultAuth={defaultAuth}
        defaultRealm={defaultRealm}
      />
    </Row>
  </Container>
);
