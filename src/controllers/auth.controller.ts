import { FastifyRequest, FastifyReply } from 'fastify';
import {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
} from '../services/auth.service';
import { googleOAuth, githubOAuth } from '../services/oauth.service';

// Tipos para validación
interface RegisterBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

// POST /api/auth/register
export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  try {
    const { email, password } = request.body;
    const tenantId = request.tenant.id;

    // Validar datos
    if (!email || !password) {
      return reply.status(400).send({
        error: 'Missing fields',
        message: 'Email and password are required',
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        error: 'Invalid email',
        message: 'Please provide a valid email address',
      });
    }

    // Validar longitud de password
    if (password.length < 8) {
      return reply.status(400).send({
        error: 'Weak password',
        message: 'Password must be at least 8 characters',
      });
    }

    // Registrar usuario
    const result = await registerUser(tenantId, email, password);

    return reply.status(201).send(result);
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return reply.status(409).send({
        error: 'User exists',
        message: 'A user with this email already exists',
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to register user',
    });
  }
}

// POST /api/auth/login
export async function login(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  try {
    const { email, password } = request.body;
    const tenantId = request.tenant.id;

    // Validar datos
    if (!email || !password) {
      return reply.status(400).send({
        error: 'Missing fields',
        message: 'Email and password are required',
      });
    }

    // Login
    const result = await loginUser(tenantId, email, password);

    return reply.status(200).send(result);
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return reply.status(401).send({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    if (error.message.includes('social login')) {
      return reply.status(401).send({
        error: 'Social login required',
        message: error.message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to login',
    });
  }
}

// GET /api/auth/me
export async function getMe(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user.userId;
    const tenantId = request.user.tenantId;

    const profile = await getUserProfile(userId, tenantId);

    return reply.status(200).send(profile);
  } catch (error: any) {
    if (error.message === 'User not found') {
      return reply.status(404).send({
        error: 'Not found',
        message: 'User not found',
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to get profile',
    });
  }
}

// PUT /api/auth/change-password
export async function updatePassword(
  request: FastifyRequest<{ Body: ChangePasswordBody }>,
  reply: FastifyReply
) {
  try {
    const { currentPassword, newPassword } = request.body;
    const userId = request.user.userId;
    const tenantId = request.user.tenantId;

    // Validar datos
    if (!currentPassword || !newPassword) {
      return reply.status(400).send({
        error: 'Missing fields',
        message: 'Current and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return reply.status(400).send({
        error: 'Weak password',
        message: 'New password must be at least 8 characters',
      });
    }

    const result = await changePassword(
      userId,
      tenantId,
      currentPassword,
      newPassword
    );

    return reply.status(200).send(result);
  } catch (error: any) {
    if (error.message === 'Current password is incorrect') {
      return reply.status(401).send({
        error: 'Invalid password',
        message: error.message,
      });
    }

    if (error.message.includes('social login')) {
      return reply.status(400).send({
        error: 'Cannot change password',
        message: error.message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to change password',
    });
  }
}

// GET /api/auth/google
export async function googleLogin(
  request: FastifyRequest<{ Querystring: { 'x-api-key'?: string } }>,
  reply: FastifyReply
) {
  // ✅ Aceptar API Key desde query params o headers
  const apiKeyFromQuery = request.query['x-api-key'];
  const apiKeyFromHeader = request.headers['x-api-key'] as string;
  const apiKey = apiKeyFromQuery || apiKeyFromHeader;

  if (!apiKey) {
    return reply.status(401).send({
      error: 'API Key required',
      message: 'Provide x-api-key as header or query parameter',
    });
  }

  // Validar API Key manualmente
  const { getTenantByApiKey } = require('../services/tenant.service');
  const tenant = await getTenantByApiKey(apiKey);

  if (!tenant) {
    return reply.status(401).send({
      error: 'Invalid API Key',
      message: 'The provided API Key is not valid',
    });
  }

  const tenantId = tenant.id;
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
    response_type: 'code',
    scope: 'email profile',
    state: tenantId,
  })}`;

  return reply.redirect(googleAuthUrl);
}

// GET /api/auth/google/callback
export async function googleCallback(
  request: FastifyRequest<{ Querystring: { code: string; state: string } }>,
  reply: FastifyReply
) {
  try {
    const { code, state: tenantId } = request.query;

    if (!code || !tenantId) {
      return reply.status(400).send({
        error: 'Missing parameters',
        message: 'Code and state are required',
      });
    }

    const result = await googleOAuth(code, tenantId);

    // Redirigir al frontend con el token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return reply.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'OAuth failed',
      message: error.message,
    });
  }
}

// GET /api/auth/github
export async function githubLogin(
  request: FastifyRequest<{ Querystring: { 'x-api-key'?: string } }>,
  reply: FastifyReply
) {
  // ✅ Aceptar API Key desde query params o headers
  const apiKeyFromQuery = request.query['x-api-key'];
  const apiKeyFromHeader = request.headers['x-api-key'] as string;
  const apiKey = apiKeyFromQuery || apiKeyFromHeader;

  if (!apiKey) {
    return reply.status(401).send({
      error: 'API Key required',
      message: 'Provide x-api-key as header or query parameter',
    });
  }

  // Validar API Key manualmente
  const { getTenantByApiKey } = require('../services/tenant.service');
  const tenant = await getTenantByApiKey(apiKey);

  if (!tenant) {
    return reply.status(401).send({
      error: 'Invalid API Key',
      message: 'The provided API Key is not valid',
    });
  }

  const tenantId = tenant.id;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?${new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: process.env.GITHUB_CALLBACK_URL || '',
    scope: 'user:email',
    state: tenantId,
  })}`;

  return reply.redirect(githubAuthUrl);
}

// GET /api/auth/github/callback (sin cambios)
export async function githubCallback(
  request: FastifyRequest<{ Querystring: { code: string; state: string } }>,
  reply: FastifyReply
) {
  try {
    const { code, state: tenantId } = request.query;

    if (!code || !tenantId) {
      return reply.status(400).send({
        error: 'Missing parameters',
        message: 'Code and state are required',
      });
    }

    const result = await githubOAuth(code, tenantId);

    // Redirigir al frontend con el token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return reply.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'OAuth failed',
      message: error.message,
    });
  }
}