# 05 — Rapport technique

**Écrans Stitch de référence** : Rédaction du Rapport Technique - Luxe & Structure (vue expert),
Consultation du Rapport Technique - Vue Client.

## Personas

Expert technique (rédige), Acheteur (consulte).

## User stories

### US-REPORT-01 — Rédiger un rapport technique structuré par section
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

### US-REPORT-02 — Consulter un rapport technique synthétique
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

## Priorisation suggérée
Must have : US-REPORT-01 et US-REPORT-02 (à livrer ensemble — l'un sans l'autre n'a pas de valeur).
