# 03 — Réservation & Suivi de projets

**Écrans Stitch de référence** : Réservation - Choix de l'expert et date (+ état "Validation"),
Réservation - Détails du Projet, Réservation - Contre-visite Technique (+ état "Validation"), Réservation -
Confirmation de visite, Trouver un Expert pour Contre-visite, Réservation Conseil Déco - Détails du projet
(+ état "Validation"), Demander un Devis de Travaux, Mes Projets - Luxe & Structure (+ Mobile), Statut -
Validation en cours (partagé avec l'onboarding expert, voir
[01-auth-et-comptes.md](01-auth-et-comptes.md)).

## Personas

Acheteur (parcours principal), Expert (reçoit la demande).

## User stories

### US-BOOK-01 — Réserver une contre-visite technique en 3 étapes
**En tant qu'** acheteur, **je veux** un tunnel en 3 étapes (Détails du bien → Expert & Date → Confirmation),
**afin de** réserver une contre-visite avant l'achat d'un bien.
- **Étape 1** : type de bien (Appartement/Maison), surface estimée (m²), adresse avec autocomplétion +
  carte interactive.
- **Étape 2** : liste d'experts disponibles (carte : photo, nom, titre, note, années d'expérience, tags de
  spécialité, bouton "Sélectionner") + calendrier avec créneaux du jour groupés matin/après-midi ; panneau
  latéral récapitulatif ("Votre bien", expert choisi, date & heure) qui se remplit au fur et à mesure.
- **Étape 3** : récapitulatif final avant paiement (voir
  [04-paiement-et-signature.md](04-paiement-et-signature.md)).
- Stepper visuel en haut de page à 3 points, toujours visible.
- **Priorité** : Must have.
- **Écart avec l'existant** : [Search.jsx](../../client/src/pages/Search.jsx) et le module
  [availabilities](../../server/src/modules/availabilities) gèrent déjà créneau + technicien, mais **il
  manque** : le tunnel multi-étapes avec récap live, le champ surface/type de bien, la carte interactive
  d'adresse. Le modèle `Booking` actuel n'a que `propertyAddress` en texte libre
  ([schema.prisma](../../server/prisma/schema.prisma)) — pas de type de bien ni de surface.

### US-BOOK-02 — Demander un devis de travaux
**En tant qu'** acheteur, **je veux** décrire mon projet de rénovation en plusieurs étapes (Nature des
travaux → Détails de l'espace → Budget & Description), en sélectionnant une ou plusieurs catégories
(Rénovation Complète, Cuisine & Bain, Sols & Revêtements, Peinture & Finitures), **afin de** recevoir une
estimation adaptée.
- Sélection multiple de catégories sous forme de cartes cliquables.
- Barre de progression latérale à 3 étapes.
- **Priorité** : Should have (nouveau besoin métier, pas de dépendance technique bloquante).
- **Écart avec l'existant** : aucun équivalent — à créer (nouveau type de demande, distinct d'une
  réservation de créneau).

### US-BOOK-03 — Réserver une consultation décoration
**En tant qu'** acheteur, **je veux** un tunnel de réservation dédié à la décoration (détails du projet →
choix de la décoratrice → confirmation), **afin de** planifier une consultation déco.
- **Priorité** : Should have — dépend de la décision produit sur le vertical "décoration".
- **Écart avec l'existant** : aucun équivalent.

### US-BOOK-04 — Suivre tous mes projets dans un tableau de bord unique
**En tant qu'** acheteur, **je veux** une page "Mes Projets" listant mes démarches en cours (avec badge de
statut, type de projet, expert assigné, prochaine échéance) et mes projets passés dans un historique
séparé, **afin de** avoir une vue d'ensemble sans chercher dans mes emails.
- Bandeau d'alerte ("2 projets en cours requièrent votre attention").
- Carte projet en cours : type, statut coloré (ex. "Documents requis", "RDV confirmé"), adresse, expert,
  barre de progression, CTA "Voir les détails" + "Contacter l'expert".
- Bloc latéral "Projets passés" avec lien "Voir tout l'historique".
- Bouton "+ Nouveau Projet" toujours accessible.
- **Priorité** : Must have.
- **Écart avec l'existant** : [BuyerBookings.jsx](../../client/src/pages/BuyerBookings.jsx) liste des
  réservations mais sans notion de "projet" transverse (un projet peut regrouper contre-visite + devis +
  déco), sans statut visuel riche, sans historique séparé.

## Priorisation suggérée
Must have : US-BOOK-01, 04. Should have : US-BOOK-02, 03.
