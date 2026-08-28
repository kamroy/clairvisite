# 09 — Administration (backoffice)

**Écrans Stitch de référence** : Administration - Rôles & Permissions, Couverture Régionale, Identité
Visuelle, Modèles d'Emails, Paramètres Globaux d'Emails, Configuration Globale, Gestion des Acheteurs,
Gestion des Experts, Support & Réclamations, Exportation de Rapports. (Validation des Experts/Techniciens
est traité dans [01-auth-et-comptes.md](01-auth-et-comptes.md), et le dashboard de stats globales dans
[08-dashboards.md](08-dashboards.md).)

> Ces écrans portent trois habillages différents dans le prototype ("Luxe & Structure Panel", "ARCHIADMIN",
> "LUXE") — la marque retenue pour l'implémentation est **"Luxe & Structure — Administration"** partout
> (décision actée, voir [00-overview.md](00-overview.md)). Seuls deux écrans du lot sont rédigés en anglais
> dans le prototype (*Rôles & Permissions* et *Gestion des Experts*) ; le reste du backoffice est déjà en
> français — à harmoniser en français partout (question distincte du nom de marque, encore ouverte).

## Persona

Admin.

## User stories

### US-ADMIN-01 — Gérer des rôles admin à permissions fines
**En tant qu'** admin principal, **je veux** créer des rôles (Super Admin, Platform Manager, Support Agent,
Financial Auditor...) avec des permissions groupées par domaine (Gestion des utilisateurs, Finances,
Support, Paramètres plateforme) activables individuellement, assigner des utilisateurs à un rôle, et
dupliquer un rôle existant comme base, **afin de** déléguer l'administration sans donner un accès total.
- Liste des rôles existants avec nombre d'utilisateurs assignés.
- Panneau d'édition des permissions par groupe (toggles).
- Bouton "Cloner ce rôle" pour créer une variante.
- Journal d'audit ("Audit Logs") accessible depuis cette page.
- **Priorité** : Must have avant d'ouvrir l'admin à plusieurs personnes.
- **Écart avec l'existant** : le module [admin](../../server/src/modules/admin) actuel n'a probablement pas
  de système de rôles/permissions granulaire (seul `Role.admin` existe dans
  [schema.prisma](../../server/prisma/schema.prisma)) — à vérifier et étendre en RBAC si plusieurs
  administrateurs doivent coexister.

### US-ADMIN-02 — Piloter la couverture géographique et la tarification par région
**En tant qu'** admin, **je veux** une carte des zones actives/partielles avec, par région, des interrupteurs
pour activer chaque service (Contre-visite, Déco & Plans, Suivi Travaux) et un coefficient de prix
ajustable, plus une liste d'attente des villes en demande d'expansion, **afin de** piloter l'ouverture
progressive du marché.
- Carte interactive avec légende de statut de zone.
- Tableau "Régions Actives" : toggles par service + coefficient de prix éditable + action modifier.
- Panneau "Expansion & Waitlist" : villes avec nombre de demandes en attente, bouton "Gérer la Waitlist".
- Répartition des professionnels par métier.
- **Priorité** : Should have.
- **Écart avec l'existant** : le module [regions](../../server/src/modules/regions) gère aujourd'hui un
  simple référentiel des 101 départements sans notion de statut d'activation ni de coefficient tarifaire —
  extension nécessaire.

### US-ADMIN-03 — Configurer l'identité visuelle de la plateforme
**En tant qu'** admin, **je veux** éditer le logo, la palette de couleurs, la typographie et les assets de
marque depuis une page dédiée, avec un aperçu en direct et un bouton "Appliquer les modifications", **afin
de** faire évoluer le branding sans intervention développeur.
- Upload logo principal + favicon.
- Palette (Primary/Secondary/Surface/Erreur) avec aperçu couleur.
- Sélecteur de typographie (titre/corps) avec aperçu de texte réel.
- Bibliothèque d'assets de marque (photos).
- **Priorité** : Could have — utile pour du marque blanche/multi-marque, non bloquant pour un lancement
  mono-marque où le thème peut être codé en dur.
