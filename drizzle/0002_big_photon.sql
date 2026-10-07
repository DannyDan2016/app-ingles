CREATE TYPE "public"."origen_respuesta" AS ENUM('leccion', 'tramo', 'repaso');--> statement-breakpoint
CREATE TABLE "actividad_diaria" (
	"user_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"segundos" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "actividad_diaria_user_id_fecha_pk" PRIMARY KEY("user_id","fecha"),
	CONSTRAINT "actividad_segundos" CHECK ("actividad_diaria"."segundos" between 0 and 14400)
);
--> statement-breakpoint
CREATE TABLE "respuestas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"correcta" boolean NOT NULL,
	"origen" "origen_respuesta" NOT NULL,
	"caja" smallint,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tarjetas" (
	"user_id" uuid NOT NULL,
	"termino" text NOT NULL,
	"nivel" "nivel" NOT NULL,
	"caja" smallint DEFAULT 1 NOT NULL,
	"proxima_at" timestamp with time zone NOT NULL,
	"ultima_at" timestamp with time zone,
	"aciertos" integer DEFAULT 0 NOT NULL,
	"fallos" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tarjetas_user_id_termino_nivel_pk" PRIMARY KEY("user_id","termino","nivel"),
	CONSTRAINT "tarjetas_caja" CHECK ("tarjetas"."caja" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "meta_diaria_min" smallint DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "actividad_diaria" ADD CONSTRAINT "actividad_diaria_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "respuestas_user_at" ON "respuestas" USING btree ("user_id","at");--> statement-breakpoint
CREATE INDEX "tarjetas_user_proxima" ON "tarjetas" USING btree ("user_id","proxima_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_meta_diaria" CHECK ("users"."meta_diaria_min" in (5, 10, 15));