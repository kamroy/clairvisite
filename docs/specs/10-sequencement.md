# 10 — Plan de séquencement

Ce plan ordonne les ~50 user stories des 9 fichiers de domaine en phases livrables, en croisant deux critères :
la priorité MoSCoW déjà posée dans chaque fichier, et les **dépendances techniques réelles** (une story qui
a besoin d'une brique pas encore construite ne peut pas passer avant elle, même si elle est "Must have").

## Dépendances transverses à poser avant de coder les features

Trois éléments sont utilisés par plusieurs domaines à la fois — les construire une fois, tôt, évite de les
refaire en double :

| Brique | Consommée par | Décision à prendre |
|---|---|---|
| **Stockage de fichiers** (S3 ou équivalent) | Rapport technique (photos), Signature (devis PDF + doc signé), Gestion documentaire, Inscription expert (pièces justificatives) | Provider (S3/GCS/Cloudinary...) |
| **PSP de paiement** | Paiement (US-PAY-01) | Stripe pressenti — à confirmer |
| **Canal temps réel** (WebSocket) | Messagerie (US-COMM-01), Centre de notifications (US-COMM-02) | NestJS Gateway (socket.io) — pas de nouveau service externe nécessaire |

Deux points fonctionnels, déjà signalés comme "points ouverts" dans les specs, **bloquent le modèle de
données** et doivent être tranchés avant la Phase 1 :
- [01-auth-et-comptes.md](01-auth-et-comptes.md) : un rôle professionnel unique + champ spécialité, ou deux
  rôles distincts (technicien / expert déco) ?
- Langue de l'admin (français partout) — moins bloquant, mais évite de coder deux fois les libellés.

## Phase 0 — Fondations (avant toute feature)
- Trancher les deux points ouverts ci-dessus.
- Mettre en place le stockage de fichiers (brique transverse).
- Choisir le PSP.
- **Durée indicative** : quelques jours, aucune UI livrée.

## Phase 1 — Combler l'écart sur le parcours existant (Must have)
Le socle acheteur ↔ technicien ↔ admin existe déjà en version simple ; cette phase l'amène au niveau du
prototype avant d'ajouter de nouvelles briques.
- US-AUTH-01, 02, 04, 06 (choix de profil, connexion, dossier pro multi-étapes avec SIRET/documents,
  validation admin)
- US-SEARCH-01, 02 (filtres recherche enrichis, profil public avec grille tarifaire/portfolio)
- US-BOOK-01 (tunnel de réservation 3 étapes avec récap live)
- US-BOOK-04 (page "Mes Projets" transverse)
- US-DASH-01 (dashboard expert avec KPIs)

*Aucune dépendance externe nouvelle — s'appuie sur `auth`, `bookings`, `technicians`, `availabilities`
existants.*

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
