CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at bigint DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
);

CREATE TABLE IF NOT EXISTS texts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) NOT NULL,
  "originalTitle" text,
  "originalBody" text,
  "correctedTitle" text,
  "correctedBody" text,
  summary text,
  tags jsonb DEFAULT '[]'::jsonb,
  "bibleCitations" jsonb DEFAULT '[]'::jsonb,
  versions jsonb DEFAULT '[]'::jsonb,
  "creationDate" text,
  "savedAt" bigint,
  "isFavorite" boolean DEFAULT false,
  "collectionId" uuid
);

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT 'indigo'
);
