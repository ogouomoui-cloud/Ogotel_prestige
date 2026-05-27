-- ============================================================
--  OGOTEL PRESTIGE — Schéma complet de la base de données
-- ============================================================
--  Version  : 2.0
--  Stack    : Supabase (PostgreSQL + Auth + RLS + RPC)
--  Multi-tenant : OUI — isolation stricte par hotel_id
--
--  ⚠️  CE SCRIPT EST DESTRUCTIF.
--  Décommentez la section "NETTOYAGE" ci-dessous pour
--  repartir d'une base vierge.
--  Sinon, exécutez-le sur une base vide.
--
--  Pour exécuter : coller dans Supabase → SQL Editor → Run
-- ============================================================


-- ═══════════════════════════════════════════════════════════════
--  0. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════════
--  NETTOYAGE (décommenter pour repartir de zéro)
-- ═══════════════════════════════════════════════════════════════

/*
DROP TABLE IF EXISTS activity_logs       CASCADE;
DROP TABLE IF EXISTS payments            CASCADE;
DROP TABLE IF EXISTS reservations        CASCADE;
DROP TABLE IF EXISTS guests              CASCADE;
DROP TABLE IF EXISTS rooms               CASCADE;
DROP TABLE IF EXISTS activation_codes    CASCADE;
DROP TABLE IF EXISTS subscriptions       CASCADE;
DROP TABLE IF EXISTS subscription_requests CASCADE;
DROP TABLE IF EXISTS profiles            CASCADE;
DROP TABLE IF EXISTS hotels              CASCADE;
DROP TABLE IF EXISTS plans               CASCADE;

DROP FUNCTION IF EXISTS handle_new_user()                        CASCADE;
DROP FUNCTION IF EXISTS set_activity_log_defaults()              CASCADE;
DROP FUNCTION IF EXISTS update_updated_at()                      CASCADE;
DROP FUNCTION IF EXISTS current_user_role()                      CASCADE;
DROP FUNCTION IF EXISTS current_user_hotel_id()                  CASCADE;
DROP FUNCTION IF EXISTS is_super_admin()                         CASCADE;
DROP FUNCTION IF EXISTS generate_activation_code(UUID, UUID)     CASCADE;
DROP FUNCTION IF EXISTS get_current_user_profile()               CASCADE;
DROP FUNCTION IF EXISTS is_db_initialized()                      CASCADE;
DROP FUNCTION IF EXISTS get_hotel_stats(UUID)                    CASCADE;
DROP FUNCTION IF EXISTS get_recent_reservations(UUID, INTEGER)   CASCADE;

DROP TYPE IF EXISTS activity_action      CASCADE;
DROP TYPE IF EXISTS payment_status       CASCADE;
DROP TYPE IF EXISTS payment_method        CASCADE;
DROP TYPE IF EXISTS reservation_status   CASCADE;
DROP TYPE IF EXISTS room_status          CASCADE;
DROP TYPE IF EXISTS room_status_old         CASCADE;
DROP TYPE IF EXISTS room_type            CASCADE;
DROP TYPE IF EXISTS code_status          CASCADE;
DROP TYPE IF EXISTS request_status       CASCADE;
DROP TYPE IF EXISTS subscription_status  CASCADE;
DROP TYPE IF EXISTS plan_tier            CASCADE;
DROP TYPE IF EXISTS user_role            CASCADE;
*/


-- ═══════════════════════════════════════════════════════════════
--  1. ENUMS
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'hotel_admin',
  'manager',
  'receptionist'
);

CREATE TYPE plan_tier AS ENUM (
  'starter',
  'pro',
  'prestige'
);

CREATE TYPE subscription_status AS ENUM (
  'trial',
  'active',
  'past_due',
  'cancelled',
  'expired'
);

CREATE TYPE request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE code_status AS ENUM (
  'unused',
  'used',
  'expired',
  'cancelled'
);

CREATE TYPE room_type AS ENUM (
  'standard',
  'deluxe',
  'suite',
  'presidentielle'
);

