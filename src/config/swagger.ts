import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'urmovierates API',
      version: '1.0.0',
      description:
        'REST API for movie reviews and ratings. Two authentication layers: (1) `X-API-Key` header on every protected route, (2) JWT Bearer token from /api/auth/login for user-scoped operations.',
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT access token returned by /api/auth/login or /api/auth/refresh. Use the form "Bearer {token}".',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description:
            'Shared secret defined in the API_KEY environment variable. Send as `X-API-Key: <value>`. Required for all routes except /api/auth/{login,register,refresh,forgot-password,reset-password}, /health and /api-docs.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
        Unauthorized: {
          description: 'Missing or invalid token / API key',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              examples: {
                api_key_missing: {
                  summary: 'Missing X-API-Key',
                  value: { error: 'X-API-Key header is required', code: 'API_KEY_MISSING' },
                },
                api_key_invalid: {
                  summary: 'Invalid X-API-Key',
                  value: { error: 'Invalid X-API-Key', code: 'API_KEY_FORBIDDEN' },
                },
                token_missing: {
                  summary: 'Missing JWT',
                  value: { error: 'Authentication required', code: 'AUTH_MISSING' },
                },
              },
            },
          },
        },
        TokenExpired: {
          description: 'Access token expired, refresh required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Token expired', code: 'TOKEN_EXPIRED' },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Insufficient permissions', code: 'FORBIDDEN' },
            },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
