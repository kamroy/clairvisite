# Refonte Clairvisite — Vue d'ensemble

Source : prototype Stitch **"Expert Visite & Design"** (`projects/18319692774039758642`), 65 écrans évalués
le 2026-08-28 (68 au 2026-08-28 après les premiers écrans régénérés sous la marque retenue, voir ci-dessous).
Ce dossier traduit ce prototype en spécifications fonctionnelles pour guider la refonte de l'application
`clairvisite` actuelle.

Chaque fichier `NN-domaine.md` couvre un domaine fonctionnel : vue d'ensemble, personas concernés, user
stories avec critères d'acceptation, écart avec le code existant, et points ouverts.

## ✅ Décision actée : l'identité de marque

Le prototype n'avait **pas de nom de marque unique** — chaque lot d'écrans généré sur Stitch avait improvisé
le sien. Cinq identités différentes cohabitaient dans les mêmes parcours :

| Nom vu à l'écran | Où | Type d'écran |
|---|---|---|
| **Luxe & Structure** | Accueil, recherche, profils experts, réservation, mes projets, messagerie, notifications, rédaction rapport, connexion, dashboard expert | Nav marketing top-bar — **majoritaire (~40 écrans)** |
| Echelon Renovations / Echelon Rénovations & Architecture | Tunnel de paiement (résumé/paiement/confirmation), en-tête du devis PDF | Stepper checkout dédié |
| Blueprint | Signature électronique du devis | App sidebar (Projects/Messages/Documents/Contractors/Analytics) |
| Immoelite | Gestion documentaire | App sidebar (Tableau de bord/Gestion Documentaire) |
| Archiadmin / LUXE | Backoffice admin (gestion experts vs dashboard global/rôles) | Deux sidebars admin différentes, libellés en anglais |

**Décision (2026-08-28)** : la marque unique retenue pour toute l'application est **Luxe & Structure** —
côté consommateur (acheteur/expert) comme côté backoffice, où l'interface admin se présente comme
**"Luxe & Structure — Administration"** plutôt que Archiadmin/LUXE. Les fonctionnalités des écrans
Echelon/Blueprint/Immoelite restent valables telles que décrites dans ce dossier — seul l'habillage
(logo, libellés de marque) est à remplacer par Luxe & Structure lors de l'implémentation.

**Application dans Stitch (en cours)** : le même jour, 3 écrans ont été régénérés dans le projet Stitch sous
la marque Luxe & Structure — "S'enregistrer - Choix/Validation du profil", "Accueil - Immobilière &
Rénovation" (desktop) et "Accueil (Mobile)". Vérifié dans le HTML brut : aucune trace résiduelle
d'Echelon/Blueprint/Immoelite/Archiadmin sur ces trois écrans. Ils s'ajoutent aux écrans d'origine (qui
restent présents dans le projet) plutôt que de les remplacer. **Reste à régénérer** dans Stitch : le tunnel
de paiement (Echelon), la signature électronique (Blueprint), la gestion documentaire (Immoelite), et le
backoffice admin (Archiadmin/LUXE) — tant que ce n'est pas fait, ces écrans du prototype affichent encore
l'ancienne marque, mais cela ne change rien aux user stories de ce dossier, écrites indépendamment de
l'habillage visuel.

**Autre incohérence à trancher séparément** : le backoffice admin (rôles, gestion des experts) est rédigé en
anglais ("Roles & Permissions", "Expert Management", "Pending Validations"...) alors que tout le reste de
l'application est en français. À harmoniser en français sauf décision contraire — cette question reste
ouverte, indépendamment du nom de marque.

Tous les fichiers de specs qui suivent partent du principe que la marque retenue est **Luxe & Structure**,
en français partout.

## Écrans quasi-dupliqués (variantes de style Stitch, pas des besoins distincts)

Pour chaque paire, la spec ne documente qu'**un seul** besoin fonctionnel et retient la variante la plus
aboutie comme référence visuelle :

- Recherche d'experts : *"Luxe & Structure"* vs *"Interactions Premium"* → contenu identique, on garde
  *Luxe & Structure*.
