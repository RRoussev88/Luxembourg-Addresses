CREATE TABLE IF NOT EXISTS "calcr_feature" (
	"id" serial PRIMARY KEY NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"rue" varchar(100),
	"numero" varchar(10),
	"localite" varchar(50),
	"code_postal" integer,
	"id_caclr_rue" integer,
	"id_caclr_bat" integer,
	"id_geoportail" varchar(100),
	"commune" varchar(50),
	"lau" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_address_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"line" varchar(100),
	"calcr_id" integer,
	"id_geoportail" varchar(100),
	"latitude" double precision,
	"longitude" double precision,
	"street_id" integer NOT NULL,
	"postal_code_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_communes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"calcr_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_localites" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"commune_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_postal_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10),
	"localite_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_streets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"calcr_id" integer,
	"localite_id" integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "address_line_calcr_idx" ON "luxembourg_address_lines" ("calcr_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commune_calcr_idx" ON "luxembourg_communes" ("calcr_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "localite_name_commune_idx" ON "luxembourg_localites" ("name","commune_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "post_code_idx" ON "luxembourg_postal_codes" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "street_calcr_idx" ON "luxembourg_streets" ("calcr_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luxembourg_address_lines" ADD CONSTRAINT "luxembourg_address_lines_street_id_luxembourg_streets_id_fk" FOREIGN KEY ("street_id") REFERENCES "luxembourg_streets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luxembourg_address_lines" ADD CONSTRAINT "luxembourg_address_lines_postal_code_id_luxembourg_postal_codes_id_fk" FOREIGN KEY ("postal_code_id") REFERENCES "luxembourg_postal_codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luxembourg_localites" ADD CONSTRAINT "luxembourg_localites_commune_id_luxembourg_communes_id_fk" FOREIGN KEY ("commune_id") REFERENCES "luxembourg_communes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luxembourg_postal_codes" ADD CONSTRAINT "luxembourg_postal_codes_localite_id_luxembourg_localites_id_fk" FOREIGN KEY ("localite_id") REFERENCES "luxembourg_localites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luxembourg_streets" ADD CONSTRAINT "luxembourg_streets_localite_id_luxembourg_localites_id_fk" FOREIGN KEY ("localite_id") REFERENCES "luxembourg_localites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
