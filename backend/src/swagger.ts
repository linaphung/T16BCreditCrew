export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Credit Crew API',
      version: '1.0.0',
    },
    servers: [
      { url: process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/server.ts'],
}