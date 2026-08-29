# 02 — Recherche & Découverte

**Écrans Stitch de référence** : Recherche d'Experts - Luxe & Structure (desktop) + Interactions Premium
(variante identique) + Mobile, Profil Public Expert - Sophie Laurent, Profil Décoratrice - Sophie Laurent,
Décoration d'Intérieur - Inspirations & Experts, Décoratrices d'Intérieur & Idées, Accueil (Immobilière &
Rénovation / Luxe & Structure Mobile), Trouver un Expert pour Contre-visite.

## Personas

Acheteur (principal), visiteur non connecté (peut consulter sans compte).

## User stories

### US-SEARCH-01 — Rechercher un expert par nom, spécialité et région
**En tant qu'** acheteur, **je veux** chercher un expert par mot-clé et région avec des filtres de profil
(Tous les profils / Contre-visite Technique / Décoration d'intérieur / Architecture & Rénovation), **afin
de** trouver rapidement le bon interlocuteur.
- Barre de recherche double : texte libre + sélecteur de région.
- Filtres latéraux : expérience (Plus de 10 ans / 5 à 10 ans / Moins de 5 ans), disponibilité (ex. "Cette
  semaine"), note minimum (étoiles).
- Tri par pertinence (menu déroulant).
- Résultats en cartes : photo, nom, badge de spécialité, note, années d'expérience, tags de compétences,
  CTA "Voir le profil" + icône message rapide.
- Pagination numérotée.
- **Priorité** : Must have.
- **Écart avec l'existant** : [Search.jsx](../../client/src/pages/Search.jsx) existe déjà pour les
  techniciens/régions ; **manquants** : filtre par type de profil (technique/déco/architecture — suppose
  la clarification du modèle de rôles, voir [01-auth-et-comptes.md](01-auth-et-comptes.md)), filtre
  expérience, filtre disponibilité, note minimum, CTA message direct depuis la carte résultat.

### US-SEARCH-02 — Consulter le profil public d'un expert
**En tant qu'** acheteur, **je veux** voir le profil détaillé d'un expert (bio, certifications, portfolio
avant/après, grille tarifaire, avis), **afin de** décider s'il correspond à mon besoin avant de réserver.
- En-tête : photo, nom, spécialité, badge de certification, note globale, délai de réponse moyen.
- Section "À propos" (bio libre).
- Portfolio en galerie (réalisations avec avant/après pour la déco).
- Grille tarifaire par prestation (ex. "Conseil Décor Complète — 250 €", "Rapport Photos — 80 €").
- Bloc latéral sticky : prix "à partir de X €", CTA principal "Prendre rendez-vous", bouton message.
- Section "Profils similaires" en pied de page.
- **Priorité** : Must have.
- **Écart avec l'existant** : [TechnicianProfile.jsx](../../client/src/pages/TechnicianProfile.jsx) existe
  mais n'a probablement pas la grille tarifaire par prestation, le portfolio avant/après, ni les "profils
  similaires" — à comparer champ par champ lors du chiffrage.

### US-SEARCH-03 — Explorer le hub "Décoration d'intérieur"
**En tant qu'** acheteur, **je veux** une page dédiée à la décoration avec une grille de décoratrices et une
galerie d'inspirations classées par style (Rénovation Haussmannien, Chalet Alpin, Loft Industriel), **afin
de** m'inspirer avant de choisir une professionnelle.
- Recherche/filtre dédié (budget, style, région) au sommet de la page.
- Galerie d'inspirations avec tags de style, cliquable vers une expertise ou un profil.
- **Priorité** : Should have — dépend de la décision produit sur le vertical "décoration"
  (voir [00-overview.md](00-overview.md), persona "entièrement nouveau").
- **Écart avec l'existant** : aucun équivalent — persona et modèle de données à créer de zéro.

### US-SEARCH-04 — Page d'accueil avec mise en avant des deux services ✅ Implémentée (2026-08-29)
**En tant que** visiteur, **je veux** une page d'accueil présentant clairement les deux offres
("Contre-visite Technique" et "Décoration & Idées") et le déroulé en 4 étapes (Diagnostic → Comparaison →
Clé en main → Exécution), **afin de** comprendre l'offre avant de m'inscrire.
- Hero avec accroche + CTA "Réserver".
- Deux cartes services avec CTA dédié chacune.
- Frise de 4 étapes du parcours.
- **Priorité** : Must have (vitrine).
- **Écart avec l'existant** : aucune page d'accueil marketing dans `client/src/pages` actuellement — à
  créer.

**Implémentation** : [Home.jsx](../../client/src/pages/Home.jsx) en `/` (l'ancienne racine, qui pointait
vers [Search.jsx](../../client/src/pages/Search.jsx), reste disponible sur `/search`). Les CTA des deux
cartes renvoient vers la recherche pré-filtrée par catégorie (`/search?category=technique` ou
`?category=decoration`) plutôt que vers un tunnel dédié — `Search.jsx` lit désormais `?category=` au
montage pour pré-remplir le filtre et lancer la recherche.

## Priorisation suggérée
Must have : US-SEARCH-01, 02, 04. Should have : US-SEARCH-03 (conditionné à la décision produit sur la
déco).
