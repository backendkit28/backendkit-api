import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login o registro con Google
export async function googleOAuth(code: string, tenantId: string) {
  // Intercambiar code por access token
  const tokenResponse = await axios.post(
    'https://oauth2.googleapis.com/token',
    {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }
  );

  const accessToken = tokenResponse.data.access_token;

  // Obtener info del usuario
  const userInfoResponse = await axios.get(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const { id, email, name } = userInfoResponse.data;

  // Buscar o crear usuario
  let user = await prisma.user.findUnique({
    where: {
      oauthProvider_oauthId: {
        oauthProvider: 'google',
        oauthId: id,
      },
    },
  });

  if (!user) {
    // Crear nuevo usuario
    user = await prisma.user.create({
      data: {
        tenantId,
        email,
        oauthProvider: 'google',
        oauthId: id,
        emailVerified: true, // Google ya verificó el email
      },
    });
  }

  // Generar JWT
  const token = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    },
    token,
  };
}

// Login o registro con GitHub
export async function githubOAuth(code: string, tenantId: string) {
  // Intercambiar code por access token
  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      code,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
    },
    {
      headers: { Accept: 'application/json' },
    }
  );

  const accessToken = tokenResponse.data.access_token;

  // Obtener info del usuario
  const userInfoResponse = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const { id, email, name } = userInfoResponse.data;

  // Si GitHub no devuelve email, obtenerlo del endpoint de emails
  let userEmail = email;
  if (!userEmail) {
    const emailsResponse = await axios.get(
      'https://api.github.com/user/emails',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const primaryEmail = emailsResponse.data.find((e: any) => e.primary);
    userEmail = primaryEmail?.email;
  }

  if (!userEmail) {
    throw new Error('No email found in GitHub account');
  }

  // Buscar o crear usuario
  let user = await prisma.user.findUnique({
    where: {
      oauthProvider_oauthId: {
        oauthProvider: 'github',
        oauthId: id.toString(),
      },
    },
  });

  if (!user) {
    // Crear nuevo usuario
    user = await prisma.user.create({
      data: {
        tenantId,
        email: userEmail,
        oauthProvider: 'github',
        oauthId: id.toString(),
        emailVerified: true,
      },
    });
  }

  // Generar JWT
  const token = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    },
    token,
  };
}