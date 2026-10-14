ALTER TABLE "actividad_diaria" ADD COLUMN "ventana_inicio" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "actividad_diaria" ADD COLUMN "ventana_n" smallint DEFAULT 0 NOT NULL;