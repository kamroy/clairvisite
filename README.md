# Clairvisite — squelette technique

Monorepo `client` (React + Vite + Tailwind) / `server` (NestJS + architecture hexagonale + Prisma + PostgreSQL).

## Structure

```
client/   React — pages calquées sur la maquette
server/   NestJS — 7 modules métier, chacun organisé en hexagonal :
            domain/          entités + ports (interfaces), zéro dépendance à Nest/Prisma
            application/     use cases (logique métier) + ports secondaires (email, hash, etc.)
            infrastructure/  adapters : controllers HTTP, repositories Prisma, Resend, Google OIDC
```

### Pourquoi hexagonal ici

Chaque `*.repository.port.ts` est une interface définie dans `domain/`. Les use cases (`application/`)
ne dépendent que de ces interfaces, jamais de Prisma directement. Les adapters Prisma
(`infrastructure/persistence/prisma-*.repository.ts`) implémentent ces ports et sont branchés par
injection de dépendance dans le `*.module.ts` de chaque module :

```ts
{ provide: BOOKING_REPOSITORY, useClass: PrismaBookingRepository }
```

Concrètement : remplacer Prisma par un autre ORM, ou Resend par un autre fournisseur d'email, ou
Google par un autre fournisseur OIDC, se fait en écrivant un nouvel adapter — aucun use case ni
controller n'est modifié.

Modules : `users`, `auth`, `technicians`, `availabilities`, `bookings`, `admin`, `regions` (référentiel
géographique — sert les 101 départements français, malgré le nom du module).

Brique transverse : `infrastructure/storage/` (port `FileStoragePort` + adapter S3-compatible, MinIO en
local) — consommée par les futurs modules rapport technique / signature / documents (voir
`docs/specs/10-sequencement.md`), pas encore par un module métier existant.

## Démarrage local

### Avec Docker (recommandé)

```bash
cp .env.example .env    # POSTGRES_*, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET...
docker compose up
```

Lance la base, MinIO (stockage fichiers S3-compatible, console sur http://localhost:9011), l'API (`db push`
+ seed des départements et d'un compte admin, puis `start:dev`) et le client, avec hot-reload sur `server/`
et `client/`.

- Client : http://localhost:5173
- API : http://localhost:3000/api

### Sans Docker

```bash
cd server
cp .env.example .env   # DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET...
npm install
npx prisma db push      # pas de dossier prisma/migrations dans ce projet
npx prisma db seed      # départements + compte admin (ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD)
npm run start:dev       # démarre l'API sur http://localhost:3000/api
```

Le stockage fichiers (`STORAGE_*` dans `.env`) suppose un serveur S3-compatible déjà démarré — le plus
simple est `docker compose up -d minio` même en mode "sans Docker" pour le reste.

```bash
cd client
npm install
npm run dev              # démarre le front sur http://localhost:5173 (proxy /api -> :3000)
```

### Compte admin

Le seed (`server/prisma/seed.ts`) crée un compte admin — `admin@clairvisite.fr` / `ChangeMoi123!` par
défaut, personnalisable via `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.

## OIDC Google

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com/), configurer l'écran de consentement OAuth.
2. Créer des identifiants OAuth (type "Application Web"), avec comme URI de redirection autorisée : `http://localhost:3000/api/auth/google/callback`.
3. Reporter `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` dans `server/.env`.
4. L'unique adapter qui connaît Google est `modules/auth/infrastructure/adapters/google-oidc.adapter.ts`.

## Déploiement

Architecture cible : trois services indépendants, chacun sur son propre hébergeur.

```
Vercel/Netlify (front statique)  →  Render/Railway/Fly.io (API Docker)  →  Neon/Supabase (Postgres managé)
```

Combo utilisé ci-dessous à titre d'exemple concret (n'importe quelle alternative de la même
catégorie se substitue sans changement de code) : **Render** + **Neon** + **Vercel**.

### 1. Base de données — Neon

