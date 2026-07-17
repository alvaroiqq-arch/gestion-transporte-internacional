ALTER TABLE "pagos" ADD COLUMN "pais_recepcion" "pais" NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_pagos_pais_recepcion" ON "pagos" USING btree ("pais_recepcion");