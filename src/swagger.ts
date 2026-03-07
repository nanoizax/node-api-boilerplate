import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './shared/config/env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node API Boilerplate',
      version: '1.0.0',
      description:
        'Production-ready REST API with Clean Architecture, JWT auth, and PostgreSQL. Built by Leandro Perez — SonhoLab.',
      contact: {
        name: 'Leandro Perez',
        email: 'contacto@sonholab.com',
        url: 'https://sonholab.com',
      },
      license: { name: 'MIT' },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/presentation/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
