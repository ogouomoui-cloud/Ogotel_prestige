-- ============================================================
--  OGOTEL PRESTIGE — Seed : Données initiales des plans
-- ============================================================
--  À exécuter DANS Supabase → SQL Editor → Run
--  APRÈS avoir exécuté schema.sql
-- ============================================================

-- ─── Insertion sécurisée : ne pas dupliquer si déjà présent ───
INSERT INTO plans (name, tier, price_monthly, max_hotels, max_rooms, max_users, features, is_active)
VALUES
  (
    'Starter',
    'starter',
    20000,
    1,
    20,
    2,
    '["Gestion des réservations", "Gestion des chambres (max 20)", "Facturation basique", "2 utilisateurs", "Support par e-mail"]'::jsonb,
    true
  ),
  (
    'Pro',
    'pro',
    50000,
    1,
    100,
    10,
    '["Tout le plan Starter", "Jusqu''à 100 chambres", "10 utilisateurs", "Réservations avancées", "Facturation & comptabilité", "Statistiques détaillées", "Support prioritaire WhatsApp", "Personnalisation"]'::jsonb,
    true
  ),
  (
    'Prestige',
    'prestige',
    90000,
    999,
    999,
    999,
    '["Tout le plan Pro", "Multi-hôtels", "Chambres illimitées", "Utilisateurs illimités", "API & intégrations", "Formation dédiée", "Manager de compte dédié", "Support 24/7"]'::jsonb,
    true
  )
ON CONFLICT (tier) DO NOTHING;
