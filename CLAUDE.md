# CLAUDE.md — Gestión de Trámites Transporte Internacional (Chile–Bolivia)

## Contexto del negocio

Empresa que gestiona trámites para empresas de transporte de carga y pasajeros
internacional entre Chile y Bolivia. Se cobra por trámite, en la moneda y
"caja" del país donde se origina el trámite (CLP en Chile, BOB en Bolivia) —
los pagos nunca se mezclan entre países porque cada uno se destina a un origen
distinto.

Se debe controlar: tipo de trámite, pagos por trámite (incluyendo pagos
parciales y saldo pendiente), documentación generada, fechas de trámite,
vigencia de los permisos emitidos, y las patentes del parque automotor
habilitado por cada empresa cliente. Un mismo trámite puede afectar varias
patentes a la vez (ej. una incorporación o baja de varias unidades juntas).

## Usuarios del sistema

A diferencia del ERP mayorista, este proyecto tiene **varios usuarios desde
Fase 1**, cada uno con un rol y país de gestión asignado:

| Usuario | Rol | País de gestión |
|---|---|---|
| Angela Morejon | Administradora | Chile |
| Dieter Morejón | Colaborador | Bolivia |
| Álvaro Escalera | Apoyo a Angela Morejon | Chile |

El campo `responsable_cobro` de un pago referencia a uno de estos usuarios
(no texto libre) para poder saber quién cobró cada pago.

La app debe funcionar igual de bien en celular y en computador — se construye
como web app responsive (PWA) para facilitar el registro y consulta en
terreno, sin mantener dos apps separadas.

Este proyecto es independiente del ERP de comercio mayorista (carpeta
`proyectos Claude/` raíz) — rubros distintos, no comparten base de datos ni
lógica de facturación SII.

## Estado actual del proyecto

- **Fase 1 — Construcción base** (scaffolding Next.js ya creado)
- Sin integración con sistemas externos de aduana/tránsito por ahora
- No hay emisión de documentos tributarios electrónicos en este proyecto (no
  confundir con el ERP mayorista, que sí tiene fase SII)

## Glosario

| Término | Significado |
|---|---|
| Trámite | Gestión pagada ante la autoridad de Chile o Bolivia para habilitar transporte internacional |
| Vigencia | Período durante el cual un permiso emitido es válido |
| Patente | Placa/matrícula del vehículo |
| Parque automotor | Conjunto de vehículos habilitados de una empresa cliente |
| Caja Chile / Caja Bolivia | Agrupación de trámites y pagos según el país donde se origina el trámite (para reportes) — no obliga la moneda del pago |
| CLP | Peso chileno |
| BOB | Boliviano (moneda de Bolivia) |
| NIT | Número de Identificación Tributaria (identificador fiscal boliviano) |
| FAX / REX | Número de oficio con el que se presenta un trámite ante la autoridad (documento inicial) |
| Plazo | Fecha límite para que la autoridad resuelva o para responder una observación |
| Saldo | Monto pendiente de pago de un trámite — se calcula, no se guarda directamente |

## Stack tecnológico

Mismo stack que el ERP mayorista, para reutilizar patrones y conocimiento
(Next.js se instaló en su versión 16, más reciente que la 15 usada en el ERP):

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| ORM | Drizzle ORM |
| UI | Tailwind CSS + shadcn/ui |
| Formularios | React Hook Form + Zod |
| PDF | @react-pdf/renderer (comprobantes y documentos de trámite) |
| Tests | Vitest |
| Hosting | Vercel (app) + Supabase (BD) |
| Monitoreo | Sentry (plan gratuito) |
| Mobile | PWA (manifest + service worker), no app nativa |

## Convenciones del código

### Idioma
- Todo el código de dominio en **español**: funciones, variables, tablas
- UI en español

### Montos y divisas
- **NUNCA usar `number` de JavaScript para montos monetarios** — usar `Decimal` de `decimal.js`
- Montos en CLP: sin decimales, redondeo `ROUND_HALF_UP` al peso entero
- Montos en BOB y USD: máximo 2 decimales
- **La moneda de un pago es libre** (CLP, BOB o USD) y se elige caso a caso al registrarlo — no está forzada por el país de origen del trámite. El país del trámite solo determina a qué "caja" (Chile/Bolivia) se reporta, no la moneda del pago
- El saldo pendiente de un trámite **se calcula** (`monto_total` del trámite menos la suma de pagos con estado `pagado`, por moneda) — nunca se guarda como campo editable a mano, para evitar que quede desincronizado

