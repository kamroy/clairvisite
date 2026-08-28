# 10 — Plan de séquencement

Ce plan ordonne les ~50 user stories des 9 fichiers de domaine en phases livrables, en croisant deux critères :
la priorité MoSCoW déjà posée dans chaque fichier, et les **dépendances techniques réelles** (une story qui
a besoin d'une brique pas encore construite ne peut pas passer avant elle, même si elle est "Must have").

## Dépendances transverses à poser avant de coder les features

Trois éléments sont utilisés par plusieurs domaines à la fois — les construire une fois, tôt, évite de les
refaire en double :

| Brique | Consommée par | Décision à prendre |
|---|---|---|
| **Stockage de fichiers** (S3 ou équivalent) | Rapport technique (photos), Signature (devis PDF + doc signé), Gestion documentaire, Inscription expert (pièces justificatives) | ✅ Fait — MinIO (S3-compatible) en local, AWS S3 en prod |
| **PSP de paiement** | Paiement (US-PAY-01) | ✅ Décidé — Stripe, intégration reportée en Phase 2 |
| **Canal temps réel** (WebSocket) | Messagerie (US-COMM-01), Centre de notifications (US-COMM-02) | NestJS Gateway (socket.io) — pas de nouveau service externe nécessaire, à faire en Phase 2/3 |

Deux points fonctionnels, déjà signalés comme "points ouverts" dans les specs, **bloquent le modèle de
données** et doivent être tranchés avant la Phase 1 :
- [01-auth-et-comptes.md](01-auth-et-comptes.md) : un rôle professionnel unique + champ spécialité, ou deux
  rôles distincts (technicien / expert déco) ? → ✅ **Tranché (2026-08-28)** : rôle unique, champ
  `category` ajouté sur `Technician` (`technique` / `decoration` / `architecture`), distinct des
  `specialties` (tags libres existants).
- Langue de l'admin (français partout) — moins bloquant, **reste ouvert**, à trancher avant la Phase 3
  (écrans admin).

## Phase 0 — Fondations ✅ Terminée (2026-08-28)
- ✅ Rôle professionnel : champ `category` (enum `TechnicianCategory`) ajouté sur `Technician` — schéma,
  entité de domaine, port de repository, adapter Prisma, DTO + endpoint de recherche, fake de test. Tests
  (22 suites / 84 tests) et build au vert.
- ✅ Stockage de fichiers : module `server/src/infrastructure/storage/` (`FileStoragePort` + adapter S3 via
  `@aws-sdk/client-s3`, URLs pré-signées upload/download). MinIO ajouté à `docker-compose.yml` (ports hôte
  9010/9011, un autre projet occupant déjà 9000/9001), bucket `clairvisite-files` auto-créé au démarrage.
  Pas encore consommé par un module métier — prêt pour la Phase 2 (rapport technique).
- PSP : Stripe retenu, intégration différée à la Phase 2 (US-PAY-01) — rien à faire maintenant.
- ⚠️ Effet de bord corrigé au passage : le fix précédent sur `prisma/seed.ts` (suppression du mot de passe
  admin par défaut codé en dur) avait cassé le démarrage Docker Compose, qui ne fournissait jamais
  `ADMIN_SEED_PASSWORD`. Corrigé en ajoutant un défaut de dev explicite dans `docker-compose.yml`/`.env.example`
  (à la couche infra, pas dans le code applicatif).
- Langue admin : toujours en attente d'arbitrage — n'a pas bloqué la Phase 0.

## Phase 1 — Combler l'écart sur le parcours existant (Must have) ⚠️ Presque terminée (2026-08-28)
Le socle acheteur ↔ technicien ↔ admin existe déjà en version simple ; cette phase l'amène au niveau du
prototype avant d'ajouter de nouvelles briques.
- ✅ US-AUTH-01 (choix de profil acheteur/pro à l'inscription)
- ⚠️ US-AUTH-02 (connexion) — **non traitée comme tranche dédiée**. Le login email/mdp et le callback OIDC
  Google fonctionnaient déjà avant cette phase et ont juste été réutilisés (ex. redirection post-connexion
  vers `/projects` ou `/technician/dashboard`). **Restent manquants** : le bouton "afficher le mot de passe"
  et tout le flux "mot de passe oublié" (aucun code de réinitialisation n'existe côté serveur ou client) —
  c'était déjà signalé comme point ouvert dans [01-auth-et-comptes.md](01-auth-et-comptes.md#us-auth-02).
- ✅ US-AUTH-04 (dossier pro multi-étapes avec SIRET/documents)
- ✅ US-AUTH-06 (validation admin, filtres catégorie/statut/recherche)
- ✅ US-SEARCH-01, 02 (filtres recherche enrichis, profil public avec grille tarifaire/portfolio/profils
  similaires)
- ✅ US-BOOK-01 (tunnel de réservation 3 étapes avec récap live, adresse via API Adresse + carte Leaflet)
- ✅ US-BOOK-04 (page "Mes Projets" transverse — construite 100% côté client au-dessus des réservations
  existantes, faute de US-BOOK-02/03 pour justifier une vraie notion de "projet" multi-type)
- ✅ US-DASH-01 (dashboard expert : KPIs, agenda, dossiers en cours, ressources pro — honoraires "estimés"
  faute de module de facturation)

*Aucune dépendance externe nouvelle — s'appuie sur `auth`, `bookings`, `technicians`, `availabilities`
existants. Tests : 22 suites/84 tests unitaires + 7 suites/57 tests e2e serveur, 15 suites/94 tests client,
tous au vert à la fin de la phase.*

⚠️ **Aucun commit git** n'a encore été fait pour tout le travail de Phase 0 et Phase 1 (dernier commit :
`b881713 add spec for the product`) — 94 fichiers modifiés/créés en attente dans l'arbre de travail.

## Phase 2 — Boucler la transaction (Must have, cœur de la valeur produit)
- US-PAY-01 (paiement) — *dépend du PSP (Phase 0)*
- US-REPORT-01, 02 (rédaction + consultation du rapport technique) — *dépend du stockage fichiers (Phase 0)*
- US-COMM-01 (messagerie liée au projet) — *dépend du canal temps réel (Phase 0)*

À l'issue de cette phase, le parcours "contre-visite technique" est complet de bout en bout : recherche →
réservation → paiement → rapport → échange avec l'expert.

## Phase 3 — Confiance & conformité (Should have)
- US-PAY-02 (signature électronique du devis) — *réutilise le stockage fichiers*
- US-COMM-02 (centre de notifications) — *réutilise le canal temps réel*
- US-DOC-01 (gestion documentaire centralisée) — *réutilise le stockage fichiers, regroupe les sorties de
  Phase 2 (rapports, devis signés)*
- US-ADMIN-01 (rôles & permissions admin) — dès qu'il y a plus d'un administrateur
- US-ADMIN-06, 07, 08 (gestion clients, gestion experts au quotidien, support & litiges)

## Phase 4 — Vertical métier "Décoration d'intérieur" (Should have, conditionné)
Ce persona est **entièrement nouveau** (aucune trace dans le code actuel) — à ne lancer qu'une fois la
décision produit confirmée sur ce vertical, et après la Phase 1 (dépend du même modèle de recherche/profil).
- US-SEARCH-03 (hub décoration)
- US-BOOK-02, 03 (devis travaux, conseil déco)

## Phase 5 — Pilotage & confort (Could have)
Peut être livré en continu après la Phase 3, sans bloquer le reste :
- US-DASH-02 (dashboard admin — stats globales, dépend d'avoir des données réelles de paiement/support pour
  être utile)
- US-ADMIN-02 (couverture régionale), 03 (identité visuelle), 04 (emails), 05 (config globale), 09 (exports)
- US-COMM-03 (préférences de notifications)

## Vue d'ensemble

```
Phase 0  Fondations             (stockage fichiers, PSP, décisions modèle de données)
Phase 1  Écart existant         AUTH-01/02/04/06, SEARCH-01/02, BOOK-01/04, DASH-01
Phase 2  Boucler la transaction PAY-01, REPORT-01/02, COMM-01
Phase 3  Confiance & conformité PAY-02, COMM-02, DOC-01, ADMIN-01/06/07/08
Phase 4  Vertical déco          SEARCH-03, BOOK-02/03            (conditionné, parallèle possible dès Phase 1)
Phase 5  Pilotage & confort     DASH-02, ADMIN-02/03/04/05/09, COMM-03
```

La Phase 4 n'a pas de dépendance dure sur les Phases 2-3 : elle peut démarrer en parallèle dès que la Phase 1
est posée, si l'équipe veut paralléliser sur deux fronts (technique vs déco) plutôt que tout traiter en
séquentiel.