CREATE TYPE room_status AS ENUM (
  'disponible',
  'occupee',
  'maintenance',
  'reservee',
  'nettoyage'
);

CREATE TYPE reservation_status AS ENUM (
  'confirmee',
  'en_cours',
  'terminee',
  'annulee',
  'no_show'
);

CREATE TYPE payment_method AS ENUM (
  'especes',
  'carte',
  'mobile_money',
  'virement',
  'cheque'
);

CREATE TYPE payment_status AS ENUM (
  'en_attente',
  'payee',
  'annulee',
  'remboursee'
);

CREATE TYPE activity_action AS ENUM (
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'approve',
  'reject',
  'activate',
  'export'
);


-- ═══════════════════════════════════════════════════════════════
--  2. TABLES
-- ═══════════════════════════════════════════════════════════════

-- ─── 2.1 plans ────────────────────────────────────────────────
-- Les 3 offres commerciales OGOTEL Prestige.
-- Détermine : prix, max chambres, max utilisateurs.
CREATE TABLE plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  tier            plan_tier NOT NULL,
  price_monthly   INTEGER NOT NULL DEFAULT 0,
  max_hotels      INTEGER NOT NULL DEFAULT 1,
  max_rooms       INTEGER NOT NULL DEFAULT 15,
  max_users       INTEGER NOT NULL DEFAULT 3,
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT plans_tier_unique      UNIQUE (tier),
  CONSTRAINT plans_price_positive   CHECK (price_monthly >= 0)
);

COMMENT ON TABLE  plans IS 'Plans d''abonnement — 3 offres Starter / Pro / Prestige';
COMMENT ON COLUMN plans.price_monthly IS 'Prix mensuel en FCFA';
COMMENT ON COLUMN plans.features IS 'Liste JSON des fonctionnalités incluses';


-- ─── 2.2 hotels ───────────────────────────────────────────────
-- Chaque hôtel = 1 tenant. Toutes les données métier sont
-- isolées par hotel_id.
CREATE TABLE hotels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  address         TEXT,
  city            TEXT NOT NULL DEFAULT 'Abidjan',
  country         TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  star_rating     INTEGER NOT NULL DEFAULT 3,
  description     TEXT,
  total_rooms     INTEGER NOT NULL DEFAULT 0,
  timezone        TEXT NOT NULL DEFAULT 'Africa/Abidjan',
  currency        TEXT NOT NULL DEFAULT 'FCFA',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT hotels_star_rating     CHECK (star_rating BETWEEN 1 AND 5),
  CONSTRAINT hotels_total_rooms_pos CHECK (total_rooms >= 0)
);

COMMENT ON TABLE hotels IS 'Hôtels clients — chaque hôtel est un tenant multi-tenant';


-- ─── 2.3 profiles ────────────────────────────────────────────
-- Extension de auth.users. Un profil est automatiquement créé
-- par le trigger handle_new_user() à chaque inscription.
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  phone           TEXT,
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'receptionist',
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Profils liés à auth.users — rôle + rattachement hôtel';


-- ─── 2.4 subscription_requests ───────────────────────────────
-- Formulaire public. Tout visiteur peut soumettre une demande.
-- Le super_admin valide manuellement → approuve ou rejette.
CREATE TABLE subscription_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_name        TEXT NOT NULL,
  contact_name      TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  whatsapp          TEXT,
  city              TEXT,
  room_count        INTEGER,
  desired_plan      plan_tier NOT NULL DEFAULT 'starter',
  message           TEXT,
  status            request_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscription_requests IS 'Demandes d''abonnement — validation manuelle par super_admin';


-- ─── 2.5 subscriptions ────────────────────────────────────────
-- Lie un hôtel à un plan. Un seul abonnement actif par hôtel.
-- Le renouvellement est géré manuellement par le super_admin.
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status          subscription_status NOT NULL DEFAULT 'trial',
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  trial_ends_at   TIMESTAMPTZ,
  max_rooms       INTEGER NOT NULL,
  max_users       INTEGER NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Abonnements actifs — un par hôtel, lié à un plan';


