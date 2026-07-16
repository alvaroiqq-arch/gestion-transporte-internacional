CREATE TYPE "public"."estado_pago" AS ENUM('pendiente', 'pagado', 'anulado');--> statement-breakpoint
CREATE TYPE "public"."estado_tramite" AS ENUM('en_curso', 'pendiente_observado', 'concluido', 'anulado');--> statement-breakpoint
CREATE TYPE "public"."estado_vehiculo" AS ENUM('habilitado', 'inhabilitado', 'suspendido');--> statement-breakpoint
CREATE TYPE "public"."metodo_pago" AS ENUM('efectivo', 'transferencia', 'deposito', 'otro');--> statement-breakpoint
CREATE TYPE "public"."moneda" AS ENUM('CLP', 'BOB', 'USD');--> statement-breakpoint
CREATE TYPE "public"."pais" AS ENUM('chile', 'bolivia');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('administrador', 'colaborador', 'apoyo');--> statement-breakpoint
CREATE TYPE "public"."tipo_vehiculo" AS ENUM('carga', 'pasajeros');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidad" text NOT NULL,
	"entidad_id" uuid NOT NULL,
	"accion" text NOT NULL,
	"estado_anterior" text,
	"estado_nuevo" text,
	"detalle" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "documentos_generados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tramite_id" uuid NOT NULL,
	"tipo_documento" text NOT NULL,
	"archivo_url" text NOT NULL,
	"fecha_emision" date NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "empresas_cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"razon_social" text NOT NULL,
	"pais_domicilio" "pais" NOT NULL,
	"identificador_fiscal" text NOT NULL,
	"direccion" text,
	"ciudad" text,
	"contacto_nombre" text,
	"telefono" text,
	"email" text,
	"activo" boolean DEFAULT true NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pagos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tramite_id" uuid NOT NULL,
	"pais_destino" "pais" NOT NULL,
	"monto" numeric(14, 2) NOT NULL,
	"moneda" "moneda" NOT NULL,
	"metodo_pago" "metodo_pago" DEFAULT 'efectivo' NOT NULL,
	"estado" "estado_pago" DEFAULT 'pendiente' NOT NULL,
	"responsable_cobro_id" uuid NOT NULL,
	"fecha_pago" date NOT NULL,
	"comprobante_url" text,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "tipos_tramite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"pais" "pais" NOT NULL,
	"descripcion" text,
	"precio" numeric(14, 2) NOT NULL,
	"moneda" "moneda" NOT NULL,
	"vigencia_meses" integer,
	"requiere_vehiculo" boolean DEFAULT true NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tramite_vehiculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tramite_id" uuid NOT NULL,
	"vehiculo_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tramites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer NOT NULL,
	"tipo_tramite_id" uuid NOT NULL,
	"pais" "pais" NOT NULL,
	"empresa_id" uuid NOT NULL,
	"estado" "estado_tramite" DEFAULT 'en_curso' NOT NULL,
	"fecha_solicitud" date NOT NULL,
	"fecha_aprobacion" date,
	"fecha_vigencia_desde" date,
	"fecha_vigencia_hasta" date,
	"referencia_doc_inicial" text,
	"fecha_plazo" date,
	"referencia_doc_respaldo" text,
	"monto_total" numeric(14, 2) NOT NULL,
	"moneda" "moneda" NOT NULL,
	"tramite_reemplazado_id" uuid,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "tramites_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_auth_id" uuid NOT NULL,
	"email" text NOT NULL,
	"nombre" text NOT NULL,
	"rol" "rol_usuario" NOT NULL,
	"pais_gestion" "pais",
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_supabase_auth_id_unique" UNIQUE("supabase_auth_id"),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehiculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"patente" text NOT NULL,
	"pais_matricula" "pais" NOT NULL,
	"tipo_vehiculo" "tipo_vehiculo" NOT NULL,
	"marca" text,
	"modelo" text,
	"anio" integer,
	"estado" "estado_vehiculo" DEFAULT 'habilitado' NOT NULL,
	"fecha_habilitacion" date,
	"fecha_vencimiento_habilitacion" date,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_generados" ADD CONSTRAINT "documentos_generados_tramite_id_tramites_id_fk" FOREIGN KEY ("tramite_id") REFERENCES "public"."tramites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_generados" ADD CONSTRAINT "documentos_generados_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empresas_cliente" ADD CONSTRAINT "empresas_cliente_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_tramite_id_tramites_id_fk" FOREIGN KEY ("tramite_id") REFERENCES "public"."tramites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_responsable_cobro_id_usuarios_id_fk" FOREIGN KEY ("responsable_cobro_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tramite_vehiculos" ADD CONSTRAINT "tramite_vehiculos_tramite_id_tramites_id_fk" FOREIGN KEY ("tramite_id") REFERENCES "public"."tramites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tramite_vehiculos" ADD CONSTRAINT "tramite_vehiculos_vehiculo_id_vehiculos_id_fk" FOREIGN KEY ("vehiculo_id") REFERENCES "public"."vehiculos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_tipo_tramite_id_tipos_tramite_id_fk" FOREIGN KEY ("tipo_tramite_id") REFERENCES "public"."tipos_tramite"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_empresa_id_empresas_cliente_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas_cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_empresa_id_empresas_cliente_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas_cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_entidad" ON "audit_log" USING btree ("entidad","entidad_id");--> statement-breakpoint
CREATE INDEX "idx_documentos_tramite" ON "documentos_generados" USING btree ("tramite_id");--> statement-breakpoint
CREATE INDEX "idx_empresas_identificador_fiscal" ON "empresas_cliente" USING btree ("identificador_fiscal");--> statement-breakpoint
CREATE INDEX "idx_empresas_razon_social" ON "empresas_cliente" USING btree ("razon_social");--> statement-breakpoint
CREATE INDEX "idx_pagos_tramite" ON "pagos" USING btree ("tramite_id");--> statement-breakpoint
CREATE INDEX "idx_pagos_pais_destino" ON "pagos" USING btree ("pais_destino");--> statement-breakpoint
CREATE INDEX "idx_pagos_fecha" ON "pagos" USING btree ("fecha_pago");--> statement-breakpoint
CREATE INDEX "idx_tipos_tramite_pais" ON "tipos_tramite" USING btree ("pais");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tramite_vehiculo_unico" ON "tramite_vehiculos" USING btree ("tramite_id","vehiculo_id");--> statement-breakpoint
CREATE INDEX "idx_tramite_vehiculos_vehiculo" ON "tramite_vehiculos" USING btree ("vehiculo_id");--> statement-breakpoint
CREATE INDEX "idx_tramites_pais" ON "tramites" USING btree ("pais");--> statement-breakpoint
CREATE INDEX "idx_tramites_estado" ON "tramites" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_tramites_empresa" ON "tramites" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "idx_tramites_vigencia_hasta" ON "tramites" USING btree ("fecha_vigencia_hasta");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vehiculos_patente" ON "vehiculos" USING btree ("patente","pais_matricula");--> statement-breakpoint
CREATE INDEX "idx_vehiculos_empresa" ON "vehiculos" USING btree ("empresa_id");