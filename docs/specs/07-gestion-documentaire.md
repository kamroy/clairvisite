# 07 — Gestion documentaire

**Écran Stitch de référence** : Gestion Documentaire - Centralisée (marque "Immoelite" dans le prototype ;
marque retenue pour l'implémentation : **Luxe & Structure**, décision actée, voir
[00-overview.md](00-overview.md)).

## Personas

Acheteur ou Expert (selon qui a besoin d'un coffre-fort — à confirmer si c'est un espace par utilisateur ou
par projet), Admin (visibilité globale probable).

## User stories

### US-DOC-01 — Centraliser tous les documents d'un projet dans un coffre-fort
**En tant qu'** utilisateur, **je veux** un espace documentaire organisé en dossiers (Rapports Techniques,
Plans & Visuels, Pièces Administratives, Factures) avec recherche, filtre par projet, et upload par
glisser-déposer, **afin de** retrouver n'importe quel document sans fouiller mes emails.
- Indicateur de quota de stockage utilisé (ex. "12.4 GB / 50 GB").
- Tableau de documents : nom, expert associé, date, statut (ex. "Validé"), actions (télécharger,
  supprimer...).
- Filtre par projet en onglets au-dessus du tableau.
- Zone de dépôt glisser-déposer avec limite de taille affichée (ex. "Max 50MB").
- Bouton "Tout télécharger" (zip probable).
- **Priorité** : Should have — peut être livré après le rapport technique et la signature, dont il
  regroupe naturellement les sorties (PDF de rapport, devis signé, factures).
- **Écart avec l'existant** : aucun équivalent dans le code actuel. Dépend techniquement d'un stockage de
  fichiers (S3 ou équivalent) déjà nécessaire pour US-REPORT-01 (photos) et US-PAY-02 (devis signé) — à
  mutualiser plutôt qu'à construire deux fois.

## Priorisation suggérée
Should have — à séquencer après [05-rapport-technique.md](05-rapport-technique.md) et
[04-paiement-et-signature.md](04-paiement-et-signature.md) pour réutiliser la même brique de stockage de
fichiers.
