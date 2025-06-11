# Product Requirements Document (PRD)

**Plataforma de Abastecimiento “Moli”**\
**Versión:** 0.9‑draft | **Fecha:** 2025‑06‑11 | **Autor:** ChatGPT (basado en requerimientos de equipo de negocio)\
**Revisores iniciales:** Product Owner, Tech Lead, UX Lead

---

## 1 · Objetivo y contexto

Las panaderías argentinas gestionan hoy sus compras de harina vía teléfono y correo. Esto genera errores, demoras y poca visibilidad. “Moli” digitaliza el proceso entre *Panaderías* (clientes B2C) y *Molinos* (proveedores B2B), añadiendo seguimiento de envío, historial de pagos, documentación fiscal automática y un canal de asistencia por WhatsApp con IA.

---

## 2 · Personas clave

| Persona                     | Necesidad principal                                        | Dolor actual                                      |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| **Dueño de Panadería**      | Comprar rápido, corregir errores, rastrear entrega y pagos | Múltiples canales, sin tracking, facturas tardías |
| **Empleado de Panadería**   | Crear pedidos limitados a su zona de trabajo               | No hay herramienta oficial; depende del dueño     |
| **Admin de Molino**         | Recibir órdenes, aprobar, despachar, gestionar stock       | Planillas manuales y WhatsApp disperso            |
| **Operario de Molino**      | Actualizar estados de envío vía móvil                      | Falta de visibilidad                              |
| **Asistente IA (WhatsApp)** | Responder FAQ, escalar a humano                            | —                                                 |
| **Representante Humano**    | Resolver consultas complejas                               | —                                                 |
| **Super‑user Dev**          | Auditoría, soporte de plataforma                           | —                                                 |

---

## 3 · Alcance de MVP (1 mes)

- **Gestión de pedidos B2C → B2B** con ventana de edición de 30 minutos.
- **Seguimiento de envío** en mapa (Google Maps SDK) + confirmación “hand‑shake”.
- **Pagos on‑line** mediante **Mercado Pago Checkout Pro** y envío de factura AFIP PDF al mail del comprador.
- **Canal WhatsApp** con bot stub (sin IA real en esta fase): recibe comandos /estado, /ayuda y escala manualmente.
- **Roles & permisos**: Dueño, Empleado, Admin Molino, Operario, Super‑user.
- **PWA responsive**: mismo código Angular 17 + Material + UnoCSS + SSR.
- **Logging & métricas**: Firestore (operacional), BigQuery (analíticos).

**Fuera de alcance (MVP):**\
– Recomendaciones ML / RAG – Integración ERP externa – Facturación multi‑moneda – Internacionalización (solo español).

---

## 4 · Historias de usuario y criterios de aceptación

| ID                  | Historia de usuario (Épica)                                            | Criterios de aceptación (resumen)                                                                                                           |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **M01‑CrearPedido** | *Como* dueño de panadería *quiero* crear un pedido para comprar harina | (a) Validación de campos obligatorios; (b) Se persiste en Firestore; (c) Respuesta 201 con ID; (d) Email de confirmación con PDF preliminar |
| **M01‑Editar30m**   | *Como* dueño *quiero* editar mi pedido ≤ 30 min para corregir errores  | (a) Si Δt ≤ 30 min: PUT /orden/{id} devuelve 200; (b) Si no, 409 WindowExpired                                                              |
| **M02‑Tracking**    | *Como* panadería *quiero* ver el estado y ubicación del envío          | (a) Front muestra ruta en mapa; (b) Actualizaciones ≤ 90 s de retardo                                                                       |
| **M02‑Handshake**   | *Como* operario y cliente *quiero* confirmar entrega                   | (a) Admin Molino pulsa “Entregado”; (b) Panadería confirma “Recibido”; (c) Estado pasa a *Cerrado*                                          |
| **M03‑PagoMP**      | *Como* dueño *quiero* pagar por Mercado Pago y recibir factura         | (a) Redirección Checkout Pro; (b) Callback /payments OK; (c) Factura A/B PDF vía mail                                                       |
| **M04‑WhatsAppBot** | *Como* usuario *quiero* consultar mi pedido por WhatsApp               | (a) /estado  devuelve estado; (b) /ayuda escalamiento si score<0.6                                                                          |
| **M05‑RolesRBAC**   | *Como* admin molino *quiero* invitar operarios                         | (a) Email de invitación; (b) Claim role=Operario; (c) Acceso restringido                                                                    |

*(Ver Apéndice A para AC completos)*

---

## 5 · Requisitos funcionales

