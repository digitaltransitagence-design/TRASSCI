-- Trass CI — migration v2 : règles tarifaires, valeur déclarée, partenaires détaillés
-- À exécuter après schema.sql sur Insforge (PostgreSQL).

-- Destinations éditables (prix modifiables depuis l’admin)
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

-- Paramètres globaux (frais ramassage Abidjan, assurance, dépôt)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colis : destinataire, valeur déclarée (assurance)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS receiver_name TEXT NOT NULL DEFAULT '';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS declared_value INTEGER NOT NULL DEFAULT 0;

-- Partenaires : conditions & contacts
ALTER TABLE partners ADD COLUMN IF NOT EXISTS conditions_text TEXT NOT NULL DEFAULT '';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS whatsapp TEXT NOT NULL DEFAULT '';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';

-- Données par défaut destinations (alignées sur l’ancien barème)
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
