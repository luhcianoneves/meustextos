-- Criar tabelas para o Luciano's Scribe

-- Tabela de textos
CREATE TABLE IF NOT EXISTS texts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  "originalTitle" text,
  "originalBody" text,
  "correctedTitle" text,
  "correctedBody" text,
  summary text,
  tags jsonb DEFAULT '[]',
  "bibleCitations" jsonb DEFAULT '[]',
  versions jsonb DEFAULT '[]',
  "creationDate" text,
  "savedAt" bigint,
  "isFavorite" boolean DEFAULT false,
  "collectionId" uuid
);

-- Tabela de coleções/séries
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  description text,
  color text
);

-- Habilitar Row Level Security
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para texts
CREATE POLICY "Users podem ver seus próprios textos" ON texts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users podem criar seus próprios textos" ON texts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users podem atualizar seus próprios textos" ON texts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users podem deletar seus próprios textos" ON texts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas de acesso para collections
CREATE POLICY "Users podem ver suas próprias coleções" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users podem criar suas próprias coleções" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users podem atualizar suas próprias coleções" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users podem deletar suas próprias coleções" ON collections
  FOR DELETE USING (auth.uid() = user_id);