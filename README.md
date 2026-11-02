# BCC Psychotechnique

Plateforme **indépendante** de préparation aux tests psychotechniques numériques utilisés dans les recrutements
(format de référence : 15 questions en 15 minutes). Elle n'est ni affiliée, ni approuvée, ni gérée par la Banque
Centrale du Congo.

> État : **phase 1 (architecture et initialisation)** terminée. Les phases suivantes ajoutent l'interface publique,
> l'authentification complète, l'entraînement, le simulateur d'examen, la bibliothèque et l'administration.

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, Recharts |
| Formulaires | React Hook Form + Zod |
| Données | PostgreSQL (Supabase) + Prisma 7 (adaptateur `pg`) |
| Authentification | Auth.js v5 (e-mail + mot de passe, bcrypt, session JWT) |
| Fichiers | Supabase Storage (bucket privé + URL signées) |
| Tests | Vitest |
| Hébergement | Vercel (serverless) |

## Organisation du code

```
app/            Routes (App Router) : pages publiques, espace candidat, admin, API
components/ui/  Composants shadcn/ui
components/     Composants partagés (layout, éléments communs)
features/       Modules fonctionnels (practice, exam, results, library, admin, dashboard)
services/       Logique métier et accès aux données (exam, scoring, stats, stockage, limitation)
lib/            Infrastructure : prisma, auth, guards, erreurs, env, supabase
schemas/        Schémas Zod partagés client/serveur
types/          Types TypeScript partagés
prisma/         schema.prisma, migrations, seed
tests/          Tests Vitest
proxy.ts        Redirections optimistes selon la session (ex-middleware)
```

Principes de sécurité appliqués dès la phase 1 :

- **Autorisation côté serveur** : `requireUser()` / `requireAdmin()` (pages) et `assertUser()` / `assertAdmin()`
  (Server Actions, routes) dans `lib/guards.ts`. Le proxy ne fait qu'une redirection de confort.
- **Comptes revérifiés** toutes les 5 minutes dans le JWT : un compte désactivé ou rétrogradé perd ses droits.
- **Limitation des connexions** : 5 échecs par e-mail et 20 par IP sur 15 minutes (table `LoginAttempt`, sans Redis).
- **Secrets** : `server-only` empêche d'importer la clé Supabase `service_role` ou Prisma dans du code client.
- **Erreurs** : `runAction()` (`lib/errors.ts`) renvoie un résultat uniforme et masque les détails internes.

## Installation locale

Prérequis : Node.js ≥ 20.19 (testé avec Node 24) et un projet [Supabase](https://supabase.com) gratuit.

```bash
npm install                 # installe et génère le client Prisma
cp .env.example .env        # puis renseigner les valeurs
npm run db:migrate          # crée les tables (première migration)
npm run db:seed             # catégories, examen par défaut, compte admin
npm run dev                 # http://localhost:3000
```

### Configurer Supabase

1. Créer un projet (région la plus proche, par exemple `eu-central-1` ou `eu-west-*`).
2. **Database → Connect** : copier la chaîne *Transaction pooler* (port 6543) dans `DATABASE_URL` en ajoutant
   `?pgbouncer=true`, et la chaîne *Session pooler* ou *Direct* (port 5432) dans `DIRECT_URL`.
3. **Project Settings → API** : copier l'URL dans `NEXT_PUBLIC_SUPABASE_URL` et la clé `service_role` dans
   `SUPABASE_SERVICE_ROLE_KEY`.
4. **Storage** : la création des buckets `documents` (privé) et `question-images` (public) est décrite en phase 7.

## Variables d'environnement

| Variable | Obligatoire | Usage |
|---|---|---|
| `DATABASE_URL` | oui | Connexion poolée (6543) utilisée par l'application |
| `DIRECT_URL` | oui | Connexion directe (5432) pour migrations et seed |
| `AUTH_SECRET` | oui | Signature des sessions (≥ 32 caractères, `npx auth secret`) |
| `AUTH_URL` | non | URL publique ; détectée automatiquement sur Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | oui (phase 7) | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | oui (phase 7) | Clé serveur pour le stockage, jamais exposée au client |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed | Premier compte administrateur |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | `prisma generate` + build de production |
| `npm run typecheck` / `npm run lint` / `npm test` | Vérifications |
| `npm run db:migrate` | Crée et applique une migration (développement) |
| `npm run db:deploy` | Applique les migrations existantes (production) |
| `npm run db:seed` | Données initiales (idempotent) |
| `npm run db:studio` | Explorateur de base Prisma |

## Déploiement sur Vercel

1. Pousser le dépôt sur GitHub, puis l'importer dans Vercel (framework détecté : Next.js).
2. Renseigner toutes les variables ci-dessus dans **Settings → Environment Variables**.
3. Dans **Settings → Build and Deployment**, définir **Build Command** = `npm run vercel-build`
   (`prisma generate && prisma migrate deploy && next build`). Les migrations sont ainsi appliquées
   automatiquement avant chaque build de production.
4. Lancer le seed une fois depuis votre poste, pointé sur la base de production : `npm run db:seed`.

## Offres gratuites et coûts

| Service | Limite gratuite (à vérifier sur les sites officiels) | Au-delà |
|---|---|---|
| Vercel Hobby | Usage non commercial, quotas mensuels d'exécution et de bande passante | Plan Pro, environ 20 $/mois par membre |
| Supabase Free | 500 Mo de base, 1 Go de stockage, mise en pause après 7 jours d'inactivité | Plan Pro, environ 25 $/mois |

Un usage commercial (abonnements payants) impose le plan Vercel Pro.

## Avertissements sur les contenus

- Les questions fournies sont **originales** et inspirées des types d'exercices observés ; elles ne prétendent pas
  provenir d'un test officiel.
- Chaque document de la bibliothèque porte un statut de vérification ; un document non vérifié n'est jamais présenté
  comme un communiqué officiel.
- Ne publiez pas de documents contenant des données personnelles (par exemple des listes nominatives de candidats).
