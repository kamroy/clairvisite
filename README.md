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

## Démarrage local

### Avec Docker (recommandé)

```bash
cp .env.example .env    # POSTGRES_*, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET...
docker compose up
```

Lance la base, l'API (`db push` + seed des départements et d'un compte admin, puis `start:dev`) et le
client, avec hot-reload sur `server/` et `client/`.

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
- Page d'accueil : recherche par département + spécialité, header avec nom de l'utilisateur connecté

## Reste à faire pour un MVP livrable

- Écran de complément de profil post-connexion Google (téléphone obligatoire, non fourni par Google) —
  la page `/profile` existe déjà mais n'est pas imposée après un premier login Google
- CI + déploiement (Render/Railway/Fly.io pour le monolithe NestJS, Neon/Supabase pour Postgres)
