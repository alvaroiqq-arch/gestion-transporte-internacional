// schema.ts — Schema Drizzle ORM completo
// Gestión de Trámites Transporte Internacional (Chile–Bolivia)
// Ejecutar: pnpm db:generate && pnpm db:migrate

import {
  pgTable,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

export const paisEnum = pgEnum('pais', ['chile', 'bolivia'])

// Moneda de un pago — libre, no atada al país del trámite (ver CLAUDE.md)
export const monedaEnum = pgEnum('moneda', ['CLP', 'BOB', 'USD'])

export const estadoVehiculoEnum = pgEnum('estado_vehiculo', [
  'habilitado',
  'inhabilitado',
  'suspendido',
])

// Los 3 estados reflejan los 3 bloques reales de seguimiento del negocio
export const estadoTramiteEnum = pgEnum('estado_tramite', [
  'en_curso',            // iniciado, en curso
  'pendiente_observado', // pendiente u observado, requiere acción
  'concluido',           // ejecutado / concluido
  'anulado',
])

export const rolUsuarioEnum = pgEnum('rol_usuario', [
  'administrador',
  'colaborador',
  'apoyo',
])

export const estadoPagoEnum = pgEnum('estado_pago', [
  'pendiente',
  'pagado',
  'anulado',
])

export const metodoPagoEnum = pgEnum('metodo_pago', [
  'efectivo',
  'transferencia',
  'deposito',
  'otro',
])

// ─────────────────────────────────────────
// 1. USUARIOS
// Varios usuarios desde Fase 1, cada uno con rol y país de gestión
// ─────────────────────────────────────────

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  supabase_auth_id: uuid('supabase_auth_id').notNull().unique(),
  email: text('email').notNull().unique(),
  nombre: text('nombre').notNull(),
  rol: rolUsuarioEnum('rol').notNull(),
  pais_gestion: paisEnum('pais_gestion'), // null = ambos países
  activo: boolean('activo').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─────────────────────────────────────────
// 2. EMPRESAS CLIENTE
// Empresas de transporte de carga/pasajeros que contratan el servicio
// ─────────────────────────────────────────

export const empresas_cliente = pgTable('empresas_cliente', {
  id: uuid('id').primaryKey().defaultRandom(),
  razon_social: text('razon_social').notNull(),
  pais_domicilio: paisEnum('pais_domicilio').notNull(),

  // Identificador fiscal — RUT si es Chile, NIT si es Bolivia
  identificador_fiscal: text('identificador_fiscal').notNull(),

  direccion: text('direccion'),
  ciudad: text('ciudad'),

  contacto_nombre: text('contacto_nombre'),
  telefono: text('telefono'),
  email: text('email'),

  activo: boolean('activo').notNull().default(true),
  notas: text('notas'),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  created_by: uuid('created_by').references(() => usuarios.id),
}, (t) => ({
  idx_identificador_fiscal: index('idx_empresas_identificador_fiscal').on(t.identificador_fiscal),
  idx_razon_social: index('idx_empresas_razon_social').on(t.razon_social),
}))

// ─────────────────────────────────────────
// 3. VEHÍCULOS
// Parque automotor habilitado por empresa cliente
// ─────────────────────────────────────────

export const vehiculos = pgTable('vehiculos', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresa_id: uuid('empresa_id').notNull().references(() => empresas_cliente.id),

  patente: text('patente').notNull(),
  pais_matricula: paisEnum('pais_matricula').notNull(),
  // Clase del vehículo tal cual el certificado del R.V.M. (ej. CAMION, REMOLQUE, TRACTOCAMION)
  tipo_vehiculo: text('tipo_vehiculo').notNull(),

  marca: text('marca'),
  modelo: text('modelo'),
  anio: integer('anio'),

  estado: estadoVehiculoEnum('estado').notNull().default('habilitado'),
  fecha_habilitacion: date('fecha_habilitacion'),
  fecha_vencimiento_habilitacion: date('fecha_vencimiento_habilitacion'),

  notas: text('notas'),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  created_by: uuid('created_by').references(() => usuarios.id),
}, (t) => ({
  idx_patente: uniqueIndex('idx_vehiculos_patente').on(t.patente, t.pais_matricula),
  idx_empresa: index('idx_vehiculos_empresa').on(t.empresa_id),
}))

// ─────────────────────────────────────────
// 4. TIPOS DE TRÁMITE (catálogo)
// Define país de origen, tarifa y vigencia por defecto
// ─────────────────────────────────────────

