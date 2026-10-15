CREATE TYPE "public"."estado_intento" AS ENUM('en_curso', 'aprobado', 'suspendido', 'caducado');--> statement-breakpoint
CREATE TABLE "evaluacion_intentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nivel" "nivel" NOT NULL,
	"estado" "estado_intento" DEFAULT 'en_curso' NOT NULL,
	"preguntas" text[] NOT NULL,
	"iniciado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"terminado_at" timestamp with time zone,
	"nota" smallint,
	"nota_lectura" smallint,
	"nota_listening" smallint,
	"nota_vocabulario" smallint,
	"nota_gramatica" smallint,
	"refuerzo_completado_at" timestamp with time zone,
	CONSTRAINT "evaluacion_nota" CHECK ("evaluacion_intentos"."nota" between 0 and 100),
	CONSTRAINT "evaluacion_nota_lectura" CHECK ("evaluacion_intentos"."nota_lectura" between 0 and 100),
	CONSTRAINT "evaluacion_nota_listening" CHECK ("evaluacion_intentos"."nota_listening" between 0 and 100),
	CONSTRAINT "evaluacion_nota_vocabulario" CHECK ("evaluacion_intentos"."nota_vocabulario" between 0 and 100),
	CONSTRAINT "evaluacion_nota_gramatica" CHECK ("evaluacion_intentos"."nota_gramatica" between 0 and 100),
	CONSTRAINT "evaluacion_terminado" CHECK ("evaluacion_intentos"."estado" not in ('aprobado', 'suspendido') or "evaluacion_intentos"."terminado_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "evaluacion_respuestas" (
	"intento_id" uuid NOT NULL,
	"pregunta_id" text NOT NULL,
	"respuesta" text NOT NULL,
	"respondida_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evaluacion_respuestas_intento_id_pregunta_id_pk" PRIMARY KEY("intento_id","pregunta_id")
);
--> statement-breakpoint
ALTER TABLE "evaluacion_intentos" ADD CONSTRAINT "evaluacion_intentos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluacion_respuestas" ADD CONSTRAINT "evaluacion_respuestas_intento_id_evaluacion_intentos_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."evaluacion_intentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "evaluacion_un_intento_abierto" ON "evaluacion_intentos" USING btree ("user_id","nivel") WHERE "evaluacion_intentos"."estado" = 'en_curso';--> statement-breakpoint
CREATE INDEX "evaluacion_user_nivel_inicio" ON "evaluacion_intentos" USING btree ("user_id","nivel","iniciado_at");