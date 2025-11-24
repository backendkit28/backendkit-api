# 🚀 BackendKit

**Backend-as-a-Service diseñado para indie hackers que construyen productos SaaS**

[![Tests](https://img.shields.io/badge/tests-58%20passing-brightgreen)](https://github.com/backendkit28/backendkit-api)
[![Coverage](https://img.shields.io/badge/coverage-23.59%25-yellow)](https://github.com/backendkit28/backendkit-api)
[![API Docs](https://img.shields.io/badge/docs-swagger-85EA2D)](https://api.backendkit.dev/docs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 ¿Qué es BackendKit?

BackendKit proporciona toda la infraestructura backend necesaria para un SaaS, permitiéndote enfocarte en tu producto único en lugar de reconstruir autenticación, pagos y emails por tercera vez.

**Tiempo de integración:** ~30 minutos

---

## ✨ Features

- 🔐 **Autenticación completa** - JWT + OAuth (Google/GitHub)
- 💳 **Pagos integrados** - Stripe subscriptions out-of-the-box
- 📧 **Sistema de emails** - Templates transaccionales con Resend
- 🏢 **Multi-tenancy** - Cada cliente tiene su propio espacio aislado
- 📊 **Dashboard admin** - Métricas, usuarios y suscripciones en tiempo real
- 📚 **API documentada** - Swagger UI interactivo
- ✅ **Testeado** - 58 tests automatizados
- 🚀 **Production-ready** - Desplegado y escalable

---

## 🚀 Quick Start

### 1. Obtén tu API Key
```bash
curl -X POST https://api.backendkit.dev/admin/tenants \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mi Empresa", "email": "admin@miempresa.com"}'
```

**Respuesta:**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "Mi Empresa",
    "apiKey": "bk_1234567890abcdef",
    "plan": "starter"
  }
}
```

### 2. Registra un usuario
```bash
curl -X POST https://api.backendkit.dev/api/auth/register \
  -H "x-api-key: bk_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com", "password": "securepass123"}'
```

### 3. Login
```bash
curl -X POST https://api.backendkit.dev/api/auth/login \
  -H "x-api-key: bk_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com", "password": "securepass123"}'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "user"
  }
}
```

---

## 📦 Instalación (Self-Hosted)

### Requisitos

- Node.js 20+
- PostgreSQL 15+
- npm o yarn

### Paso 1: Clonar repositorio
```bash
git clone https://github.com/backendkit28/backendkit-api.git
cd backendkit-api
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Configurar variables de entorno

Crea un archivo `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/backendkit"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server
PORT=3000
NODE_ENV=development

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_STARTER="price_..."

# OAuth Google
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# OAuth GitHub
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Email
RESEND_API_KEY="re_..."

# Admin
ADMIN_KEY="your-admin-secret-key"

# Frontend
FRONTEND_URL="http://localhost:3001"
```

### Paso 4: Migrar base de datos
```bash
npx prisma migrate deploy
npx prisma generate
```

### Paso 5: Iniciar servidor
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

**API corriendo en:** `http://localhost:3000`  
**Docs en:** `http://localhost:3000/docs`

---

## 📚 Documentación API

### 🌐 API en Producción
```
https://api.backendkit.dev
```

### 📖 Swagger UI (Interactivo)
```
https://api.backendkit.dev/docs
```

### 🔑 Autenticación

**API Key (Header):**
```
x-api-key: bk_your_api_key_here
```

**JWT Token (Header):**
```
Authorization: Bearer your_jwt_token_here
```

### 📋 Endpoints Principales

#### Authentication
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obtener perfil
- `PUT /api/auth/change-password` - Cambiar contraseña
- `GET /api/auth/google` - OAuth Google
- `GET /api/auth/github` - OAuth GitHub

