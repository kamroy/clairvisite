# 08 — Tableaux de bord

**Écrans Stitch de référence** : Tableau de bord Expert - Luxe & Structure (+ variante identique
"Raffinement & Pilotage" + Mobile), Tableau de Bord - Statistiques Globales (Admin, marque "LUXE").

## Personas

Expert, Admin.

## User stories

### US-DASH-01 — Dashboard expert avec KPIs et agenda
**En tant qu'** expert, **je veux** un tableau de bord affichant mes projets actifs, mes visites à venir,
mes honoraires générés (avec mini-graphique de tendance), et mes dossiers en cours avec accès direct, **afin
de** piloter mon activité sans naviguer entre plusieurs pages.
- Message de bienvenue personnalisé ("Bonjour, {Prénom}.").
- 3 cartes KPI : Projets actifs, Visites à venir, Honoraires générés (+ graphique).
- Actions rapides : "Rédiger un rapport", "Planifier une visite", "Comparer un expert" (à confirmer selon
  contexte).
- Liste "Dossiers en cours" avec vignette photo du bien, client, type d'intervention, statut coloré.
- Panneau "Agenda Expert" listant les prochains rendez-vous (date, heure, type, lien "Voir l'agenda
  complet").
- Bloc "Ressources Pro" (assurance décennale, charte qualité, grille tarifaire — liens/documents utiles).
- Fil "Actualités Pro" (actus métier).
- Déclinaison mobile dédiée.
- **Priorité** : Must have.
- **Écart avec l'existant** : [TechnicianDashboard.jsx](../../client/src/pages/TechnicianDashboard.jsx)
  existe mais sans KPI financiers, sans graphique de tendance, sans bloc "Ressources Pro"/"Actualités" — à
  auditer champ par champ.

### US-DASH-02 — Dashboard admin avec statistiques globales de la plateforme
**En tant qu'** admin, **je veux** une vue globale (chiffre d'affaires, projets actifs, satisfaction
moyenne des experts, valeur moyenne de projet) avec un graphique de croissance du CA, une répartition des
projets par type de service, un fil d'activité récente, et une carte de couverture nationale par région,
**afin de** piloter la plateforme au global.
- 4 cartes KPI en tête avec variation en % vs période précédente.
- Sélecteur de période (30 derniers jours / Ce mois / Année).
- Graphique de tendance CA (courbe).
- Répartition des projets par typologie de service (barres horizontales avec %).
- Fil "Activité Récente" (inscriptions, tickets support, projets premium...).
- "Couverture Nationale" : classement des villes/régions par part d'activité.
- **Priorité** : Should have (utile au pilotage mais pas bloquant pour lancer le produit).
- **Écart avec l'existant** : [Admin.jsx](../../client/src/pages/Admin.jsx) est probablement plus proche
  d'un CRUD que d'un dashboard analytique — à vérifier, et nécessite d'agréger des données de plusieurs
  modules (paiement, booking, satisfaction) qui n'existent pas encore.

## Priorisation suggérée
Must have : US-DASH-01. Should have : US-DASH-02 (dépend de la plupart des autres modules pour avoir des
données à afficher — à livrer en dernier).
