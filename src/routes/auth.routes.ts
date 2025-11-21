import { FastifyInstance } from 'fastify';
import { validateApiKey, validateJWT } from '../middleware/auth.middleware';
import {
  register,
  login,
  getMe,
  updatePassword,
  googleLogin,
  googleCallback,
  githubLogin,
  githubCallback,
} from '../controllers/auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  // ========================================
  // 📝 REGISTER
  // ========================================
  fastify.post('/register', {
    schema: {
      tags: ['Authentication'],
      summary: 'Register new user',
      description: 'Creates a new user account for the tenant. Requires tenant API key.',
      security: [{ adminKey: [] }],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'User password (minimum 6 characters)',
            example: 'SecurePass123!'
          }
        }
      },
      response: {
        201: {
          description: 'User created successfully',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string', example: 'user' },
                emailVerified: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            message: { type: 'string', example: 'User created successfully' }
          }
        },
        400: {
          description: 'Invalid input or user already exists',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'User already exists' }
          }
        },
        401: {
          description: 'Invalid or missing API key',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid API key' }
          }
        }
      }
    },
    preHandler: [validateApiKey],
    handler: register,
  });

  // ========================================
  // 🔐 LOGIN
  // ========================================
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'Login user',
      description: 'Authenticates a user and returns a JWT token',
      security: [{ adminKey: [] }],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'SecurePass123!'
          }
        }
      },
      response: {
        200: {
          description: 'Login successful',
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token for authenticated requests',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string', example: 'user' }
              }
            }
          }
        },
        400: {
          description: 'Invalid credentials',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid email or password' }
          }
        },
        401: {
          description: 'Invalid or missing API key',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid API key' }
          }
        }
      }
    },
    preHandler: [validateApiKey],
    handler: login,
  });

  // ========================================
  // 👤 GET ME
  // ========================================
  fastify.get('/me', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get current user',
      description: 'Returns the authenticated user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'User profile retrieved successfully',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', example: 'user' },
            emailVerified: { type: 'boolean' },
            oauthProvider: { type: 'string', nullable: true, example: 'google' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        401: {
          description: 'Invalid or missing JWT token',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unauthorized' }
          }
        }
      }
    },
    preHandler: [validateJWT],
    handler: getMe,
  });

  // ========================================
  // 🔒 CHANGE PASSWORD
  // ========================================
  fastify.put('/change-password', {
    schema: {
      tags: ['Authentication'],
      summary: 'Change password',
      description: 'Updates the user password (requires authentication)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            description: 'Current password',
            example: 'OldPass123!'
          },
          newPassword: {
            type: 'string',
            minLength: 6,
            description: 'New password (minimum 6 characters)',
            example: 'NewSecurePass456!'
          }
        }
      },
      response: {
        200: {
          description: 'Password updated successfully',
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Password updated successfully' }
          }
        },
        400: {
          description: 'Invalid current password',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Current password is incorrect' }
          }
        },
        401: {
          description: 'Invalid or missing JWT token',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unauthorized' }
          }
        }
      }
    },
    preHandler: [validateJWT],
    handler: updatePassword,
  });

  // ========================================
  // 🔵 GOOGLE OAUTH
  // ========================================
  fastify.get('/google', {
    schema: {
      tags: ['Authentication'],
      summary: 'Google OAuth Login',
      description: 'Redirects to Google OAuth consent screen',
      querystring: {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'Tenant API key (passed as query param)',
            example: 'bk_1234567890abcdef'
          }
        }
      },
      response: {
        302: {
          description: 'Redirect to Google OAuth',
          type: 'null'
        }
      }
    },
    handler: googleLogin,
  });

  fastify.get('/google/callback', {
    schema: {
      tags: ['Authentication'],
      summary: 'Google OAuth Callback',
      description: 'Handles Google OAuth callback and returns JWT token',
      querystring: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'OAuth authorization code from Google'
          },
          state: {
            type: 'string',
            description: 'State parameter for CSRF protection'
          }
        }
      },
      response: {
        200: {
          description: 'OAuth successful',
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                oauthProvider: { type: 'string', example: 'google' }
              }
            }
          }
        },
        400: {
          description: 'OAuth failed',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: googleCallback,
  });

  // ========================================
  // ⚫ GITHUB OAUTH
  // ========================================
  fastify.get('/github', {
    schema: {
      tags: ['Authentication'],
      summary: 'GitHub OAuth Login',
      description: 'Redirects to GitHub OAuth authorization',
      querystring: {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'Tenant API key (passed as query param)',
            example: 'bk_1234567890abcdef'
          }
        }
      },
      response: {
        302: {
          description: 'Redirect to GitHub OAuth',
          type: 'null'
        }
      }
    },
    handler: githubLogin,
  });

  fastify.get('/github/callback', {
    schema: {
      tags: ['Authentication'],
      summary: 'GitHub OAuth Callback',
      description: 'Handles GitHub OAuth callback and returns JWT token',
      querystring: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'OAuth authorization code from GitHub'
          },
          state: {
            type: 'string',
            description: 'State parameter for CSRF protection'
          }
        }
      },
      response: {
        200: {
          description: 'OAuth successful',
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                oauthProvider: { type: 'string', example: 'github' }
              }
            }
          }
        },
        400: {
          description: 'OAuth failed',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: githubCallback,
  });
}