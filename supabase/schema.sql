-- ============================================================================
-- OGOTEL PRESTIGE — Schéma de base de données Supabase
-- ============================================================================
-- Exécuter ce script dans le SQL Editor de Supabase Dashboard :
-- https://supabase.com/dashboard/project/igkyjfagucwkznwccknd/sql
-- ============================================================================

-- ─── Extension UUID ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ─── Hôtels ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  address         TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT 'Abidjan',
  country         TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
  phone           TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  logo_url        TEXT,
  star_rating     INTEGER NOT NULL DEFAULT 3 CHECK (star_rating BETWEEN 1 AND 5),
  total_rooms     INTEGER NOT NULL DEFAULT 0,
  subscription_plan     TEXT NOT NULL DEFAULT 'starter'
                     CHECK (subscription_plan IN ('starter', 'premium', 'enterprise')),
  subscription_status   TEXT NOT NULL DEFAULT 'trial'
                     CHECK (subscription_status IN ('active', 'trial', 'expired', 'pending', 'cancelled')),
  activation_code TEXT UNIQUE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Profils utilisateurs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  phone           TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'receptionist'
                     CHECK (role IN ('super_admin', 'hotel_admin', 'manager', 'receptionist')),
  hotel_id        UUID REFERENCES public.hotels(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contrainte FK retardée (évite la référence circulaire)
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── Demandes d'abonnement ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_name      TEXT NOT NULL,
  contact_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  desired_plan    TEXT NOT NULL DEFAULT 'starter'
                     CHECK (desired_plan IN ('starter', 'premium', 'enterprise')),
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Chambres ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  number          TEXT NOT NULL,
  floor           INTEGER NOT NULL DEFAULT 1,
  room_type       TEXT NOT NULL DEFAULT 'standard'
                     CHECK (room_type IN ('standard', 'deluxe', 'suite', 'presidentielle')),
  status          TEXT NOT NULL DEFAULT 'disponible'
                     CHECK (status IN ('disponible', 'occupée', 'maintenance', 'réservée')),
  price_per_night INTEGER NOT NULL DEFAULT 0,
  capacity        INTEGER NOT NULL DEFAULT 2,
  amenities       TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, number)
);

