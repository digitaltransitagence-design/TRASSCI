-- Trass CI — tables public (Insforge / PostgREST)
-- Exécuter ce script dans l’éditeur SQL Insforge ou via migration projet.

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
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

-- Données initiales (partenaires & coursiers)
INSERT INTO partners (id, name, route, contact, active) VALUES
  ('P-SBTA', 'SBTA Transport', 'Nord', '0700112233', true),
  ('P-UTB', 'UTB', 'Centre/Ouest', '0500445566', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coursiers (id, name, phone, status) VALUES
  ('C-01', 'Moussa (Moto 1)', '0102030405', 'DISPONIBLE'),
  ('C-02', 'Kouassi (Camionnette)', '0506070809', 'EN_COURSE')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Enrichir la base (Insforge)
-- ---------------------------------------------------------------------------
-- 1) Ouvrir le projet sur insforge.dev → SQL / Database → exécuter les INSERT ci-dessous.
-- 2) Nouveau partenaire (gare / ligne) :
--    INSERT INTO partners (id, name, route, contact, active)
--    VALUES ('P-XXX', 'Nom affiché', 'Axe géographique', '07xxxxxxxx', true)
--    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, route = EXCLUDED.route, contact = EXCLUDED.contact, active = EXCLUDED.active;
-- 3) Nouveau coursier :
--    INSERT INTO coursiers (id, name, phone, status) VALUES ('C-XX', 'Prénom', '07xxxxxxxx', 'DISPONIBLE')
--    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, status = EXCLUDED.status;
-- 4) Modifier une ligne : UPDATE partners SET active = false WHERE id = 'P-XXX';
-- 5) Les colis (packages) sont créés par l’app / API ; pas d’insert manuel sauf tests.
-- ---------------------------------------------------------------------------
