-- Migration number: 0002 	 index for the region status reads

-- regionStatus filters imports by kind, status and region on every uncached
-- region page; without this each read scans the whole (never pruned) table.
CREATE INDEX imports_status ON imports (kind, status, region, updated_at);
