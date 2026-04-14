/*
  # Create API keys table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key) - unique identifier
      - `label` (text, not null) - user-friendly name for the key (e.g. "VEO_API")
      - `api_key` (text, not null) - the actual Gemini API key value
      - `is_default` (boolean, default false) - whether this is the default key to use
      - `created_at` (timestamptz, default now()) - when the key was added

  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for anonymous users to read all keys (app has no auth)
    - Add policy for anonymous users to insert keys
    - Add policy for anonymous users to update keys
    - Add policy for anonymous users to delete keys

  3. Important Notes
    - This table stores multiple Gemini API keys each with a label
    - Users select which key to use via a dropdown in the UI
    - Since this app has no authentication, policies allow anon access
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  api_key text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read api_keys"
  ON api_keys FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert api_keys"
  ON api_keys FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update api_keys"
  ON api_keys FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete api_keys"
  ON api_keys FOR DELETE
  TO anon
  USING (true);
