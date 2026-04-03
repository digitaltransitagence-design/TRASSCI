-- Trass CI — comptes admin, équipes, permissions (exécuter dans Insforge si base existante)

CREATE TABLE IF NOT EXISTS admin_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  team_id UUID REFERENCES admin_teams(id) ON DELETE SET NULL,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_team_permissions (
  team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  PRIMARY KEY (team_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(lower(email));
