CREATE TABLE IF NOT EXISTS "synchronizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "luxembourg_address_lines" ALTER COLUMN "line" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_address_lines" ALTER COLUMN "calcr_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_address_lines" ALTER COLUMN "id_geoportal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_address_lines" ALTER COLUMN "latitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_address_lines" ALTER COLUMN "longitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_localities" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_municipalities" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_municipalities" ALTER COLUMN "calcr_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_postal_codes" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_streets" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_streets" ALTER COLUMN "calcr_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "luxembourg_address_lines" ADD CONSTRAINT "luxembourg_address_lines_calcr_id_unique" UNIQUE("calcr_id");--> statement-breakpoint
ALTER TABLE "luxembourg_municipalities" ADD CONSTRAINT "luxembourg_municipalities_calcr_id_unique" UNIQUE("calcr_id");--> statement-breakpoint
ALTER TABLE "luxembourg_postal_codes" ADD CONSTRAINT "luxembourg_postal_codes_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "luxembourg_streets" ADD CONSTRAINT "luxembourg_streets_calcr_id_unique" UNIQUE("calcr_id");