export const tipos_tramite = pgTable('tipos_tramite', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  pais: paisEnum('pais').notNull(), // define a qué caja se destina el pago
  descripcion: text('descripcion'),

  precio: decimal('precio', { precision: 14, scale: 2 }).notNull(),
  moneda: monedaEnum('moneda').notNull(), // debe coincidir con el país

  vigencia_meses: integer('vigencia_meses'), // duración del permiso emitido, null = no aplica
  requiere_vehiculo: boolean('requiere_vehiculo').notNull().default(true),

  activo: boolean('activo').notNull().default(true),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idx_pais: index('idx_tipos_tramite_pais').on(t.pais),
}))

// ─────────────────────────────────────────
// 5. TRÁMITES
// ─────────────────────────────────────────

export const tramites = pgTable('tramites', {
  id: uuid('id').primaryKey().defaultRandom(),
  numero: integer('numero').generatedByDefaultAsIdentity().notNull().unique(), // correlativo autogenerado

  tipo_tramite_id: uuid('tipo_tramite_id').notNull().references(() => tipos_tramite.id),
  pais: paisEnum('pais').notNull(), // copiado del tipo de trámite al crear — inmutable; define la "caja" para reportes

  empresa_id: uuid('empresa_id').notNull().references(() => empresas_cliente.id),

  estado: estadoTramiteEnum('estado').notNull().default('en_curso'),

  fecha_solicitud: date('fecha_solicitud').notNull(),
  fecha_aprobacion: date('fecha_aprobacion'),
  fecha_vigencia_desde: date('fecha_vigencia_desde'), // inmutable una vez en estado 'concluido'
  fecha_vigencia_hasta: date('fecha_vigencia_hasta'), // inmutable una vez en estado 'concluido'

  // Referencia documental ante la autoridad (FAX/REX, plazo de respuesta, respaldo)
  referencia_doc_inicial: text('referencia_doc_inicial'), // ej: 'FAX 465/2026'
  fecha_plazo: date('fecha_plazo'),                        // fecha límite de resolución
  referencia_doc_respaldo: text('referencia_doc_respaldo'), // ej: 'RA 0589', 'Reporte Bs.'

  monto_total: decimal('monto_total', { precision: 14, scale: 2 }).notNull(),
  moneda: monedaEnum('moneda').notNull(), // moneda en que se cotizó/acordó el trámite

  tramite_reemplazado_id: uuid('tramite_reemplazado_id'), // si nace de una renovación/corrección

  notas: text('notas'),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  created_by: uuid('created_by').references(() => usuarios.id),
}, (t) => ({
  idx_pais: index('idx_tramites_pais').on(t.pais),
  idx_estado: index('idx_tramites_estado').on(t.estado),
  idx_empresa: index('idx_tramites_empresa').on(t.empresa_id),
  idx_vigencia_hasta: index('idx_tramites_vigencia_hasta').on(t.fecha_vigencia_hasta),
}))

// ─────────────────────────────────────────
// 5b. TRÁMITES ↔ VEHÍCULOS (muchos a muchos)
// Un trámite puede afectar varias patentes a la vez (altas/bajas conjuntas)
// ─────────────────────────────────────────

export const tramite_vehiculos = pgTable('tramite_vehiculos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tramite_id: uuid('tramite_id').notNull().references(() => tramites.id),
  vehiculo_id: uuid('vehiculo_id').notNull().references(() => vehiculos.id),
}, (t) => ({
  idx_unico: uniqueIndex('idx_tramite_vehiculo_unico').on(t.tramite_id, t.vehiculo_id),
  idx_vehiculo: index('idx_tramite_vehiculos_vehiculo').on(t.vehiculo_id),
}))

// ─────────────────────────────────────────
// 6. PAGOS
// Pueden ser parciales; moneda libre por pago (no atada al país del trámite)
// ─────────────────────────────────────────

export const pagos = pgTable('pagos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tramite_id: uuid('tramite_id').notNull().references(() => tramites.id),

  pais_destino: paisEnum('pais_destino').notNull(), // copiado de tramites.pais — define la "caja" del reporte, no la moneda
  pais_recepcion: paisEnum('pais_recepcion').notNull(), // dónde se cobró físicamente — puede diferir de pais_destino (ej. cliente paga en Chile un trámite de Bolivia)
  monto: decimal('monto', { precision: 14, scale: 2 }).notNull(),
  moneda: monedaEnum('moneda').notNull(), // libre: CLP, BOB o USD según cómo se pagó realmente

  metodo_pago: metodoPagoEnum('metodo_pago').notNull().default('efectivo'),
  estado: estadoPagoEnum('estado').notNull().default('pendiente'),
  responsable_cobro_id: uuid('responsable_cobro_id').notNull().references(() => usuarios.id),

  // Pagos de trámites de Bolivia requieren validación de un usuario con
  // pais_gestion = 'bolivia' antes de quedar 'pagado'; los de Chile no la requieren
  // y quedan 'pagado' de inmediato (ver CLAUDE.md / regla de negocio de validación)
  validado_por_id: uuid('validado_por_id').references(() => usuarios.id),
  fecha_validacion: timestamp('fecha_validacion', { withTimezone: true }),

  fecha_pago: date('fecha_pago').notNull(),
  comprobante_url: text('comprobante_url'), // Supabase Storage

  notas: text('notas'),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  created_by: uuid('created_by').references(() => usuarios.id),
}, (t) => ({
  idx_tramite: index('idx_pagos_tramite').on(t.tramite_id),
  idx_pais_destino: index('idx_pagos_pais_destino').on(t.pais_destino),
  idx_pais_recepcion: index('idx_pagos_pais_recepcion').on(t.pais_recepcion),
  idx_fecha_pago: index('idx_pagos_fecha').on(t.fecha_pago),
}))

