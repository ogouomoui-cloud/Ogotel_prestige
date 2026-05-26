-- ============================================================
--  OGOTEL PRESTIGE — Migration v5
--  Corrections : essentiel → starter + colonnes manquantes
-- ============================================================
--  À exécuter dans Supabase → SQL Editor → Run
--  Si la base est vierge, exécutez schema.sql directement.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
--  1. Ajouter les colonnes manquantes à subscription_requests
-- ═══════════════════════════════════════════════════════════════

-- Ajouter whatsapp si absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_requests'
      AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE subscription_requests
      ADD COLUMN whatsapp TEXT;
  END IF;
END $$;

-- Ajouter city si absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_requests'
      AND column_name = 'city'
  ) THEN
    ALTER TABLE subscription_requests
      ADD COLUMN city TEXT;
  END IF;
END $$;

-- Ajouter room_count si absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_requests'
      AND column_name = 'room_count'
  ) THEN
    ALTER TABLE subscription_requests
      ADD COLUMN room_count INTEGER;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
--  2. Renommer essentiel → starter dans le type plan_tier
--     (PostgreSQL 12+ : ALTER TYPE ... RENAME VALUE)
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_has_essentiel BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'plan_tier'
      AND pg_enum.enumlabel = 'essentiel'
  ) INTO v_has_essentiel;

  IF v_has_essentiel THEN
    -- PostgreSQL 12+ : renommer directement la valeur de l'enum
    ALTER TYPE plan_tier RENAME VALUE 'essentiel' TO 'starter';
  END IF;

  -- Vérifier que 'starter' existe (si le schéma a été créé avec schema.sql)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'plan_tier'
      AND pg_enum.enumlabel = 'starter'
  ) THEN
    ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'starter';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
--  3. Mettre à jour les plans avec les bons prix
-- ═══════════════════════════════════════════════════════════════

-- Starter : 20 000 FCFA
UPDATE plans SET price_monthly = 20000, max_rooms = 20, max_users = 2
WHERE tier = 'starter' AND price_monthly != 20000;

-- Pro : 50 000 FCFA
UPDATE plans SET price_monthly = 50000, max_rooms = 100, max_users = 10
WHERE tier = 'pro' AND price_monthly != 50000;

-- Prestige : 90 000 FCFA
UPDATE plans SET price_monthly = 90000, max_hotels = 999, max_rooms = 999, max_users = 999
WHERE tier = 'prestige' AND price_monthly != 90000;

-- Mettre à jour le commentaire
COMMENT ON TABLE plans IS 'Plans d''abonnement — 3 offres Starter / Pro / Prestige';
