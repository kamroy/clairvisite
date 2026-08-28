# 04 — Paiement & Signature électronique

**Écrans Stitch de référence** : Paiement - Méthode Sécurisée (+ Mobile), Paiement - Validation de Carte
(Desktop/Mobile), Paiement - Récapitulatif de Commande (+ Mobile), Paiement - Confirmation de Réservation
(+ Mobile), Signature Électronique - Devis Rénovation, Confirmation de Signature.

> Ces écrans utilisent le nom de marque "Echelon Renovations" pour le stepper de paiement et "Blueprint"
> pour la signature dans le prototype Stitch — la marque retenue pour l'implémentation est **Luxe &
> Structure** (décision actée, voir [00-overview.md](00-overview.md)). Le contenu fonctionnel ci-dessous
> reste valable indépendamment de l'habillage.

## Personas

Acheteur (paie et signe), Expert (informé une fois le paiement confirmé).

## User stories

### US-PAY-01 — Payer une prestation en 3 étapes avec récapitulatif permanent
**En tant qu'** acheteur, **je veux** un tunnel de paiement "Résumé → Paiement → Confirmation" avec un
badge "Paiement sécurisé" visible en permanence, **afin de** payer en confiance.
- Choix du mode de paiement : Carte Bancaire / Apple Pay / Virement (onglets).
- Formulaire carte : nom sur la carte, numéro, date d'expiration, CVV.
- Panneau latéral fixe : résumé de commande (libellé prestation, montant HT, TVA 20 %, total), badge
  "Paiement 100 % sécurisé".
- Champ "Code promotionnel" avec bouton "Appliquer" sur l'écran de récapitulatif.
- Bandeaux de confiance en pied de page : SSL Secure, PCI Compliant, Identity Protected.
- Écran de confirmation : coche de succès, numéro de commande, date, montant payé, message sur la
  prochaine étape ("L'expert a été informé, vous recevrez une notification 24h avant la visite"), CTA
  "Télécharger la facture" + "Voir mon espace".
- Déclinaison mobile pour chaque étape (Méthode, Validation carte, Récapitulatif, Confirmation).
- **Priorité** : Must have.
- **Écart avec l'existant** : **aucun module de paiement dans le code actuel** (`BookingStatus` n'a que
  `confirmed`/`cancelled`, pas d'état lié au paiement —
  [schema.prisma](../../server/prisma/schema.prisma)). Nécessite : intégration d'un PSP (Stripe ou
  équivalent), génération de facture PDF téléchargeable, notification de l'expert après paiement.

### US-PAY-02 — Signer électroniquement un devis
**En tant qu'** acheteur, **je veux** visualiser le PDF du devis dans une visionneuse intégrée (zoom,
pagination), cocher une case d'acceptation des conditions, puis apposer ma signature manuscrite dans un
encart dédié, **afin de** valider légalement l'intervention sans échange papier.
- Visionneuse PDF avec navigation de page ("1 sur 3"), boutons Télécharger / Imprimer.
- Panneau "Validation" : case à cocher obligatoire ("Je reconnais avoir pris connaissance des Conditions
  Générales d'intervention et je les accepte"), zone de signature manuscrite avec bouton "Dessiner"
  (probable pad de signature tactile/souris).
- Écran "Confirmation de Signature" après validation.
- **Priorité** : Should have — fonctionnalité à forte valeur légale mais peut suivre le paiement en V2 si
  besoin de livrer plus vite.
- **Écart avec l'existant** : aucun équivalent (pas de notion de devis ni de document dans le modèle actuel).
  Nécessite : génération de PDF de devis, stockage du document signé + horodatage, conformité
  signature électronique (a minima signature simple ; signature qualifiée eIDAS si exigence légale à
  confirmer avec le métier).

## Priorisation suggérée
Must have : US-PAY-01. Should have : US-PAY-02 (bloquant uniquement si le business exige un devis signé
avant intervention — à confirmer).