-- ─── 2.6 activation_codes ─────────────────────────────────────
-- Générés quand le super_admin approuve une demande.
-- Le code est envoyé au demandeur pour créer son compte.
CREATE TABLE activation_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status          code_status NOT NULL DEFAULT 'unused',
  created_by      UUID REFERENCES auth.users(id),
  used_by         UUID REFERENCES auth.users(id),
  used_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  activation_codes IS 'Codes d''activation — créés à l''approbation d''une demande';
COMMENT ON COLUMN activation_codes.code IS 'Code hexadécimal unique de 12 caractères';


-- ─── 2.7 rooms ────────────────────────────────────────────────
-- Chambres d'un hôtel. Numérotation unique par hôtel.
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  number          TEXT NOT NULL,
  floor           INTEGER NOT NULL DEFAULT 1,
  room_type       room_type NOT NULL DEFAULT 'standard',
  status          room_status NOT NULL DEFAULT 'disponible',
  price_per_night INTEGER NOT NULL DEFAULT 0,
  capacity        INTEGER NOT NULL DEFAULT 2,
  amenities       JSONB NOT NULL DEFAULT '[]'::jsonb,
  description     TEXT,
  images          TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rooms_unique_number   UNIQUE (hotel_id, number),
  CONSTRAINT rooms_floor_positive  CHECK (floor >= 0),
  CONSTRAINT rooms_capacity_pos    CHECK (capacity >= 1),
  CONSTRAINT rooms_price_positive  CHECK (price_per_night >= 0)
);

COMMENT ON TABLE  rooms IS 'Chambres — multi-tenant via hotel_id';
COMMENT ON COLUMN rooms.price_per_night IS 'Prix par nuit en FCFA';


-- ─── 2.8 guests ───────────────────────────────────────────────
-- Fiche client. Chaque hôtel gère ses propres clients.
-- Un même client physique peut exister dans plusieurs hôtels
-- (multi-tenant = données isolées).
CREATE TABLE guests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id            UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT,
  phone               TEXT NOT NULL,
  id_document_type    TEXT,
  id_document_number  TEXT,
  nationality         TEXT NOT NULL DEFAULT 'CI',
  city                TEXT,
  notes               TEXT,
  is_vip              BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE guests IS 'Fiches clients — chaque hôtel gère ses propres clients';


-- ─── 2.9 reservations ─────────────────────────────────────────
-- Réservation d'une chambre. Les infos client sont dénormalisées
-- (guest_name, guest_email, guest_phone) pour un accès rapide
-- sans jointure sur la table guests.
CREATE TABLE reservations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id            UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id            UUID REFERENCES guests(id) ON DELETE SET NULL,
  room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
  guest_name          TEXT NOT NULL,
  guest_email         TEXT,
  guest_phone         TEXT,
  check_in            DATE NOT NULL,
  check_out           DATE NOT NULL,
  number_of_nights    INTEGER NOT NULL GENERATED ALWAYS AS (check_out - check_in) STORED,
  status              reservation_status NOT NULL DEFAULT 'confirmee',
  adults              INTEGER NOT NULL DEFAULT 1,
  children            INTEGER NOT NULL DEFAULT 0,
  room_type           room_type NOT NULL DEFAULT 'standard',
  total_amount        INTEGER NOT NULL DEFAULT 0,
  paid_amount         INTEGER NOT NULL DEFAULT 0,
  deposit_required    INTEGER NOT NULL DEFAULT 0,
  source              TEXT NOT NULL DEFAULT 'direct',
  notes               TEXT,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reservations_dates   CHECK (check_out > check_in),
  CONSTRAINT reservations_adults  CHECK (adults >= 1),
  CONSTRAINT reservations_children CHECK (children >= 0)
);