### Fechas y zona horaria
- Chile: `America/Santiago` (con horario de verano)
- Bolivia: `America/La_Paz` (UTC-4 fijo, sin horario de verano)
- Fechas guardadas en BD siempre en **UTC**; mostrar en UI según el país del trámite, no un huso fijo para toda la app
- Usar `date-fns-tz` para conversiones

### Tipos TypeScript
- No usar `any` — preferir `unknown` con type guards
- Formularios definidos con Zod
- Tipos de BD generados desde Drizzle (no escribir a mano)

## Estructura de carpetas

```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── empresas/           # Empresas cliente (transportistas)
│   │   ├── vehiculos/          # Parque automotor y patentes
│   │   ├── tramites/           # Trámites por país
│   │   ├── tipos-tramite/      # Catálogo de tipos de trámite y tarifas
│   │   ├── pagos/              # Pagos por trámite, caja Chile / caja Bolivia
│   │   └── documentos/         # Documentación generada por trámite
│   └── api/
├── components/
│   ├── ui/                     # shadcn/ui (no modificar)
│   └── [dominio]/
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── calculos/
│   │   └── vigencia.ts         # cálculo de fechas de vencimiento — con tests
│   ├── validaciones/
│   │   ├── rut.ts              # RUT chileno (empresas/vehículos de Chile)
│   │   ├── nit.ts               # NIT boliviano
│   │   └── patente.ts
│   └── pdf/
│       └── comprobante-tramite.tsx
├── actions/
│   ├── empresas.ts
│   ├── vehiculos.ts
│   ├── tramites.ts
│   └── pagos.ts
└── types/
    └── index.ts
```

## Reglas de negocio — CRÍTICAS

### Cálculos
- **Nunca calcular montos en el cliente (browser)** — todo cálculo ocurre en Server Actions
- Toda función de cálculo tiene tests de Vitest obligatorios

### Trámites y pagos
- Un trámite puede afectar **una o varias patentes/vehículos** a la vez (relación muchos a muchos) — ej. una incorporación o baja de varias unidades en un mismo trámite
- Los pagos de un trámite pueden ser **parciales**; el saldo se calcula, no se guarda
- La moneda de cada pago es independiente del país del trámite (ver regla de montos y divisas arriba)
- Un trámite **concluido** con documentación ya emitida no se edita — se anula y se crea uno nuevo si hay un error (mismo principio que un DTE emitido en el ERP)
- Los campos de vigencia (`fecha_vigencia_desde`, `fecha_vigencia_hasta`) son **inmutables** una vez que el trámite pasa a estado `concluido`
- El sistema debe alertar automáticamente sobre permisos próximos a vencer (ej. 30 días antes) en el dashboard, sin depender de revisión manual

### Auditoría
- Todo cambio de estado de un trámite se loguea en `audit_log`
- Los logs son inmutables (solo INSERT, nunca UPDATE/DELETE)

## Reglas de validación

- **RUT chileno** (empresas/vehículos con domicilio en Chile): mismo algoritmo módulo 11 que el ERP mayorista; guardar sin puntos ni guion, mostrar `12.345.678-9`
- **NIT boliviano**: formato numérico (7 a 9 dígitos aprox.), sin dígito verificador público estándar — validar solo formato/largo, no checksum
- **Patente**: el formato varía por país y época (Chile: patente actual 4 letras + 2 números, o formatos antiguos; Bolivia: varía por departamento) — validar solo largo mínimo, no bloquear el registro por formato exacto

### Campos requeridos en un trámite
- Empresa cliente
- Tipo de trámite (y por lo tanto país de origen, heredado del tipo)
- Fecha de solicitud
- Al menos un vehículo asociado (si el tipo de trámite lo requiere)

## Comandos del proyecto

```bash
pnpm dev
pnpm test
pnpm test:watch
pnpm db:migrate
pnpm db:studio
pnpm db:generate
pnpm build
```

## Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=

# Anthropic — respaldo con IA para certificados R.V.M. escaneados/fotografiados
# (src/lib/pdf/ocr-certificado-rvm.ts), usado cuando el PDF no tiene texto embebido
ANTHROPIC_API_KEY=
```

## Cómo trabajar con Claude Code

- Una tarea por conversación: pedir "crea el Server Action para registrar un pago de trámite", no "hazme todo el módulo de pagos"
- Tests primero en lógica de plata o de fechas de vigencia
- Commits pequeños: cada tarea terminada = un commit
- Siempre leer el código generado antes de hacer commit