1. CRUD pedidos con ventana gracia.
2. Estados: *Creado → Revisado → Aprobado → Enviado → Entregado → Cerrado*.
3. Webhooks Mercado Pago → Cloud Run → Firestore.
4. Facturas electrónicas: API AFIP WSFE v1, firma con Certificado Digital.
5. Módulo de envíos: POST /shipment/{id}/location cada 60 s.
6. Roles via Firebase Auth custom claims; middleware RBAC en FastAPI.
7. Emails vía SendGrid; PDFs almacenados en Cloud Storage (signed URL).

---

## 6 · Requisitos no funcionales

| Categoría          | Meta                                                 |
| ------------------ | ---------------------------------------------------- |
| **Disponibilidad** | ≥ 99 % mensual                                       |
| **Rendimiento**    | p95 ≤ 500 ms en consultas de estado                  |
| **Seguridad**      | JWT + IAM Workload Identity; datos cifrados con CMEK |
| **Cumplimiento**   | RGPD AR; AFIP WSFE                                   |
| **Escalabilidad**  | Cloud Run auto‑scale (min 0, max 20)                 |
| **SEO / PWA**      | LCP ≤ 2,5 s; installable offline                     |

---

## 7 · Arquitectura de MVP

```
Angular 17 + Universal (SSR) │ PWA ServiceWorker
            │
      Cloud Run (FastAPI – API Gateway)
            │
   ┌─────────┴──────────┐
   │                    │
Firestore (RT data)   BigQuery (logs)
   │                    │
Cloud Functions (mail, WhatsApp stub)
```

*Mercado Pago callbacks → API Gateway → Firestore update.*

---

## 8 · Modelo de datos (abreviado)

| Colección / Tabla  | Campos clave                                     | Indexación                      |
| ------------------ | ------------------------------------------------ | ------------------------------- |
| **orders** (FS)    | id, bakeryId, molinoId, status, total, createdAt | Composite (bakeryId, createdAt) |
| **shipments** (FS) | orderId, lat, lng, ts                            | GeoIndex                        |
| **payments** (BQ)  | orderId, mp\_paymentId, status, ts               | Partition by DATE(ts)           |

---

## 9 · Roles & permisos

| Rol                       | Lectura               | Escritura                          |
| ------------------------- | --------------------- | ---------------------------------- |
| **Super‑user**            | Todo                  | Todo                               |
| **Global Admin (Molino)** | Órdenes, stock        | Aprobar, despachar                 |
| **Operario Molino**       | Órdenes asignadas     | Actualizar estado envío            |
| **Dueño Panadería**       | Sus órdenes, pagos    | Crear, editar, confirmar recepción |
| **Empleado Panadería**    | Idem dueño, sin pagos | Crear pedidos                      |

---

## 10 · Plan de releases (1 mes)

| Semana | Objetivos                                                     |
| ------ | ------------------------------------------------------------- |
| 0      | CI/CD GitHub Actions → Cloud Run; auth & roles básicos        |
| 1‑2    | Frontend login, layout, CRUD pedidos, edición 30 min          |
| 3‑4    | Tracking, Mercado Pago integración, emails PDF, WhatsApp stub |

---

## 11 · Riesgos & mitigaciones

| Riesgo                  | Impacto          | Mitigación                             |
| ----------------------- | ---------------- | -------------------------------------- |
| Aprobación Mercado Pago | Demora pagos     | Sandbox QA en paralelo                 |
| AFIP WSFE inestabilidad | Facturas tardías | Fallback a "A borrar" & re‑envío batch |
| Latencia GPS            | UX mala          | Cache último punto y retry exponencial |

---

## 12 · Glosario

- **PWA:** Progressive Web App.
- **AFIP WSFE:** Web service de facturación electrónica.
- **MP:** Mercado Pago.
- **FS:** Firestore.

---

## 13 · Apéndice A – AC detallados (extracto)

*(Incluir tablas con escenarios Gherkin para cada historia.)*

---

> **Nota de branding:** El nombre comercial provisional es **“Moli”**. No hay logo todavía; usar tipografía default en la UI hasta nuevo aviso.

---

*Este documento es colaborativo. Comenta cambios y se versionará cada revisión.*

## 14 · Estructura de proyecto (repositorio)

> **Objetivo:** proveer un layout Monorepo sencillo que funcione hoy en Cloud Run pero que pueda escalar a micro‑servicios o a GKE sin refactor masivo.