COMMENT ON TABLE  reservations IS 'Réservations de chambres — multi-tenant';
COMMENT ON COLUMN reservations.number_of_nights IS 'Calculé automatiquement : check_out - check_in';
COMMENT ON COLUMN reservations.total_amount IS 'Montant total en FCFA';
COMMENT ON COLUMN reservations.source IS 'Origine : direct, walk_in, booking_dot_com, expedia, etc.';


-- ─── 2.10 payments ────────────────────────────────────────────
-- Paiements liés à des réservations. Pas de paiement en ligne :
-- tout est enregistré manuellement (espèces, carte, mobile money…).
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_id        UUID REFERENCES guests(id) ON DELETE SET NULL,
  amount          INTEGER NOT NULL,
  method          payment_method NOT NULL DEFAULT 'especes',
  status          payment_status NOT NULL DEFAULT 'en_attente',
  reference       TEXT,
  paid_by         UUID REFERENCES auth.users(id),
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payments_amount_positive CHECK (amount > 0)
);

COMMENT ON TABLE  payments IS 'Paiements — liés aux réservations et clients';
COMMENT ON COLUMN payments.amount IS 'Montant en FCFA';
COMMENT ON COLUMN payments.reference IS 'N° de reçu ou référence de paiement';


-- ─── 2.11 activity_logs ───────────────────────────────────────
-- Journal d'audit. Enregistre chaque action importante pour
-- la traçabilité. Non modifiable après création.
CREATE TABLE activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id),
  user_role       user_role,
  action          activity_action NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  details         JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE activity_logs IS 'Journal d''audit — traçabilité des actions';


-- ═══════════════════════════════════════════════════════════════
--  3. INDEX
-- ═══════════════════════════════════════════════════════════════

-- profiles
CREATE INDEX idx_profiles_hotel_id ON profiles(hotel_id);
CREATE INDEX idx_profiles_role     ON profiles(role);
CREATE INDEX idx_profiles_email    ON profiles(email);

-- hotels
CREATE INDEX idx_hotels_city    ON hotels(city);
CREATE INDEX idx_hotels_active  ON hotels(is_active);

-- subscription_requests
CREATE INDEX idx_subreq_status ON subscription_requests(status);
CREATE INDEX idx_subreq_email   ON subscription_requests(email);

-- subscriptions
CREATE INDEX idx_sub_hotel   ON subscriptions(hotel_id);
CREATE INDEX idx_sub_status  ON subscriptions(status);

-- activation_codes
CREATE INDEX idx_actcode_code   ON activation_codes(code);
CREATE INDEX idx_actcode_hotel  ON activation_codes(hotel_id);
CREATE INDEX idx_actcode_status ON activation_codes(status);

-- rooms
CREATE INDEX idx_rooms_hotel       ON rooms(hotel_id);
CREATE INDEX idx_rooms_status      ON rooms(status);
CREATE INDEX idx_rooms_type        ON rooms(room_type);
CREATE INDEX idx_rooms_hotel_status ON rooms(hotel_id, status);

-- guests
CREATE INDEX idx_guests_hotel ON guests(hotel_id);
CREATE INDEX idx_guests_email  ON guests(email);
CREATE INDEX idx_guests_phone  ON guests(phone);
CREATE INDEX idx_guests_name   ON guests(last_name, first_name);

-- reservations
CREATE INDEX idx_res_hotel         ON reservations(hotel_id);
CREATE INDEX idx_res_guest         ON reservations(guest_id);
CREATE INDEX idx_res_room          ON reservations(room_id);
CREATE INDEX idx_res_status        ON reservations(status);
CREATE INDEX idx_res_dates         ON reservations(check_in, check_out);
CREATE INDEX idx_res_hotel_status  ON reservations(hotel_id, status);
CREATE INDEX idx_res_checkin       ON reservations(hotel_id, check_in);

-- payments
CREATE INDEX idx_pay_hotel       ON payments(hotel_id);
CREATE INDEX idx_pay_reservation ON payments(reservation_id);
CREATE INDEX idx_pay_status      ON payments(status);
CREATE INDEX idx_pay_paid_at     ON payments(paid_at);

