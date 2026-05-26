# 🏨 OGOTEL Prestige

> La solution de gestion hôtelière premium pour la Côte d'Ivoire.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
bun install

# Variables d'environnement
cp .env.example .env.local
# Remplir les clés Supabase dans .env.local

# Base de données
bun run db:push

# Serveur de développement
bun run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## 📁 Structure du projet

```
src/
├── app/
│   ├── layout.tsx                  # Layout racine (fonts, metadata, Toaster)
│   ├── middleware.ts                # Middleware Supabase (sessions, routes protégées)
│   ├── (public)/
│   │   ├── layout.tsx              # Layout public (Navbar + Footer)
│   │   ├── page.tsx                # Page d'accueil
│   │   ├── tarifs/page.tsx         # Page tarifs
│   │   ├── contact/page.tsx        # Page contact
│   │   ├── connexion/page.tsx      # Page de connexion
│   │   └── activer/page.tsx        # Activation par code
│   └── (dashboard)/
│       ├── layout.tsx              # Layout dashboard (Sidebar)
│       └── dashboard/page.tsx      # Tableau de bord
├── components/
│   ├── ui/                         # Composants shadcn/ui
│   ├── shared/                     # Composants réutilisables
│   │   ├── Logo.tsx
│   │   ├── SectionTitle.tsx
│   │   ├── StatCard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── MobileSidebarTrigger.tsx
│   └── saas/                       # Composants publics
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   ├── constants/                  # Constantes du site
│   │   ├── site.ts
│   │   ├── navigation.ts
│   │   └── roles.ts
│   ├── supabase/                   # Utilitaires Supabase
│   │   ├── client.ts              # Client navigateur
│   │   ├── server.ts              # Client serveur
│   │   └── middleware.ts          # Middleware session
│   ├── utils.ts
│   └── db.ts                      # Client Prisma
└── types/
    └── index.ts                   # Types TypeScript
```

## 🔐 Rôles

| Rôle | Accès |
|------|-------|
| `super_admin` | Tous les hôtels, tous les paramètres |
| `hotel_admin` | Son hôtel, personnel, facturation |
| `manager` | Réservations, chambres, clients |
| `receptionist` | Réservations, clients |

## 🛠 Stack technique

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript 5
- **UI** : Tailwind CSS 4 + shadcn/ui
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Formulaires** : React Hook Form + Zod
- **Animations** : Framer Motion
- **Icônes** : Lucide React

## 🎨 Palette

| Couleur | Hex | Usage |
|---------|-----|-------|
| Bleu nuit | `#0f1b2d` | Primaire, sidebar |
| Or | `#c8a97e` | Accent, CTAs, liens |
| Blanc cassé | `#f8f6f2` | Arrière-plans clairs |
| Ardoise | `#475569` | Texte secondaire |

## 📋 Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Côté serveur uniquement
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être exposé côté client.

## 📄 Licence

Propriétaire — OGOTEL Prestige © 2025