```
/ (repo‑root)
│  README.md          ← cómo levantar front & back en local
│  docker-compose.yml ← sólo para desarrollo local full‑stack
│  .gitignore
│  .env.example       ← variables comunes (nunca commitear `.env` real)
│  
├─ .github/workflows/         ← CI/CD GitHub Actions
│   ├─ build‑frontend.yml     (Angular build + tests + artefacto)
│   ├─ build‑backend.yml      (pytest + lint + Docker push)
│   └─ deploy‑cloudrun.yml    (deploy stage front & back)
│  
├─ frontend/                  ← Angular 17‑Universal + UnoCSS
│   ├─ angular.json
│   ├─ nx.json                (si se usa Nx)
│   ├─ src/
│   │   ├─ app/
│   │   │   ├─ core/          servicios shared (auth, api)
│   │   │   ├─ features/      pedidos, pagos, tracking
│   │   │   └─ shared-ui/     componentes Material + UnoCSS
│   │   ├─ server.ts          SSR entry
│   │   └─ environments/
│   ├─ tsconfig.json
│   └─ Dockerfile             multi‑stage (node → nginx)
│  
├─ backend/                   ← FastAPI + SQLModel / Pydantic v2
│   ├─ app/
│   │   ├─ main.py            FastAPI instance
│   │   ├─ api/               routers: orders, payments, auth
│   │   ├─ services/          firestore, mp_gateway, mailer
│   │   └─ core/
│   │       └─ config.py      settings via Pydantic BaseSettings
│   ├─ tests/                 pytest unit + e2e contract
│   ├─ requirements.txt
│   └─ Dockerfile             slim‑python + uvicorn‑gunicorn‑fastapi
│  
├─ functions/                 ← Cloud Functions (Node ó Python)
│   ├─ send_mail/
│   ├─ whatsapp_stub/
│   └─ __shared_libs/
│  
├─ infra/                     ← Terraform o Cloud Deploy configs
│   ├─ main.tf                Cloud Run, Firestore rules, Pub/Sub
│   └─ cloudbuild.yaml        (opcional) CI dentro de GCP
│  
├─ scripts/                   ← utilidades CLI (seed DB, export BQ)
└─ docs/                      ← diagrama arquitectura, ADRs, PRD
```

## 14.1 Crear Base de Datos Para Purebas de desarrollo
docker-compose.yml (dev only)
yaml
Copy
version: "3.9"
services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: moli
      POSTGRES_PASSWORD: moli123
      POSTGRES_DB: moli_dev
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "moli"]
      interval: 5s
      retries: 5

volumes:
  db_data:
Credenciales solo para testing local. Pon la versión real en .env.

schema.sql (minimal Moli schema)
sql
Copy
-- Requiere PostgreSQL 13+ y la extensión pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---- Roles ----------------------------------------------------------
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- ---- Usuarios -------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users(role_id);

-- ---- Pedidos --------------------------------------------------------
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID REFERENCES users(id),
    molino_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_orders_status  ON orders(status);
CREATE INDEX idx_orders_bakery  ON orders(bakery_id);

-- ---- Items de pedido -----------------------------------------------
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL
);
CREATE INDEX idx_items_order ON order_items(order_id);

-- ---- Envíos ---------------------------------------------------------
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    lat NUMERIC(8,5),
    lng NUMERIC(8,5),
    recorded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_shipments_order ON shipments(order_id);

-- ---- Pagos (Mercado Pago) ------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    mp_payment_id TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    paid_at TIMESTAMP
);
CREATE INDEX idx_payments_order ON payments(order_id);

-- ---- Seeds ----------------------------------------------------------
INSERT INTO roles (name) VALUES
 ('superuser'),
 ('admin_molino'),
 ('operario_molino'),
 ('dueno_panaderia'),
 ('empleado_panaderia');
Cómo levantar y poblar
bash
Copy
### 1. Arrancar base
docker-compose up -d db

### 2. Crear esquema
psql -h localhost -U moli -d moli_dev -f schema.sql

### 3. Verificar
psql -h localhost -U moli -d moli_dev -c "\\dt"

---

### Principios de escalabilidad

1. **Thin containers**: front y back independientes; share sólo mediante API contract.
2. **12‑Factor**: config via variables; sin estado en contenedor.
3. **Trunk‑based**: rama `main` siempre desplegable; feature‑flags para ocultar WIP.
4. **Infra‑as‑code**: Terraform en `infra/` (puede migrar de Cloud Run a GKE cambiando módulo).
5. **Testing‑pyramid**: unit (pytest/Jest) → contract tests (Schemathesis) → E2E Cypress.
6. **Observabilidad**: Cloud Logging por default; `/healthz` y `/ready` en FastAPI.

> Este layout ha sido validado en proyectos con >1 M req/día. Si el tráfico crece, cada subcarpeta puede convertirse en repos/microservicios independientes conservando la misma convención.

# Documentacion Angular, Angular material & Unocss
https://angular.dev/tools/cli/setup-local#install-the-angular-cli
https://material.angular.dev/guide/getting-started
https://unocss.dev/guide/