-- activity_logs
CREATE INDEX idx_actlog_hotel   ON activity_logs(hotel_id);
CREATE INDEX idx_actlog_user    ON activity_logs(user_id);
CREATE INDEX idx_actlog_created ON activity_logs(created_at DESC);


-- ═══════════════════════════════════════════════════════════════
--  4. FONCTIONS UTILITAIRES
--  (créées AVANT les triggers qui les référencent)
-- ═══════════════════════════════════════════════════════════════

-- ─── 4.1 Rôle de l'utilisateur courant ─────────────────────────
-- SECURITY DEFINER contourne le RLS pour lire profiles.
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


-- ─── 4.2 Hôtel de l'utilisateur courant ───────────────────────
CREATE OR REPLACE FUNCTION current_user_hotel_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT hotel_id FROM public.profiles WHERE id = auth.uid();
$$;


-- ─── 4.3 Vérifie si l'utilisateur courant est super_admin ─────
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'::public.user_role
  );
$$;


-- ─── 4.4 Profil complet de l'utilisateur courant ──────────────
-- Utilisé par le layout dashboard. Joins profil + hôtel.
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id         UUID,
  email      TEXT,
  full_name  TEXT,
  role       user_role,
  hotel_id   UUID,
  hotel_name TEXT,
  is_active  BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.hotel_id,
    h.name AS hotel_name,
    p.is_active
  FROM public.profiles p
  LEFT JOIN public.hotels h ON p.hotel_id = h.id
  WHERE p.id = auth.uid();
$$;


-- ═══════════════════════════════════════════════════════════════
--  5. TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- ─── 5.1 Mise à jour automatique de updated_at ────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON subscription_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON activation_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─── 5.2 Création automatique du profil utilisateur ───────────
-- Se déclenche à chaque INSERT dans auth.users.
-- - Rôle par défaut : receptionist
-- - Si l'email correspond au SUPER_ADMIN_EMAIL → super_admin
-- - ON CONFLICT DO NOTHING pour éviter les doublons
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_super_admin_email TEXT := 'omouitsi@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      ''
    ),
    CASE
      WHEN LOWER(NEW.email) = LOWER(v_super_admin_email)
        THEN 'super_admin'::public.user_role
      ELSE 'receptionist'::public.user_role
    END,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─── 5.3 Remplissage automatique des logs d'activité ───────────
-- Avant INSERT dans activity_logs, remplit automatiquement :
-- user_id, user_role, hotel_id à partir de la session courante.
CREATE OR REPLACE FUNCTION set_activity_log_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_role IS NULL THEN
    NEW.user_role := public.current_user_role();
  END IF;
  IF NEW.hotel_id IS NULL THEN
    NEW.hotel_id := public.current_user_hotel_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_defaults
  BEFORE INSERT ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION set_activity_log_defaults();


-- ═══════════════════════════════════════════════════════════════
--  6. FONCTIONS RPC (appelables via supabase.rpc())
-- ═══════════════════════════════════════════════════════════════

-- ─── 6.1 Générer un code d'activation ─────────────────────────
-- Crée un code hexadécimal de 12 caractères, l'enregistre dans
-- activation_codes et le renvoie.
CREATE OR REPLACE FUNCTION generate_activation_code(
  p_hotel_id UUID,
  p_plan_id  UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := upper(encode(gen_random_bytes(6), 'hex'));

  INSERT INTO public.activation_codes (
    code, hotel_id, plan_id, created_by, expires_at
  ) VALUES (
    v_code,
    p_hotel_id,
    p_plan_id,
    auth.uid(),
    NOW() + INTERVAL '30 days'
  );

  RETURN v_code;
END;
$$;


-- ─── 6.2 Vérifier si la base est initialisée ──────────────────
CREATE OR REPLACE FUNCTION is_db_initialized()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'plans'
  );
$$;


