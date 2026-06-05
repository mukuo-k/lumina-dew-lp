CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  skin_concern TEXT NOT NULL,
  product_interest TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  demo_confirmation INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'lp',
  user_agent TEXT,
  cf_country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_created_at
  ON reservations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON reservations (status);
