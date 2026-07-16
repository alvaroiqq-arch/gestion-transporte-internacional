ALTER TABLE "vehiculos" ALTER COLUMN "tipo_vehiculo" SET DATA TYPE text USING "tipo_vehiculo"::text;--> statement-breakpoint
DROP TYPE "public"."tipo_vehiculo";