-- ─── 6.3 Statistiques d'un hôtel (dashboard) ─────────────────
-- Renvoie un JSONB avec tous les KPI principaux.
CREATE OR REPLACE FUNCTION get_hotel_stats(p_hotel_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'total_rooms',
      (SELECT count(*) FROM public.rooms
       WHERE hotel_id = p_hotel_id AND is_active = true),
    'available_rooms',
      (SELECT count(*) FROM public.rooms
       WHERE hotel_id = p_hotel_id
         AND status = 'disponible'::public.room_status
         AND is_active = true),
    'occupied_rooms',
      (SELECT count(*) FROM public.rooms
       WHERE hotel_id = p_hotel_id
         AND status = 'occupee'::public.room_status
         AND is_active = true),
    'maintenance_rooms',
      (SELECT count(*) FROM public.rooms
       WHERE hotel_id = p_hotel_id
         AND status = 'maintenance'::public.room_status
         AND is_active = true),
    'reserved_rooms',
      (SELECT count(*) FROM public.rooms
       WHERE hotel_id = p_hotel_id
         AND status = 'reservee'::public.room_status
         AND is_active = true),
    'total_reservations',
      (SELECT count(*) FROM public.reservations
       WHERE hotel_id = p_hotel_id),
    'active_reservations',
      (SELECT count(*) FROM public.reservations
       WHERE hotel_id = p_hotel_id
         AND status IN ('confirmee'::public.reservation_status,
                        'en_cours'::public.reservation_status)),
    'today_checkins',
      (SELECT count(*) FROM public.reservations
       WHERE hotel_id = p_hotel_id
         AND check_in  = CURRENT_DATE
         AND status    != 'annulee'::public.reservation_status),
    'today_checkouts',
      (SELECT count(*) FROM public.reservations
       WHERE hotel_id = p_hotel_id
         AND check_out = CURRENT_DATE
         AND status    != 'annulee'::public.reservation_status),
    'monthly_revenue',
      COALESCE(
        (SELECT sum(amount) FROM public.payments
         WHERE hotel_id = p_hotel_id
           AND status  = 'payee'::public.payment_status
           AND paid_at >= date_trunc('month', CURRENT_DATE)),
        0
      ),
    'pending_payments',
      (SELECT count(*) FROM public.payments
       WHERE hotel_id = p_hotel_id
         AND status   = 'en_attente'::public.payment_status),
    'total_guests',
      (SELECT count(*) FROM public.guests
       WHERE hotel_id = p_hotel_id),
    'occupancy_rate',
      CASE
        WHEN (SELECT count(*) FROM public.rooms
              WHERE hotel_id = p_hotel_id AND is_active = true) > 0
        THEN ROUND(
          (SELECT count(*) FROM public.rooms
           WHERE hotel_id = p_hotel_id
             AND status = 'occupee'::public.room_status
             AND is_active = true)::numeric
          *
          100.0
          /
          (SELECT count(*) FROM public.rooms
           WHERE hotel_id = p_hotel_id AND is_active = true)::numeric,
          1
        )
        ELSE 0
      END
  );
$$;