#### Subscriptions
- `POST /api/subscription/create` - Crear suscripción
- `GET /api/subscription/list` - Listar suscripciones
- `POST /api/subscription/:id/cancel` - Cancelar suscripción
- `POST /api/subscription/portal` - Portal de billing

#### Admin (requiere admin key)
- `POST /admin/tenants` - Crear tenant
- `GET /admin/tenants` - Listar tenants
- `GET /admin/tenants/metrics` - Métricas globales
- `GET /admin/tenants/users` - Listar usuarios
- `GET /admin/tenants/subscriptions` - Listar suscripciones

---

## 🧪 Testing

### Correr tests
```bash
# Todos los tests
npm test

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Resultados actuales
```
✅ Test Suites: 10 passed
✅ Tests: 58 passed
📊 Coverage: 23.59%
```

---

## 🚀 Deploy

### Railway (Recomendado)

1. Conecta tu repo de GitHub
2. Configura las variables de entorno
3. Railway detecta automáticamente Fastify
4. Deploy automático en cada push

### Otras opciones

- **Vercel** - Serverless
- **Render** - Free tier disponible
- **Fly.io** - Edge computing
- **DigitalOcean** - VPS tradicional

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Fastify (alta performance)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT + OAuth (Google/GitHub)
- **Payments:** Stripe
- **Emails:** Resend
- **Testing:** Jest + Supertest

### DevOps
- **Hosting:** Railway
- **CI/CD:** GitHub Actions
- **Docs:** Swagger/OpenAPI 3.0

---

## 📊 Arquitectura
```
┌─────────────────┐
│   Client Apps   │ (iOS, Android, Web)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  BackendKit API │ (api.backendkit.dev)
│   Multi-tenant  │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────┐
│ PostgreSQL│ │Stripe│
└────────┘ └──────┘
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Ejemplos de Uso

### JavaScript/TypeScript
```javascript
// Instalación
npm install axios

// Uso
const axios = require('axios');

const API_URL = 'https://api.backendkit.dev';
const API_KEY = 'bk_your_api_key';

// Registrar usuario
async function registerUser(email, password) {
  const response = await axios.post(`${API_URL}/api/auth/register`, {
    email,
    password
  }, {
    headers: { 'x-api-key': API_KEY }
  });
  return response.data;
}

// Login
async function loginUser(email, password) {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email,
    password
  }, {
    headers: { 'x-api-key': API_KEY }
  });
  return response.data.token;
}

// Usar token
async function getProfile(token) {
  const response = await axios.get(`${API_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}
```

### Python
```python
import requests

API_URL = 'https://api.backendkit.dev'
API_KEY = 'bk_your_api_key'

# Registrar usuario
def register_user(email, password):
    response = requests.post(
        f'{API_URL}/api/auth/register',
        json={'email': email, 'password': password},
        headers={'x-api-key': API_KEY}
    )
    return response.json()

# Login
def login_user(email, password):
    response = requests.post(
        f'{API_URL}/api/auth/login',
        json={'email': email, 'password': password},
        headers={'x-api-key': API_KEY}
    )
    return response.json()['token']
```

---

## 🔒 Seguridad

- ✅ Passwords hasheados con bcrypt (cost 12)
- ✅ JWT con expiración de 7 días
- ✅ Rate limiting (100 req/15min)
- ✅ CORS configurado
- ✅ Helmet para headers seguros
- ✅ SQL injection protegido (Prisma)
- ✅ HTTPS enforced en producción

---

## 📞 Soporte

- **Documentación:** [https://api.backendkit.dev/docs](https://api.backendkit.dev/docs)
- **Issues:** [GitHub Issues](https://github.com/backendkit28/backendkit-api/issues)
- **Email:** support@backendkit.dev

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

Construido con ❤️ para indie hackers y emprendedores SaaS.

---

**⭐ Si te gusta el proyecto, dale una estrella en GitHub!**#   R e b u i l d   1 1 / 2 4 / 2 0 2 5   1 3 : 3 6 : 0 3  
 