- **Écart avec l'existant** : aucun équivalent — nécessite de sortir le thème du code (tokens dynamiques)
  si cette fonctionnalité est retenue.

### US-ADMIN-04 — Gérer les modèles et paramètres globaux d'emails
**En tant qu'** admin, **je veux** éditer les modèles d'emails transactionnels (confirmation de réservation,
relance, etc.) et les paramètres globaux d'envoi (expéditeur, signature), **afin de** garder une
communication cohérente sans redéploiement.
- **Priorité** : Could have.
- **Écart avec l'existant** : les emails semblent aujourd'hui codés en dur côté serveur (Resend est déjà
  intégré côté infra, à vérifier s'il y a des templates éditables) — non inspecté en détail dans le
  prototype, contenu exact à confirmer visuellement avant chiffrage.

### US-ADMIN-05 — Configuration globale de la plateforme
**En tant qu'** admin, **je veux** une page de paramètres globaux (probable : commissions, devise, mentions
légales, seuils métier), **afin de** ajuster les règles business sans code.
- **Priorité** : Could have.
- **Écart avec l'existant** : contenu exact non inspecté visuellement — à confirmer avant chiffrage précis.

### US-ADMIN-06 — Gérer la base clients/acheteurs
**En tant qu'** admin, **je veux** une liste de tous les acheteurs avec recherche, filtre par statut
(actif/inactif), et par client : contact, date d'inscription, nombre de projets, dépense totale, **afin de**
suivre la base clients et repérer les comptes à fort volume.
- 3 KPI en tête : total clients, projets actifs, volume dépensé.
- **Priorité** : Should have.
- **Écart avec l'existant** : à comparer avec les capacités actuelles du module
  [admin](../../server/src/modules/admin)/[users](../../server/src/modules/users) — probablement partiel.

### US-ADMIN-07 — Gérer la base des experts
**En tant qu'** admin, **je veux** une liste de tous les experts (au-delà de la simple validation) avec
recherche par nom/email/ID, filtre par métier et par statut, **afin de** superviser l'ensemble du réseau de
professionnels au quotidien (pas seulement à l'inscription).
- KPIs : total experts, validations en attente, statut actif.
- **Priorité** : Should have.
- **Écart avec l'existant** : chevauche partiellement US-AUTH-06 (validation) — à fusionner en une seule
  vue "Gestion des Experts" avec un filtre de statut plutôt que deux écrans séparés.

### US-ADMIN-08 — Traiter les tickets support et litiges
**En tant qu'** admin support, **je veux** un tableau kanban des tickets (À traiter / En cours / Résolu)
avec catégorie (Litige, Technique, Facturation), niveau d'urgence, assignation, et des KPIs de charge
(tickets ouverts, en cours, litiges haute priorité, taux de résolution), **afin de** gérer les réclamations
efficacement.
- **Priorité** : Should have.
- **Écart avec l'existant** : aucun équivalent — nouveau module `support`/`tickets` à créer.

### US-ADMIN-09 — Générer des rapports d'exports personnalisés
**En tant qu'** admin, **je veux** choisir un type de rapport (Financier, Opérationnel, Performance Experts,
Satisfaction Client), filtrer par période/catégorie/zone géographique, prévisualiser puis générer/télécharger
le document, **afin de** produire des analyses ad hoc sans requête SQL manuelle.
- **Priorité** : Could have — utile mais peut attendre que les données sous-jacentes (paiements, tickets,
  satisfaction) existent réellement.
- **Écart avec l'existant** : dépend de toutes les autres briques (paiement, support, notation) pour avoir
  des données à exporter — à séquencer en dernier.

## Priorisation suggérée
Must have : US-ADMIN-01 (dès qu'il y a plus d'un admin). Should have : US-ADMIN-02, 06, 07, 08. Could have :
US-ADMIN-03, 04, 05, 09.
