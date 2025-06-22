export const AstarteInterfaceSchema = {
  type: 'object',
  properties: {
    interface_name: { type: 'string' },
    version_major: { type: 'number' },
    version_minor: { type: 'number' },
    type: {
      type: 'string',
      enum: ['properties', 'datastream'],
    },
    ownership: {
      type: 'string',
      enum: ['device', 'server'],
    },
    aggregation: {
      type: 'string',
      enum: ['individual', 'object'],
    },
    mappings: { type: 'array' },
  },
  required: ['interface_name', 'version_major', 'version_minor', 'type', 'ownership'],
};

export const AstarteTriggerSchema = (
  interfacesName: string[],
  realm?: string | null,
  policiesName?: string | string[],
) => ({
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    action: {
      type: 'object',
      oneOf: [
        {
          properties: {
            amqp_exchange: {
              type: 'string',
              pattern: `^astarte_events_${realm}_.+$`,
              examples: [`astarte_events_${realm}_`],
            },
            amqp_message_expiration_ms: { type: 'number', exclusiveMinimum: 0 },
            amqp_message_persistent: { type: 'boolean' },
            amqp_routing_key: { type: 'string' },
          },
          required: ['amqp_exchange', 'amqp_message_expiration_ms', 'amqp_message_persistent'],
        },
        {
          properties: {
            http_url: { type: 'string', minLength: 8 },
            http_method: { type: 'string', enum: ['get', 'post', 'put', 'delete'] },
            ignore_ssl_errors: { type: 'boolean' },
          },
          required: ['http_url', 'http_method'],
        },
      ],
    },
    simple_triggers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['data_trigger', 'device_trigger'] },
          on: { type: 'string' },
          interface_name: { type: 'string', enum: ['*', ...interfacesName] },
          match_path: { type: 'string' },
          value_match_operator: { type: 'string', enum: ['*'] },
        },
        required: ['type'],
        allOf: [
          {
            if: {
              properties: { type: { const: 'data_trigger' } },
            },
            then: {
              properties: {
                on: { type: 'string', enum: ['incoming_data', 'value_stored'] },
                interface_name: { type: 'string', enum: ['*', ...interfacesName] },
                match_path: { type: 'string' },
                value_match_operator: { type: 'string', enum: ['*'] },
              },
              required: ['on', 'interface_name', 'match_path', 'value_match_operator'],
            },
            else: {
              properties: {
                on: {
                  type: 'string',
                  enum: [
                    'device_connected',
                    'device_disconnected',
                    'device_error',
                    'device_empty_cache_received',
                  ],
                },
              },
              required: ['on'],
            },
          },
        ],
      },
    },
    policy: { type: 'string', enum: policiesName },
  },
  required: ['name', 'action', 'simple_triggers'],
});

export const DeliveryPoliciesSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    error_handlers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          on: { type: 'string', minLength: 1, enum: ['client_error', 'server_error', 'any_error'] },
          strategy: { type: 'string', minLength: 1, enum: ['discard', 'retry'] },
        },
        required: ['on', 'strategy'],
      },
    },
    maximum_capacity: { type: 'number', exclusiveMinimum: 0 },
    event_ttl: { type: 'number' },
  },
  required: ['name', 'error_handlers', 'maximum_capacity'],
};
