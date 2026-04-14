/*
  # Add reference image URL to projects

  1. Modified Tables
    - `projects`
      - Added `reference_image_url` (text, nullable) - URL of a reference image for the first video generation

  2. Important Notes
    - The reference image is optional and used only for the first video expansion
    - Subsequent expansions use the previous video's output as reference automatically
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'reference_image_url'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN reference_image_url text;
  END IF;
END $$;
