# 06 — Communication

**Écrans Stitch de référence** : Messagerie Privée - Luxe & Structure (+ Mobile), Centre de Notifications -
Luxe & Structure, Préférences de Notifications.

## Personas

Acheteur, Expert (les deux échangent), Admin (notifications système, voir
[09-administration-backoffice.md](09-administration-backoffice.md)).

## User stories

### US-COMM-01 — Échanger par messagerie privée liée à un projet ✅ Implémentée (2026-08-29)
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

**Implémentation** : nouveau module `messaging/` — une `Conversation` par `Booking` (1:1, créée
paresseusement au premier accès, l'interlocuteur étant déjà déterminé par la réservation). Page
[Messages.jsx](../../client/src/pages/Messages.jsx) : liste de conversations + fil, layout responsive
(liste seule sur mobile tant qu'aucune conversation n'est ouverte, fil plein écran une fois sélectionné).
Accessible depuis le lien "Messages" du header, "Contacter l'expert" (Mes Projets) et "Message"/"Contacter
le client" (réservations côté expert).

**Simplifications assumées** :
- **Polling plutôt que WebSocket** pour le "temps réel" — explicitement permis par la spec
  ("notifications temps réel (WebSocket ou polling)"). Le fil se rafraîchit toutes les 4s, la liste de
  conversations toutes les 10s. Évite une dépendance socket.io (client + serveur) et la gestion du cycle
  de vie d'une connexion persistante pour un gain marginal à l'échelle de cette application. Vérifié en
  réel avec deux sessions navigateur simultanées : un message envoyé par une partie apparaît chez l'autre
  sans rechargement de page.
- **Pas de barre de recherche** dans la liste de conversations (peu utile avec le nombre de conversations
  attendu — une par réservation).
- **Pas de bouton "Planifier un RDV"** dans l'en-tête du fil — proposer une nouvelle réservation depuis la
  messagerie demanderait d'embarquer le tunnel de réservation dans ce contexte, hors périmètre de cette
  tranche.
- **Pas de "checklist d'avancement"** dans un panneau contextuel séparé — aucune notion de jalons/étapes
  n'existe dans le modèle actuel au-delà de confirmé/annulé (et soumis/brouillon pour le rapport
  technique) ; fabriquer une checklist artificielle aurait été plus trompeur qu'utile.
- **Pièces jointes** : n'importe quel type de fichier (pas seulement des images), affichées comme carte
  "📎 nom-du-fichier.ext" avec lien de téléchargement pré-signé — pas de prévisualisation.

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
