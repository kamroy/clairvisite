# 01 — Authentification & Comptes

**Écrans Stitch de référence** : S'enregistrer - Choix du profil, S'enregistrer - Validation du profil
(= écran "Dossier en cours d'examen"), Connexion, Déconnexion réussie, Inscription Expert - Soumission du
dossier (+ état "Validation des champs"), Administration - Validation des Experts, Administration -
Validation des Techniciens.

> Note de lecture : deux écrans du même flux ("Choix du profil" et "Validation du profil") portent des
> titres qui ne correspondent pas exactement à leur contenu réel dans l'export Stitch (vraisemblablement
> dû à des régénérations successives réutilisant le même identifiant). Les stories ci-dessous décrivent le
> contenu réellement observé, pas le titre brut.

## Personas

Acheteur, Expert (technique ou déco), Admin.

## Point ouvert : combien de profils professionnels ?

L'écran de choix de profil ne propose que deux cartes : **"Je suis un Acheteur"** et **"Je suis un
Technicien"** (décrit comme "architecte, maître d'œuvre ou artisan qualifié"). Mais le reste du prototype
distingue trois catégories métier dans la recherche (*Contre-visite Technique*, *Décoration d'intérieur*,
*Architecture & Rénovation*), et l'admin a deux écrans de validation séparés (*Experts* vs *Techniciens*).
**À trancher avant de spécifier le modèle de données** : un seul rôle "professionnel" avec un champ
spécialité, ou deux rôles distincts (expert déco / technicien bâtiment) avec des parcours d'inscription
différents ? Les stories ci-dessous supposent l'option la plus simple (un rôle professionnel + champ
spécialité), à confirmer.

## User stories

### US-AUTH-01 — Choisir son profil à l'inscription
**En tant que** visiteur, **je veux** choisir "Acheteur" ou "Professionnel" dès l'inscription, **afin de**
suivre un formulaire adapté à mon usage.
- Étant donné la page d'inscription, quand je sélectionne une carte de profil, alors je suis dirigé vers le
  formulaire correspondant (compte simple pour Acheteur, dossier multi-étapes pour Professionnel).
- Un lien "Déjà membre ? Se connecter" est visible en permanence.
- **Priorité** : Must have.
- **Écart avec l'existant** : [Signup.jsx](../../client/src/pages/Signup.jsx) et
  [register.use-case.ts](../../server/src/modules/auth/application/register.use-case.ts) créent déjà un
  compte avec un `role` (`acheteur`/`technicien`) — il manque l'écran de choix visuel et le fait de router
  vers deux formulaires différents selon le choix.

### US-AUTH-02 — Se connecter (email/mot de passe + Google)
**En tant qu'** utilisateur inscrit, **je veux** me connecter par email/mot de passe ou en un clic via
Google, **afin de** retrouver mon espace rapidement.
- Champ mot de passe masqué avec bouton "afficher".
- Lien "Oublié ?" vers un flux de réinitialisation de mot de passe.
- Bouton "Se connecter avec Google" (OAuth).
- **Priorité** : Must have.
- **Écart avec l'existant** : login email/mdp et callback OIDC Google existent déjà côté serveur
  ([login.use-case.ts](../../server/src/modules/auth/application/login.use-case.ts),
  [handle-oidc-callback.use-case.ts](../../server/src/modules/auth/application/handle-oidc-callback.use-case.ts)).
  **Manquant** : le flux "mot de passe oublié" n'a pas d'équivalent dans le code actuel (à vérifier) ; à
  spécifier séparément si absent.

### US-AUTH-03 — Se déconnecter avec confirmation visuelle
**En tant qu'** utilisateur connecté, **je veux** un écran de confirmation après déconnexion, **afin de**
être rassuré que ma session est bien fermée.
- **Priorité** : Should have (amélioration UX mineure, pas bloquant).

### US-AUTH-04 — Soumettre un dossier professionnel en plusieurs étapes
**En tant qu'** artisan/expert, **je veux** déposer ma candidature en 3 étapes (Identité → Expertise →
Documents), **afin de** rejoindre la plateforme en tant que professionnel vérifié.
- Étape 1 "Informations Professionnelles" : prénom, nom, raison sociale/nom d'entreprise, numéro SIRET
  (validation format 14 chiffres), email professionnel.
- Validation inline par champ avec message d'erreur explicite ("Ce champ est requis").
- Étape 2 "Expertise" (spécialités, régions d'intervention, tarifs) et étape 3 "Documents" (pièces
  justificatives, assurance RC Pro) — contenu à confirmer visuellement, non inspecté en détail.
- **Priorité** : Must have (aucun équivalent aujourd'hui).
- **Écart avec l'existant** : le schéma actuel a `Technician.specialties`, `regions`, `hourlyRate`,
  `status` ([schema.prisma](../../server/prisma/schema.prisma)) mais **pas de SIRET, pas d'upload de
  documents, pas de formulaire multi-étapes** côté [Signup.jsx](../../client/src/pages/Signup.jsx).

### US-AUTH-05 — Suivre le statut de son dossier professionnel
**En tant qu'** expert en attente de validation, **je veux** voir l'avancement de mon dossier (Candidature
soumise ✓ → Analyse du profil → Activation du compte), **afin de** savoir où j'en suis sans solliciter le
support.
- Conseils affichés pendant l'attente ("Photographies Haute Définition", "Description Détaillée") pour
  préparer son profil public.
- **Priorité** : Should have.
- **Écart avec l'existant** : `TechnicianStatus` existe déjà (`pending`/`approved`/`rejected`) mais aucun
  écran client n'expose cette progression aujourd'hui.

### US-AUTH-06 — Valider ou rejeter les dossiers professionnels (Admin)
**En tant qu'** admin, **je veux** deux vues de modération — une pour les "Experts" (déco/architecture) et
une pour les "Techniciens" (bâtiment) — avec recherche, filtre par statut et actions Valider/Rejeter, **afin
de** contrôler qui accède à la plateforme.
- **Priorité** : Must have.
- **Écart avec l'existant** : [Admin.jsx](../../client/src/pages/Admin.jsx) et le module
  [admin](../../server/src/modules/admin) gèrent une validation basique ; à vérifier si la distinction
  Experts/Techniciens doit être répliquée ou fusionnée selon la décision du "Point ouvert" ci-dessus.

## Priorisation suggérée
Must have : US-AUTH-01, 02, 04, 06. Should have : US-AUTH-03, 05.
