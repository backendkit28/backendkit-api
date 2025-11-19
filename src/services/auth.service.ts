import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from './email.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Registrar nuevo usuario
export async function registerUser(
  tenantId: string,
  email: string,
  password: string
) {
  // Verificar si el email ya existe para este tenant
  const existingUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email,
      },
    },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Encriptar password
  const passwordHash = await bcrypt.hash(password, 12);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      tenantId,
      email,
      passwordHash,
    },
  });

  // ✅ PASO 4.5 - Enviar email de bienvenida (async, no bloqueante)
  sendWelcomeEmail(email).catch((err: any) => 
    console.error('Failed to send welcome email:', err)
  );

  // Generar JWT token
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
      createdAt: user.createdAt,
    },
    token,
  };
}

// Login de usuario
export async function loginUser(
  tenantId: string,
  email: string,
  password: string
) {
  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email,
      },
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verificar si el usuario tiene password (no es OAuth)
  if (!user.passwordHash) {
    throw new Error('This account uses social login. Please use Google or GitHub to sign in.');
  }

  // Verificar password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generar JWT token
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

// Obtener perfil de usuario
export async function getUserProfile(userId: string, tenantId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      oauthProvider: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// Cambiar password
export async function changePassword(
  userId: string,
  tenantId: string,
  currentPassword: string,
  newPassword: string
) {
  // Buscar usuario
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verificar si el usuario tiene password (no es OAuth)
  if (!user.passwordHash) {
    throw new Error('Cannot change password for social login accounts');
  }

  // Verificar password actual
  const isValidPassword = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Encriptar nuevo password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Actualizar password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return { message: 'Password changed successfully' };
}