-- ─── 6.4 Réservations récentes d'un hôtel ────────────────────
CREATE OR REPLACE FUNCTION get_recent_reservations(
  p_hotel_id UUID,
  p_limit    INTEGER DEFAULT 10
)
RETURNS TABLE (
  id            UUID,
  guest_name    TEXT,
  room_number   TEXT,
  check_in      DATE,
  check_out     DATE,
  status        reservation_status,
  total_amount  INTEGER,
  source        TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    r.id,
    r.guest_name,
    rm.number AS room_number,
    r.check_in,
    r.check_out,
    r.status,
    r.total_amount,
    r.source
  FROM public.reservations r
  LEFT JOIN public.rooms rm ON r.room_id = rm.id
  WHERE r.hotel_id = p_hotel_id
  ORDER BY r.created_at DESC
  LIMIT p_limit;
$$;


-- ─── 6.5 Disponibilité des chambres ───────────────────────────
-- Vérifie quelles chambres sont disponibles pour une période.
CREATE OR REPLACE FUNCTION get_available_rooms(
  p_hotel_id UUID,
  p_check_in  DATE,
  p_check_out DATE
)
RETURNS TABLE (
  id              UUID,
  number          TEXT,
  floor           INTEGER,
  room_type       room_type,
  price_per_night INTEGER,
  capacity        INTEGER,
  amenities       JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    rm.id,
    rm.number,
    rm.floor,
    rm.room_type,
    rm.price_per_night,
    rm.capacity,
    rm.amenities
  FROM public.rooms rm
  WHERE rm.hotel_id   = p_hotel_id
    AND rm.status     = 'disponible'::public.room_status
    AND rm.is_active  = true
    AND NOT EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.room_id   = rm.id
        AND r.status    IN ('confirmee'::public.reservation_status,
                           'en_cours'::public.reservation_status)
        AND r.check_in  < p_check_out
        AND r.check_out > p_check_in
    )
  ORDER BY rm.number;
$$;


-- ═══════════════════════════════════════════════════════════════
--  7. ROW LEVEL SECURITY (RLS)
--  Activation + policies par table et par rôle
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE plans                ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms                ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;


-- ─── 7.1 plans ────────────────────────────────────────────────
-- Lecture publique pour la page /tarifs
CREATE POLICY "plans_anon_read" ON plans
  FOR SELECT TO anon
  USING (is_active);

CREATE POLICY "plans_auth_read" ON plans
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "plans_super_admin_all" ON plans
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ─── 7.2 hotels ──────────────────────────────────────────────
CREATE POLICY "hotels_super_admin_all" ON hotels
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "hotels_hotel_admin_select" ON hotels
  FOR SELECT TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND id = current_user_hotel_id());

CREATE POLICY "hotels_hotel_admin_update" ON hotels
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'hotel_admin'::user_role
     AND id = current_user_hotel_id());

CREATE POLICY "hotels_staff_read" ON hotels
  FOR SELECT TO authenticated
  USING (current_user_role() IN ('manager'::user_role, 'receptionist'::user_role)
     AND id = current_user_hotel_id());


-- ─── 7.3 profiles ─────────────────────────────────────────────
-- Auto-lecture et update de son propre profil
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- super_admin : accès complet
CREATE POLICY "profiles_super_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- hotel_admin : CRUD sur les profils de son hôtel
CREATE POLICY "profiles_hotel_admin_read" ON profiles
  FOR SELECT TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "profiles_hotel_admin_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "profiles_hotel_admin_update" ON profiles
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id());

-- manager : lecture des profils de son hôtel
CREATE POLICY "profiles_manager_read" ON profiles
  FOR SELECT TO authenticated
  USING (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id());


-- ─── 7.4 subscription_requests ────────────────────────────────
-- Tout le monde peut soumettre (y compris anon)
CREATE POLICY "subreq_anon_insert" ON subscription_requests
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "subreq_auth_insert" ON subscription_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- super_admin : accès complet
CREATE POLICY "subreq_super_admin_all" ON subscription_requests
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- L'utilisateur peut voir ses propres demandes
CREATE POLICY "subreq_own_read" ON subscription_requests
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));


-- ─── 7.5 subscriptions ────────────────────────────────────────
CREATE POLICY "sub_super_admin_all" ON subscriptions
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "sub_hotel_admin_read" ON subscriptions
  FOR SELECT TO authenticated
  USING (hotel_id = current_user_hotel_id());

CREATE POLICY "sub_hotel_admin_update" ON subscriptions
  FOR UPDATE TO authenticated
  USING (hotel_id = current_user_hotel_id())
  WITH CHECK (hotel_id = current_user_hotel_id());

CREATE POLICY "sub_staff_read" ON subscriptions
  FOR SELECT TO authenticated
  USING (hotel_id = current_user_hotel_id()
     AND current_user_role() IN ('manager'::user_role, 'receptionist'::user_role));


