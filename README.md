# Moli PWA - Plataforma de Abastecimiento

**Versión:** MVP 1.0 | **Tecnología:** Angular 17 + FastAPI + Firebase

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+ 
- Python 3.11+
- Docker & docker-compose

### Desarrollo Local

```bash
# 1. Frontend (Angular PWA)
cd frontend
npm install
npm start
# → http://localhost:4200

# 2. Backend (FastAPI) 
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000

# 3. Base de datos (PostgreSQL)
docker-compose up -d db
```

## 📁 Estructura del Proyecto

```
/
├─ frontend/          # Angular 17 PWA + SSR
├─ backend/           # FastAPI + SQLModel  
├─ functions/         # Cloud Functions
├─ infra/            # Terraform configs
├─ scripts/          # Utilities CLI
├─ docs/             # Architecture docs
└─ .github/workflows/# CI/CD
```

## 🏗️ Arquitectura

- **Frontend**: Angular 17 + Universal SSR + Material + UnoCSS-like utilities
- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Auth**: Firebase Auth (JWT)
- **Payments**: Mercado Pago Checkout Pro
- **Deploy**: Cloud Run + Cloud Storage
- **Monitoring**: Cloud Logging + BigQuery

## 🔐 Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `superuser` | Admin sistema | Todo |
| `admin_molino` | Admin del molino | Aprobar, despachar órdenes |
| `operario_molino` | Operario | Actualizar estados de envío |
| `dueno_panaderia` | Dueño panadería | Crear pedidos, pagos |
| `empleado_panaderia` | Empleado | Crear pedidos (sin pagos) |

## 🛠️ Features MVP

- ✅ **Gestión de pedidos** con ventana de edición 30 min
- ✅ **Autenticación** con roles y permisos
- ✅ **UI responsiva** con Material Design
- ⏳ **Seguimiento GPS** en tiempo real
- ⏳ **Pagos Mercado Pago** + facturación AFIP
- ⏳ **WhatsApp Bot** para consultas
- ⏳ **PWA** con Service Worker

## 🚀 Deploy

### Development
```bash
npm run build:dev
docker-compose up
```

### Production (Cloud Run)
```bash
gcloud run deploy moli-frontend --source frontend/
gcloud run deploy moli-backend --source backend/
```

## 🧪 Testing

```bash
# Frontend
cd frontend && npm test

# Backend  
cd backend && pytest

# E2E
npm run e2e
```

## 📝 API Documentation

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000/docs
- **OpenAPI**: http://localhost:8000/redoc

## 👥 Equipo

- **Product Owner**: [TBD]
- **Tech Lead**: [TBD] 
- **Frontend**: Angular 17 + TypeScript
- **Backend**: FastAPI + Python
- **DevOps**: GCP + Terraform

---

**Demo Login:**
- Panadería: `cualquier@email.com` 
- Molino: `admin@molino.com`
- Password: cualquier texto (demo mode)
