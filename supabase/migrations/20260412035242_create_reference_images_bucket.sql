/*
  # Create storage bucket for reference images

  1. Storage
    - Create `reference-images` bucket for uploaded reference images
    - Allow public read access so edge functions can fetch the images
    - Allow anon uploads (app has no auth)

  2. Important Notes
    - Images uploaded here are used as visual references for Veo video generation
    - The bucket is public so the edge function can read image data to send to the Veo API
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow anon upload reference images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'reference-images');

CREATE POLICY "Allow public read reference images"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'reference-images');

CREATE POLICY "Allow anon delete reference images"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'reference-images');
