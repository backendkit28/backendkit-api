export const rateLimits = {
  // Rutas de autenticación más estrictas
  auth: {
    max: 10,
    timeWindow: '15 minutes',
  },
  
  // Rutas de API normales
  api: {
    max: 100,
    timeWindow: '15 minutes',
  },
  
  // Webhooks (vienen de servicios externos)
  webhook: {
    max: 1000,
    timeWindow: '1 minute',
  },
  
  // Admin con límite más alto
  admin: {
    max: 200,
    timeWindow: '15 minutes',
  },
};