- Dashboard expert : *"Raffinement & Pilotage"* vs *"Luxe & Structure"* → contenu identique, on garde
  *Luxe & Structure*.
- Accueil desktop : *"Immobilière & Rénovation"* (seule variante desktop) + *"Luxe & Structure" (Mobile)*
  → un seul besoin, deux gabarits (desktop/mobile).
- Les écrans suffixés *"(Validation)"* (ex. *Réservation - Choix Expert (Validation)*, *Réservation -
  Contre-visite (Validation)*, *Réservation Conseil Déco (Validation)*) sont des états secondaires (juste
  après sélection, avant confirmation finale) du même flux de réservation, pas des écrans indépendants — ils
  sont intégrés comme étapes dans les user stories de réservation plutôt que documentés à part.

## Personas

| Persona | Rôle dans l'app actuelle (le plus proche) | Nouveauté dans le prototype |
|---|---|---|
| **Acheteur / Client** | utilisateur `bookings`/`users` | Suivi multi-projets, paiement en ligne, messagerie, signature électronique, centre de notifications |
| **Expert technique** (contre-visite immobilière) | `technicians` | Rédaction de rapport technique structuré, dashboard avec CA/agenda |
| **Décoratrice / Expert déco** | absent | Persona entièrement nouveau — vertical métier "Décoration d'intérieur" |
| **Admin plateforme** | `admin` | Backoffice largement étendu : rôles & permissions, branding, emails, support, exports |

## Cartographie fonctionnelle (10 domaines)

| Fichier | Domaine | Nb écrans Stitch couverts |
|---|---|---|
| [01-auth-et-comptes.md](01-auth-et-comptes.md) | Inscription, connexion, validation de profil (acheteur + expert) | 8 |
| [02-recherche-et-decouverte.md](02-recherche-et-decouverte.md) | Recherche d'experts, profils publics, hub décoration | 8 |
| [03-reservation-et-projets.md](03-reservation-et-projets.md) | Réservation (contre-visite, devis travaux, conseil déco), suivi "Mes Projets" | 12 |
| [04-paiement-et-signature.md](04-paiement-et-signature.md) | Checkout paiement, signature électronique de devis | 10 |
| [05-rapport-technique.md](05-rapport-technique.md) | Rédaction (expert) et consultation (client) du rapport technique | 2 |
| [06-communication.md](06-communication.md) | Messagerie privée, centre de notifications, préférences | 5 |
| [07-gestion-documentaire.md](07-gestion-documentaire.md) | Coffre-fort documentaire centralisé | 1 |
| [08-dashboards.md](08-dashboards.md) | Dashboard expert, dashboard admin (stats globales) | 3 |
| [09-administration-backoffice.md](09-administration-backoffice.md) | Rôles, régions, branding, emails, config globale, validation experts/techniciens, gestion acheteurs/experts, support, exports | 11 |
| — | Assets purs (logo, photos stock) — non fonctionnels, ignorés | 3 |
| [10-sequencement.md](10-sequencement.md) | Plan de séquencement en 6 phases (dépendances + priorités MoSCoW) | — |

## Écart global avec le code existant

Le code actuel (`server/src/modules`: `auth`, `bookings`, `availabilities`, `technicians`, `regions`,
`users`, `admin` ; `client/src/pages`: Login, Signup, Search, Profile, BuyerBookings,
BookingConfirmation, TechnicianDashboard/Profile, Admin) couvre une version simple du parcours
**acheteur ↔ technicien ↔ admin** centrée sur la prise de rendez-vous.

Le prototype ajoute des pans **absents aujourd'hui** :
- Paiement en ligne (aucun module `payments` côté serveur)
- Messagerie et notifications (aucun module `messaging`/`notifications`)
- Signature électronique et gestion documentaire (aucun module `documents`/`signature`)
- Vertical métier "Décoration d'intérieur" (aucune notion d'expert non-technicien)
- Rapport technique structuré (les rendez-vous existent mais pas de contenu de rapport)
- Backoffice admin riche (rôles fins, branding, emails, support, exports — l'admin actuel est minimal)

Chaque fichier de domaine détaille l'écart précisément et propose une priorité MoSCoW par user story pour
faciliter le séquençage de la refonte.
