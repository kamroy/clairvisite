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
| **Canal temps réel** (WebSocket) | Messagerie (US-COMM-01), Centre de notifications (US-COMM-02) | ❌ Jamais construit — les deux stories ont finalement opté pour du polling (la spec autorisait les deux options), voir [06-communication.md](06-communication.md) |

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

## Phase 1 — Combler l'écart sur le parcours existant (Must have) ✅ Terminée (2026-08-29)
Le socle acheteur ↔ technicien ↔ admin existe déjà en version simple ; cette phase l'amène au niveau du
prototype avant d'ajouter de nouvelles briques.
- ✅ US-AUTH-01 (choix de profil acheteur/pro à l'inscription)
- ✅ US-AUTH-02 (connexion + mot de passe oublié) — login email/mdp et callback OIDC Google réutilisés tels
  quels (redirection post-connexion vers `/projects` ou `/technician/dashboard`) ; ajout du bouton
  afficher/masquer le mot de passe et du flux complet de réinitialisation (jeton haché sha256, TTL 1h, email
  via Resend, anti-enumeration), vérifié en réel contre Postgres et via un vrai parcours navigateur.
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
existants. Tests à la fin de la phase : 24 suites/90 tests unitaires + 7 suites/63 tests e2e serveur, 17
suites/104 tests client, tous au vert.*

Tout le travail de Phase 0 et Phase 1 est maintenant committé sur `main` (voir l'historique git), après
avoir initialement été laissé non committé pendant plusieurs tranches — la découpe par commit a dû être
reconstruite a posteriori pour la majeure partie, avec quelques fichiers partagés entre plusieurs user
stories regroupés dans un seul commit (voir les messages de commit pour le détail).

## Phase 2 — Boucler la transaction (Must have, cœur de la valeur produit) ⚠️ Partielle (2026-08-29)
- ⏸️ US-PAY-01 (paiement) — **explicitement reporté**, sur demande (2026-08-29) : le paiement n'est pas
  traité dans cette tranche. Stripe reste le PSP retenu (Phase 0) le jour où il sera repris. *Dépend du
  PSP (Phase 0)*.
- ✅ US-REPORT-01, 02 (rédaction + consultation du rapport technique) — *dépendait du stockage fichiers
  (Phase 0)*, voir [05-rapport-technique.md](05-rapport-technique.md).
- ✅ US-COMM-01 (messagerie liée au projet) — implémentée avec du **polling plutôt que le canal temps réel
  WebSocket** initialement pressenti en Phase 0 (la spec autorisait explicitement les deux options) : pas
  de brique transverse WebSocket construite, voir [06-communication.md](06-communication.md). US-COMM-02
  (centre de notifications), qui devait aussi consommer cette brique, en tiendra compte le moment venu.

Le parcours "contre-visite technique" est donc complet de bout en bout *hors paiement* : recherche →
réservation → rapport → échange avec l'expert. Le paiement reste la pièce manquante pour boucler
entièrement la transaction.

## Phase 3 — Confiance & conformité (Should have) ⚠️ Partielle (2026-08-29)
- US-PAY-02 (signature électronique du devis) — *réutilise le stockage fichiers*. Reste à faire (dépend de
  US-PAY-01, lui-même reporté en Phase 2).
- ✅ US-COMM-02 (centre de notifications) — implémenté avec du **polling plutôt que le canal temps réel**
  initialement pressenti (même choix que la messagerie, Phase 2), voir
  [06-communication.md](06-communication.md).
- US-DOC-01 (gestion documentaire centralisée) — *réutilise le stockage fichiers, regroupe les sorties de
  Phase 2 (rapports, devis signés)*. Reste à faire.
- ✅ US-ADMIN-01 (rôles & permissions admin) — implémenté en avance sur ce séquencement (2026-08-29), sur
  demande explicite, avant que Phase 3 ne soit officiellement attaquée dans l'ordre. Voir
  [09-administration-backoffice.md](09-administration-backoffice.md#us-admin-01--gérer-des-rôles-admin-à-permissions-fines--implémentée-2026-08-29) —
  les permissions fines sont stockées et assignables, mais aucun endpoint (nouveau ou existant) ne les
  consulte encore pour autoriser une action ; tout reste gated par le rôle grossier `admin`.
- US-ADMIN-06, 07, 08 (gestion clients, gestion experts au quotidien, support & litiges) — reste à faire.

## Phase 4 — Vertical métier "Décoration d'intérieur" (Should have, conditionné)
Ce persona n'est **plus entièrement nouveau** : la Phase 0 a tranché pour un rôle professionnel unique +
champ `category`, donc une "décoratrice" est un `Technician` avec `category: decoration` — le blocage
initial ("dépend de la décision produit confirmée sur ce vertical") ne tient plus pour les stories qui ne
dépendent que de ce modèle.
- ✅ US-BOOK-03 (conseil déco) — implémentée en avance sur ce séquencement (2026-08-29), sur demande
  explicite, en réutilisant le tunnel US-BOOK-01 (voir [03-reservation-et-projets.md](03-reservation-et-projets.md#us-book-03--réserver-une-consultation-décoration--implémentée-2026-08-29))
- US-SEARCH-03 (hub décoration — reste à faire, dépend d'une vraie décision produit sur la galerie
  d'inspirations et sa taxonomie de styles)
- US-BOOK-02 (devis travaux — reste à faire, persona acheteur uniquement, aucune dépendance sur la
  catégorie décoration)

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
Phase 2  Boucler la transaction PAY-01 (reporté), REPORT-01/02 ✅, COMM-01 ✅
Phase 3  Confiance & conformité PAY-02, DOC-01, ADMIN-06/07/08  (COMM-02 ✅, ADMIN-01 ✅ faits)
Phase 4  Vertical déco          SEARCH-03, BOOK-02 (BOOK-03 ✅ fait)  (conditionné, parallèle possible dès Phase 1)
Phase 5  Pilotage & confort     DASH-02, ADMIN-02/03/04/05/09, COMM-03
```

La Phase 4 n'a pas de dépendance dure sur les Phases 2-3 : elle peut démarrer en parallèle dès que la Phase 1
est posée, si l'équipe veut paralléliser sur deux fronts (technique vs déco) plutôt que tout traiter en
séquentiel.
