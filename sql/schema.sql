-- Trass CI — schéma complet (Insforge / PostgreSQL)
-- Exécuter une fois dans l’éditeur SQL du projet.

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  conditions_text TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coursiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DISPONIBLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS destinations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(active);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL DEFAULT '',
  receiver_phone TEXT NOT NULL,
  declared_value INTEGER NOT NULL DEFAULT 0,
  destination TEXT NOT NULL,
  nature TEXT NOT NULL DEFAULT 'Document',
  delivery_mode TEXT NOT NULL DEFAULT 'depot',
  has_insurance BOOLEAN NOT NULL DEFAULT false,
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  partner_id TEXT REFERENCES partners(id) ON DELETE SET NULL,
  coursier_id TEXT REFERENCES coursiers(id) ON DELETE SET NULL,
  photo_url TEXT,
  issue TEXT,
  rating INTEGER,
  pickup_address TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_partner ON packages(partner_id);

CREATE TABLE IF NOT EXISTS package_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  date_text TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_package_history_pkg ON package_history(package_id);

CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  author_label TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_created ON admin_notes(created_at DESC);

CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'status_change',
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_pkg ON notification_events(package_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_created ON notification_events(created_at DESC);

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

CREATE TABLE IF NOT EXISTS client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT '',
  google_id TEXT UNIQUE,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_accounts_email ON client_accounts(lower(email));

INSERT INTO partners (id, name, route, contact, active) VALUES
  ('P-SBTA', 'SBTA Transport', 'Nord', '0700112233', true),
  ('P-UTB', 'UTB', 'Centre/Ouest', '0500445566', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coursiers (id, name, phone, status) VALUES
  ('C-01', 'Moussa (Moto 1)', '0102030405', 'DISPONIBLE'),
  ('C-02', 'Kouassi (Camionnette)', '0506070809', 'EN_COURSE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO destinations (id, name, price, active, sort_order) VALUES
  ('korhogo', 'Korhogo', 3000, true, 1),
  ('bouake', 'Bouaké', 2000, true, 2),
  ('san-pedro', 'San Pedro', 3500, true, 3),
  ('yamoussoukro', 'Yamoussoukro', 1500, true, 4),
  ('man', 'Man', 4000, true, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('fee_ramassage', '1500'),
  ('fee_insurance', '1000'),
  ('fee_depot', '0')
ON CONFLICT (key) DO NOTHING;