1. Créer un projet sur [Neon](https://neon.tech) (ou Supabase). Copier la chaîne de connexion
   fournie (`postgresql://...`) — ce sera `DATABASE_URL`.

### 2. API — Render

1. Nouveau *Web Service* sur [Render](https://render.com), pointé sur ce repo, **Dockerfile** :
   `server/Dockerfile.prod` (⚠️ pas `server/Dockerfile`, qui est dev-only — bind mount, reste root,
   pas de build).
2. Variables d'environnement à renseigner (voir `server/.env.example`) :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | chaîne de connexion Neon |
   | `JWT_SECRET` | secret long généré aléatoirement (`openssl rand -hex 32`) |
   | `NODE_ENV` | `production` — sans ça, les cookies restent `Secure: false` / `SameSite: Lax`, incompatibles avec un front sur un autre domaine (voir plus bas) |
   | `CLIENT_URL` | URL Vercel du front, ex. `https://clairvisite.vercel.app` (sans slash final) |
   | `API_BASE_URL` | URL publique Render de l'API + `/api`, ex. `https://clairvisite-api.onrender.com/api` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | voir section OIDC Google ci-dessus |
   | `GOOGLE_REDIRECT_URI` | `https://clairvisite-api.onrender.com/api/auth/google/callback` — **et** à ajouter aux URI de redirection autorisées dans Google Cloud Console |
   | `RESEND_API_KEY` | clé [Resend](https://resend.com) — **obligatoire au démarrage** : son absence fait planter le boot (`new Resend()` lève une exception dès l'injection, pas seulement à l'envoi) |
   | `PORT` | généralement injecté automatiquement par Render, sinon `3000` |

3. Au démarrage du conteneur, `npx prisma db push` synchronise le schéma (toujours pas de dossier
   `migrations` dans ce projet). Le seed (départements + compte admin) n'est **pas** lancé
   automatiquement en prod — voir juste en dessous.

### 3. Compte admin en production

Le seed nécessite `ts-node`, absent de l'image de prod (dépendance de dev). Le lancer une fois,
depuis votre machine, contre la base Neon :

```bash
cd server
DATABASE_URL="<chaîne Neon>" ADMIN_SEED_EMAIL="vous@example.com" ADMIN_SEED_PASSWORD="<mot de passe fort>" npx prisma db seed
```

### 4. Front — Vercel

1. Nouveau projet sur [Vercel](https://vercel.com) (ou Netlify), pointé sur ce repo, **répertoire
   racine `client/`** — le framework Vite est détecté automatiquement.
2. Variable d'environnement : `VITE_API_URL` = `https://clairvisite-api.onrender.com/api` (même
   valeur qu'`API_BASE_URL` côté serveur).

### Cookies cross-origin

Front et API étant sur deux domaines différents, les cookies (session, `csrf_token`) doivent
porter `SameSite: None; Secure` pour être transmis par le navigateur sur les appels `fetch()`
cross-site — c'est géré automatiquement par `server/src/common/cookies/cookie-options.ts` dès que
`NODE_ENV=production` est positionné (`SameSite: Lax` en dev, où tout passe par le proxy Vite en
same-origin). Le cookie `oidc_verifier` (flux Google) reste `Lax` dans tous les cas : il n'est posé
et relu qu'au fil de redirections top-level, jamais d'un `fetch()`.

## Point d'implémentation critique : anti double-réservation

`modules/bookings/infrastructure/persistence/prisma-booking.repository.ts` →
`createIfSlotAvailable()` : la vérification + le marquage du créneau + la création de la
réservation ont lieu dans une seule transaction Prisma (`$transaction`), ce qui empêche deux
acheteurs de réserver le même créneau simultanément (US-A3 / point d'attention "concurrence" de
la spec). Le use case `CreateBookingUseCase` traduit l'erreur métier `SlotAlreadyBookedError` en
`409 Conflict` côté HTTP.

## Ce qui est déjà en place

- Les 7 modules complets (domain + application + infrastructure), guards `JwtAuthGuard`/`RolesGuard`,
  décorateurs `@Roles`/`@CurrentUser`, filtre d'exception global
- OIDC Google (`openid-client`, Authorization Code + PKCE) + fallback email/mot de passe (bcrypt)
- Transaction anti double-réservation + envoi d'email asynchrone (Resend) après réservation/annulation
- Validation des DTOs avec `class-validator`
- Tests unitaires (use cases) et e2e côté serveur, tests de composants/hooks côté client
- Lint : ESLint côté serveur (`npm run lint` dans `server/`) et côté client (`npm run lint` dans `client/`)
- Page d'accueil : recherche par département + spécialité, header avec nom de l'utilisateur connecté

## CI

`.github/workflows/ci.yml` : à chaque PR et push sur `main`, deux jobs indépendants (`client`, `server`)
font lint → tests → `npm audit --audit-level=high` (bloquant) → build. Les tests serveur
(unitaires + e2e) tournent contre des repositories en mémoire (`server/test/fakes/`), donc aucun
service PostgreSQL n'est nécessaire dans la pipeline.

`.github/workflows/codeql.yml` : analyse statique de sécurité (CodeQL, JS/TypeScript) sur chaque
PR/push vers `main`, plus une passe hebdomadaire.

## Reste à faire pour un MVP livrable

- Écran de complément de profil post-connexion Google (téléphone obligatoire, non fourni par Google) —
  la page `/profile` existe déjà mais n'est pas imposée après un premier login Google
- Déploiement effectif : le code et la doc sont prêts (voir section Déploiement), mais aucun
  environnement n'a encore été créé — la CI s'arrête à `build`, pas de job de déploiement automatique
- Historique de migrations Prisma (`prisma migrate`) plutôt que `db push` — acceptable pour ce stade
  du projet, mais `db push` en prod peut appliquer des changements de schéma sans piste d'audit