-- ─── 7.6 activation_codes ─────────────────────────────────────
-- Réservé au super_admin uniquement
CREATE POLICY "actcode_super_admin_all" ON activation_codes
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ─── 7.7 rooms ───────────────────────────────────────────────
CREATE POLICY "rooms_super_admin_all" ON rooms
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "rooms_hotel_admin_all" ON rooms
  FOR ALL TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "rooms_manager_read" ON rooms
  FOR SELECT TO authenticated
  USING (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "rooms_manager_update" ON rooms
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "rooms_receptionist_read" ON rooms
  FOR SELECT TO authenticated
  USING (current_user_role() = 'receptionist'::user_role
     AND hotel_id = current_user_hotel_id());


-- ─── 7.8 guests ──────────────────────────────────────────────
CREATE POLICY "guests_super_admin_all" ON guests
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "guests_hotel_admin_all" ON guests
  FOR ALL TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "guests_manager_all" ON guests
  FOR ALL TO authenticated
  USING (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "guests_receptionist_all" ON guests
  FOR ALL TO authenticated
  USING (current_user_role() = 'receptionist'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'receptionist'::user_role
     AND hotel_id = current_user_hotel_id());


-- ─── 7.9 reservations ─────────────────────────────────────────
CREATE POLICY "res_super_admin_all" ON reservations
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "res_hotel_admin_all" ON reservations
  FOR ALL TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "res_manager_all" ON reservations
  FOR ALL TO authenticated
  USING (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "res_receptionist_all" ON reservations
  FOR ALL TO authenticated
  USING (current_user_role() = 'receptionist'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'receptionist'::user_role
     AND hotel_id = current_user_hotel_id());


-- ─── 7.10 payments ───────────────────────────────────────────
CREATE POLICY "pay_super_admin_all" ON payments
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "pay_hotel_admin_all" ON payments
  FOR ALL TO authenticated
  USING (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id())
  WITH CHECK (current_user_role() = 'hotel_admin'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "pay_manager_read" ON payments
  FOR SELECT TO authenticated
  USING (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "pay_manager_insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'manager'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "pay_receptionist_read" ON payments
  FOR SELECT TO authenticated
  USING (current_user_role() = 'receptionist'::user_role
     AND hotel_id = current_user_hotel_id());

CREATE POLICY "pay_receptionist_insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'receptionist'::user_role
     AND hotel_id = current_user_hotel_id());


-- ─── 7.11 activity_logs ──────────────────────────────────────
CREATE POLICY "actlog_insert" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "actlog_super_admin_read" ON activity_logs
  FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE POLICY "actlog_hotel_read" ON activity_logs
  FOR SELECT TO authenticated
  USING (hotel_id = current_user_hotel_id()
     AND NOT is_super_admin());


-- ═══════════════════════════════════════════════════════════════
--  8. SEEDS — Plans d'abonnement par défaut
-- ═══════════════════════════════════════════════════════════════

INSERT INTO plans (name, tier, price_monthly, max_hotels, max_rooms, max_users, features) VALUES

  (
    'Starter',
    'starter',
    20000,
    1,
    20,
    2,
    '[
      "Gestion des réservations basiques",
      "Gestion des chambres",
      "Facturation basique",
      "1 hôtel",
      "Jusqu''à 20 chambres",
      "2 utilisateurs",
      "Support par e-mail"
    ]'::jsonb
  ),

  (
    'Pro',
    'pro',
    50000,
    1,
    100,
    10,
    '[
      "Réservations avancées",
      "Gestion complète des chambres",
      "Facturation & comptabilité",
      "Statistiques détaillées",
      "1 hôtel",
      "Jusqu''à 100 chambres",
      "10 utilisateurs",
      "Support prioritaire WhatsApp",
      "Personnalisation"
    ]'::jsonb
  ),

  (
    'Prestige',
    'prestige',
    90000,
    999,
    999,
    999,
    '[
      "Toutes les fonctionnalités Pro",
      "Multi-hôtels",
      "Chambres illimitées",
      "Utilisateurs illimités",
      "API & intégrations",
      "Formation dédiée",
      "Manager de compte dédié",
      "Support 24/7"
    ]'::jsonb
  )

ON CONFLICT (tier) DO NOTHING;