-- ─── Réservations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reservations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  guest_name      TEXT NOT NULL,
  guest_email     TEXT NOT NULL DEFAULT '',
  guest_phone     TEXT NOT NULL DEFAULT '',
  room_id         UUID REFERENCES public.rooms(id),
  check_in        DATE NOT NULL,
  check_out       DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmée'
                     CHECK (status IN ('confirmée', 'en_cours', 'terminée', 'annulée')),
  total_amount    INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Factures ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES public.reservations(id),
  amount          INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'en_attente'
                     CHECK (status IN ('payée', 'en_attente', 'en_retard')),
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date        DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_hotel_id   ON public.profiles(hotel_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email      ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_hotels_activation   ON public.hotels(activation_code);
CREATE INDEX IF NOT EXISTS idx_hotels_slug         ON public.hotels(slug);
CREATE INDEX IF NOT EXISTS idx_hotels_status       ON public.hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id      ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status        ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel  ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room   ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates  ON public.reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_sub_requests_status ON public.subscription_requests(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Toutes les tables sont protégées. Le service_role bypass le RLS.
-- Les politiques ci-dessous couvrent les accès côté client (anon key).

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices             ENABLE ROW LEVEL SECURITY;

-- ─── Profiles : lecture pour tout utilisateur authentifié ────────────────
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "profiles_service_role"
  ON public.profiles FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ─── Hotels : lecture pour authentifiés ──────────────────────────────────
CREATE POLICY "hotels_select_authenticated"
  ON public.hotels FOR SELECT
  TO authenticated USING (is_active = true);

CREATE POLICY "hotels_service_role"
  ON public.hotels FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ─── Subscription Requests ──────────────────────────────────────────────
CREATE POLICY "sub_requests_select_authenticated"
  ON public.subscription_requests FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "sub_requests_insert_authenticated"
  ON public.subscription_requests FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "sub_requests_service_role"
  ON public.subscription_requests FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ─── Rooms, Reservations, Invoices : idem ───────────────────────────────
CREATE POLICY "rooms_select_authenticated"
  ON public.rooms FOR SELECT TO authenticated USING (true);

CREATE POLICY "rooms_service_role"
  ON public.rooms FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "reservations_select_authenticated"
  ON public.reservations FOR SELECT TO authenticated USING (true);

CREATE POLICY "reservations_service_role"
  ON public.reservations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "invoices_select_authenticated"
  ON public.invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "invoices_service_role"
  ON public.invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- ─── Auto-update updated_at ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at   ON public.profiles;
DROP TRIGGER IF EXISTS trg_hotels_updated_at    ON public.hotels;
DROP TRIGGER IF EXISTS trg_rooms_updated_at     ON public.rooms;
DROP TRIGGER IF EXISTS trg_reservations_updated_at ON public.reservations;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_hotels_updated_at BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- ─── Auto-create profile on signup ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Auto-update room status when reservation changes ───────────────────
CREATE OR REPLACE FUNCTION public.fn_sync_room_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une réservation est créée ou modifiée, mettre la chambre en "réservée"
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.room_id IS NOT NULL THEN
    IF NEW.status IN ('confirmée', 'en_cours') THEN
      UPDATE public.rooms SET status = 'réservée' WHERE id = NEW.room_id;
    END IF;
    IF NEW.status = 'terminée' THEN
      UPDATE public.rooms SET status = 'disponible' WHERE id = NEW.room_id;
    END IF;
    IF NEW.status = 'annulée' THEN
      UPDATE public.rooms SET status = 'disponible' WHERE id = NEW.room_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservation_room_sync ON public.reservations;
CREATE TRIGGER trg_reservation_room_sync
  AFTER INSERT OR UPDATE OF status ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_room_status();

-- ============================================================================
-- FONCTIONS UTILITAIRES (RPC)
-- ============================================================================

-- Vérifier si le schéma est initialisé
CREATE OR REPLACE FUNCTION public.is_db_initialized()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Générer un code d'activation unique
CREATE OR REPLACE FUNCTION public.generate_activation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
  attempts INTEGER := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..4 LOOP
      code := code || SUBSTRING(chars, floor(random() * length(chars) + 1)::int, 1);
      IF i < 4 THEN code := code || '-'; END IF;
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.hotels WHERE activation_code = code);
    attempts := attempts + 1;
    IF attempts > 100 THEN RAISE EXCEPTION 'Impossible de générer un code unique'; END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les statistiques d'un hôtel
CREATE OR REPLACE FUNCTION public.get_hotel_stats(p_hotel_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_rooms', COALESCE((SELECT count(*) FROM public.rooms WHERE hotel_id = p_hotel_id), 0),
    'occupied_rooms', COALESCE((SELECT count(*) FROM public.rooms WHERE hotel_id = p_hotel_id AND status = 'occupée'), 0),
    'reserved_rooms', COALESCE((SELECT count(*) FROM public.rooms WHERE hotel_id = p_hotel_id AND status = 'réservée'), 0),
    'available_rooms', COALESCE((SELECT count(*) FROM public.rooms WHERE hotel_id = p_hotel_id AND status = 'disponible'), 0),
    'active_reservations', COALESCE((SELECT count(*) FROM public.reservations WHERE hotel_id = p_hotel_id AND status IN ('confirmée', 'en_cours')), 0),
    'monthly_revenue', COALESCE((SELECT COALESCE(SUM(total_amount), 0) FROM public.reservations
      WHERE hotel_id = p_hotel_id
        AND status IN ('en_cours', 'terminée')
        AND check_out >= date_trunc('month', now())
        AND check_out <= date_trunc('month', now()) + interval '1 month'), 0),
    'occupancy_rate', CASE
      WHEN (SELECT count(*) FROM public.rooms WHERE hotel_id = p_hotel_id) > 0
      THEN ROUND(
        (SELECT count(*)::numeric FROM public.rooms WHERE hotel_id = p_hotel_id AND status IN ('occupée', 'réservée'))
        / (SELECT count(*)::numeric FROM public.rooms WHERE hotel_id = p_hotel_id) * 100, 1
      )
      ELSE 0
    END
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les réservations récentes d'un hôtel
CREATE OR REPLACE FUNCTION public.get_recent_reservations(p_hotel_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID, guest_name TEXT, room_number TEXT, check_in DATE, check_out DATE,
  status TEXT, total_amount BIGINT, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.guest_name, rm.number AS room_number,
         r.check_in, r.check_out, r.status, r.total_amount, r.created_at
  FROM public.reservations r
  LEFT JOIN public.rooms rm ON r.room_id = rm.id
  WHERE r.hotel_id = p_hotel_id
  ORDER BY r.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TERMINÉ ✅
-- ============================================================================
-- Prochaines étapes :
-- 1. Relancer le serveur Next.js : bun run dev
-- 2. Visiter /api/setup pour vérifier l'initialisation
-- 3. Créer le super admin via /api/setup/create-super-admin
-- ============================================================================