// ─────────────────────────────────────────
// 7. DOCUMENTOS GENERADOS
// ─────────────────────────────────────────

export const documentos_generados = pgTable('documentos_generados', {
  id: uuid('id').primaryKey().defaultRandom(),
  tramite_id: uuid('tramite_id').notNull().references(() => tramites.id),

  tipo_documento: text('tipo_documento').notNull(), // ej: 'permiso', 'comprobante_pago', 'formulario_solicitud'
  archivo_url: text('archivo_url').notNull(), // Supabase Storage

  fecha_emision: date('fecha_emision').notNull(),
  notas: text('notas'),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  created_by: uuid('created_by').references(() => usuarios.id),
}, (t) => ({
  idx_tramite: index('idx_documentos_tramite').on(t.tramite_id),
}))

// ─────────────────────────────────────────
// 8. AUDIT LOG
// Solo INSERT — nunca UPDATE/DELETE
// ─────────────────────────────────────────

export const audit_log = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  entidad: text('entidad').notNull(), // ej: 'tramite', 'pago', 'vehiculo'
  entidad_id: uuid('entidad_id').notNull(),
  accion: text('accion').notNull(), // ej: 'cambio_estado', 'creacion', 'anulacion'
  estado_anterior: text('estado_anterior'),
  estado_nuevo: text('estado_nuevo'),
  detalle: text('detalle'),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  created_by: uuid('created_by').references(() => usuarios.id),
}, (t) => ({
  idx_entidad: index('idx_audit_entidad').on(t.entidad, t.entidad_id),
}))

// ─────────────────────────────────────────
// RELACIONES
// ─────────────────────────────────────────

export const empresasClienteRelations = relations(empresas_cliente, ({ many }) => ({
  vehiculos: many(vehiculos),
  tramites: many(tramites),
}))

export const vehiculosRelations = relations(vehiculos, ({ one, many }) => ({
  empresa: one(empresas_cliente, {
    fields: [vehiculos.empresa_id],
    references: [empresas_cliente.id],
  }),
  tramiteVehiculos: many(tramite_vehiculos),
}))

export const tiposTramiteRelations = relations(tipos_tramite, ({ many }) => ({
  tramites: many(tramites),
}))

export const tramitesRelations = relations(tramites, ({ one, many }) => ({
  tipoTramite: one(tipos_tramite, {
    fields: [tramites.tipo_tramite_id],
    references: [tipos_tramite.id],
  }),
  empresa: one(empresas_cliente, {
    fields: [tramites.empresa_id],
    references: [empresas_cliente.id],
  }),
  vehiculos: many(tramite_vehiculos),
  pagos: many(pagos),
  documentos: many(documentos_generados),
}))

export const tramiteVehiculosRelations = relations(tramite_vehiculos, ({ one }) => ({
  tramite: one(tramites, {
    fields: [tramite_vehiculos.tramite_id],
    references: [tramites.id],
  }),
  vehiculo: one(vehiculos, {
    fields: [tramite_vehiculos.vehiculo_id],
    references: [vehiculos.id],
  }),
}))

export const pagosRelations = relations(pagos, ({ one }) => ({
  tramite: one(tramites, {
    fields: [pagos.tramite_id],
    references: [tramites.id],
  }),
  responsableCobro: one(usuarios, {
    fields: [pagos.responsable_cobro_id],
    references: [usuarios.id],
  }),
  validadoPor: one(usuarios, {
    fields: [pagos.validado_por_id],
    references: [usuarios.id],
  }),
}))

export const documentosGeneradosRelations = relations(documentos_generados, ({ one }) => ({
  tramite: one(tramites, {
    fields: [documentos_generados.tramite_id],
    references: [tramites.id],
  }),
}))
