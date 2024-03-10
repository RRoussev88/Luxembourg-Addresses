CREATE TABLE IF NOT EXISTS "calcr_feature" (
	"id" serial PRIMARY KEY NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"rue" varchar(50),
	"numero" varchar(10),
	"localite" varchar(30),
	"code_postal" integer,
	"id_caclr_rue" integer,
	"id_caclr_bat" integer,
	"id_geoportail" varchar(50),
	"commune" varchar(30),
	"lau" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_address_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"line" varchar(10),
	"calcr_id" integer,
	"id_geoportal" varchar(50),
	"latitude" double precision,
	"longitude" double precision,
	"street_id" integer NOT NULL,
	"postal_code_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_localities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50),
	"municipality_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_municipalities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50),
	"calcr_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_postal_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10),
	"locality_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "luxembourg_streets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50),
	"calcr_id" integer,
	"locality_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "address_line_calcr_idx" ON "luxembourg_address_lines" ("calcr_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "locality_name_municipality_idx" ON "luxembourg_localities" ("name","municipality_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "municipality_calcr_idx" ON "luxembourg_municipalities" ("calcr_id");--> statement-breakpoint
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
 ALTER TABLE "luxembourg_localities" ADD CONSTRAINT "luxembourg_localities_municipality_id_luxembourg_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "luxembourg_municipalities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luxembourg_postal_codes" ADD CONSTRAINT "luxembourg_postal_codes_locality_id_luxembourg_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "luxembourg_localities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "luxembourg_streets" ADD CONSTRAINT "luxembourg_streets_locality_id_luxembourg_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "luxembourg_localities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
