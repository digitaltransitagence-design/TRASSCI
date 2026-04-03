-- Trass CI — notes admin + journal notifications (bases déjà créées)
-- À exécuter dans l’éditeur SQL Insforge si la base existait avant ce fichier.

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
