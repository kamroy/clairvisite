# 05 — Rapport technique

**Écrans Stitch de référence** : Rédaction du Rapport Technique - Luxe & Structure (vue expert),
Consultation du Rapport Technique - Vue Client.

## Personas

Expert technique (rédige), Acheteur (consulte).

## User stories

### US-REPORT-01 — Rédiger un rapport technique structuré par section ✅ Implémentée (2026-08-29)
**En tant qu'** expert technique, **je veux** rédiger mon rapport dans des sections prédéfinies
(Introduction & Contexte, Analyse Structurelle, Systèmes Techniques — Électricité, Plomberie...) avec un
éditeur de texte enrichi (gras/italique) et la possibilité d'ajouter des photos par section, **afin de**
produire un rapport homogène et illustré.
- Panneau latéral : récapitulatif du bien, informations de l'intervenant.
- Actions : "Générer PDF", "Enregistrer le brouillon", "Soumettre le rapport".
- Upload de photos intégré directement dans la section concernée (ex. photos avant/après dans "Analyse
  Structurelle").
- **Priorité** : Must have (cœur de la proposition de valeur "contre-visite technique").
- **Écart avec l'existant** : aucune notion de rapport dans le modèle actuel (`Booking` ne porte aucun
  contenu de compte-rendu — [schema.prisma](../../server/prisma/schema.prisma)). Nécessite un nouveau
  module `reports` avec structure de sections, upload de médias, état brouillon/soumis, génération PDF.

**Implémentation** : nouveau module `reports/` (1 `TechnicalReport` par `Booking`), 5 sections
prédéfinies auto-créées au premier accès (`introduction`, `structure`, `electricity`, `plumbing`,
`heating` — "Systèmes Techniques" éclaté en une section par système plutôt qu'une section unique, pour
que chacun porte son propre statut de gravité). Éditeur : [TechnicianReportEditor.jsx](../../client/src/pages/TechnicianReportEditor.jsx),
accessible depuis "Réservations" et le dashboard expert (lien "Rapport"/"Rédiger le rapport" par
réservation, absent pour les consultations déco). Un rapport soumis devient définitif (verrouillé en
écriture) — pas de correction post-soumission dans cette version.

**Simplifications assumées** :
- **Pas d'éditeur WYSIWYG** : "gras/italique" est du markdown minimal (`**gras**`, `_italique_`) saisi au
  clavier ou via deux boutons de la barre d'outils qui enveloppent la sélection — rendu ensuite via
  [lib/richText.js](../../client/src/lib/richText.js), qui échappe tout le texte avant d'interpréter ces
  deux motifs (jamais de `dangerouslySetInnerHTML` sur du HTML arbitraire). Évite une dépendance éditeur
  et le risque XSS associé.
- **"Générer PDF" = impression navigateur** (`window.print()` + CSS `print:`), pas de librairie PDF.

### US-REPORT-02 — Consulter un rapport technique synthétique ✅ Implémentée (2026-08-29)
**En tant qu'** acheteur, **je veux** consulter le rapport sous forme de synthèse lisible (conclusion
générale en encadré, points d'attention prioritaires listés par sévérité, comparateur de photos
avant/après, tableau de synthèse par système avec niveau Bon/Moyen/Critique, documents annexes
téléchargeables), **afin de** comprendre rapidement l'état du bien sans lire un rapport brut de 20 pages.
- Encadré "Conclusion Générale" en tête de page.
- Liste "Points d'Attention Prioritaires" avec niveau de gravité visuel.
- Slider de comparaison de photos avant/après.
- Tableau "Synthèse par Système" (Plomberie, Électricité, etc.) avec statut coloré.
- Liste de documents annexes téléchargeables.
- **Priorité** : Must have — sans cette vue, le rapport rédigé par l'expert (US-REPORT-01) n'a pas de
  consommateur côté client.
- **Écart avec l'existant** : aucun équivalent.

**Implémentation** : [BookingReport.jsx](../../client/src/pages/BookingReport.jsx), accessible depuis "Mes
Projets" (lien "Voir le rapport technique" / "Rapport"). Un brouillon n'est jamais exposé à l'acheteur
(traité comme "pas de rapport disponible").

**Simplifications assumées** :
- **Comparaison avant/après** : affichage côte à côte en deux colonnes (photos taguées "avant" à gauche,
  "après" à droite), pas de slider de comparaison interactif au glisser — évite un composant custom de
  gestion d'événements souris/tactile pour une valeur ajoutée marginale par rapport à un affichage côte à
  côte.
- **"Points d'Attention Prioritaires" et "Synthèse par Système"** ne sont pas des entités séparées :
  dérivés côté client des sections dont le statut n'est pas "good".
- **"Documents annexes téléchargeables"** = les photos elles-mêmes, chacune individuellement
  téléchargeable via son URL pré-signée — pas de type de document séparé.

## Priorisation suggérée
Must have : US-REPORT-01 et US-REPORT-02 (à livrer ensemble — l'un sans l'autre n'a pas de valeur).
