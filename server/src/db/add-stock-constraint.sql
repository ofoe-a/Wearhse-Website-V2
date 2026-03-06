-- Migration: Add CHECK constraint to prevent negative stock
-- Run this on your existing database:
--   psql $DATABASE_URL -f server/src/db/add-stock-constraint.sql

ALTER TABLE product_variants
    ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);
