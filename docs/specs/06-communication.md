# 06 — Communication

**Écrans Stitch de référence** : Messagerie Privée - Luxe & Structure (+ Mobile), Centre de Notifications -
Luxe & Structure, Préférences de Notifications.

## Personas

Acheteur, Expert (les deux échangent), Admin (notifications système, voir
[09-administration-backoffice.md](09-administration-backoffice.md)).

## User stories

### US-COMM-01 — Échanger par messagerie privée liée à un projet
**En tant qu'** acheteur ou expert, **je veux** une messagerie type chat organisée par conversation (une
par projet/interlocuteur), avec envoi de fichiers et un panneau contextuel affichant les infos du projet en
cours, **afin de** garder tous les échanges liés à une intervention au même endroit.
- Liste de conversations à gauche (avatar, nom, dernier message, horodatage), barre de recherche.
- Fil de discussion central avec bulles de message, horodatage, indicateur de lecture.
- Pièces jointes affichées comme cartes de fichier dans le fil (ex. "Rapport.Structure_V2.pdf").
- Bouton d'action rapide dans l'en-tête ("Planifier un RDV").
- Panneau contextuel à droite : récapitulatif du bien/projet lié, checklist d'avancement, fichiers
  partagés.
- Déclinaison mobile (liste + fil en plein écran).
- **Priorité** : Must have.
- **Écart avec l'existant** : aucun module de messagerie dans le code actuel. Nécessite : modèle
  conversation/message, upload de pièces jointes, lien conversation ↔ projet/booking, notifications
  temps réel (WebSocket ou polling).

### US-COMM-02 — Centraliser les notifications d'activité
**En tant qu'** utilisateur, **je veux** un centre de notifications groupé par période (Aujourd'hui, Hier)
et filtrable par catégorie (Visites Techniques, Décoration & Design, Devis & Finances, Compte & Profil),
avec une action directe sur chaque notification (ex. "Générer le rapport", "Répondre"), **afin de** ne rien
manquer sans devoir naviguer dans chaque module.
- Compteur de notifications non lues.
- Chaque notification a une icône de catégorie, un texte court, et un CTA contextuel.
- **Priorité** : Should have.
- **Écart avec l'existant** : aucun équivalent — nécessite un système de notifications transverses
  (événements émis par les modules booking/report/payment/document).

### US-COMM-03 — Gérer mes préférences de notifications
**En tant qu'** utilisateur, **je veux** choisir quels types d'événements me notifient et par quel canal
(email, in-app), **afin de** ne pas être submergé par des alertes non pertinentes.
- **Priorité** : Could have (confort, non bloquant pour le MVP).
- **Écart avec l'existant** : aucun équivalent.

## Priorisation suggérée
Must have : US-COMM-01. Should have : US-COMM-02. Could have : US-COMM-03.
