-- Migration number: 0001 	 initial schema (DESIGN §3)

-- provenance: one row per fetch attempt. Never deleted.
CREATE TABLE imports (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL CHECK (region IN ('us','eu','kr','tw')),
  kind TEXT NOT NULL CHECK (kind IN ('region','realm')),
  realm TEXT,                                                      -- '{slug}-{faction}', NULL for region files
  source_url TEXT NOT NULL, r2_key TEXT, etag TEXT,
  updated_at INTEGER,                                              -- TSM scan time, unix s
  fetched_at INTEGER NOT NULL,                                     -- unix s
  rows INTEGER NOT NULL DEFAULT 0, sha256 TEXT,                    -- of the raw (ungzipped) file
  status TEXT NOT NULL CHECK (status IN ('imported','skipped','failed')), reason TEXT
) STRICT;
CREATE INDEX imports_url ON imports (source_url, id DESC);

CREATE TABLE items (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL          -- day numbers
) STRICT;

-- day = floor(updatedAt_unix / 86400): the UTC day of the upstream scan
CREATE TABLE region_snapshots (
  region TEXT NOT NULL CHECK (region IN ('us','eu','kr','tw')),
  day INTEGER NOT NULL, item_id INTEGER NOT NULL,
  market_value INTEGER NOT NULL, historical INTEGER NOT NULL, avg_sale_price INTEGER NOT NULL,
  sale_rate REAL NOT NULL, sold_per_day REAL NOT NULL, updated_at INTEGER NOT NULL,
  import_id INTEGER NOT NULL REFERENCES imports (id),              -- deliberately unindexed: fewer writes
  PRIMARY KEY (region, day, item_id)
) STRICT, WITHOUT ROWID;
CREATE INDEX region_snapshots_item ON region_snapshots (item_id, region, day);

-- one row per item per realm scan (every few hours)
CREATE TABLE realm_snapshots (
  region TEXT NOT NULL, realm TEXT NOT NULL,
  faction TEXT NOT NULL CHECK (faction IN ('alliance','horde')),
  item_id INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  day INTEGER NOT NULL,                                            -- floor(updated_at / 86400)
  market_value INTEGER NOT NULL, min_buyout INTEGER NOT NULL,      -- 0 = no listing
  recent INTEGER NOT NULL, historical INTEGER NOT NULL,            -- 0 = unknown
  import_id INTEGER NOT NULL REFERENCES imports (id),
  PRIMARY KEY (region, realm, faction, item_id, updated_at)
) STRICT, WITHOUT ROWID;
CREATE INDEX realm_snapshots_scan ON realm_snapshots (region, realm, faction, updated_at);
