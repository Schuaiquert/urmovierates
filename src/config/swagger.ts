import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'urmovierates API',
      version: '1.0.0',
      description:
        'REST API for movie reviews and ratings. Use the Authorize button to set a Bearer token.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
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
          description: 'Missing or invalid token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Authentication required', code: 'AUTH_MISSING' },
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
