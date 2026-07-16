ALTER TABLE "pagos" ADD COLUMN "validado_por_id" uuid;--> statement-breakpoint
ALTER TABLE "pagos" ADD COLUMN "fecha_validacion" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_validado_por_id_usuarios_id_fk" FOREIGN KEY ("validado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;