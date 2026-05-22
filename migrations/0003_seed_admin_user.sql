-- Phase 3: bootstrap first admin account (change password immediately in production)
PRAGMA foreign_keys = ON;

INSERT OR REPLACE INTO admin_users (
  id,
  email,
  password_hash,
  role,
  is_active,
  last_login_at,
  created_at,
  updated_at
) VALUES (
  'admin_default',
  'admin@example.com',
  'pbkdf2$sha256$100000$b51c9239a747fc8220c2f86d766e8777$M4QkiMMmHvzbFOim0FMefeTh8mutXWYheiEu8bZ/lFY=',
  'admin',
  1,
  NULL,
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);
