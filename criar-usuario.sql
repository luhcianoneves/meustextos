-- Rodar no pgAdmin (query tool do banco meustextos)
INSERT INTO users (id, email, password_hash, created_at)
VALUES (
  gen_random_uuid(),
  'pr_luhciano@hotmail.com',
  '$2b$10$cedMSavD9JdlvsPxVoqdDO9b/9/eHTHEtBwIvAsALEtnH2qGq28Em',
  EXTRACT(EPOCH FROM NOW())::bigint * 1000
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Verificar
SELECT id, email, created_at FROM users WHERE email = 'pr_luhciano@hotmail.com';
