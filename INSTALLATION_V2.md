# StudySpace V2 — installation sous Windows

## Avant de changer GitHub (indispensable)

1. Dans StudySpace, ouvre **Sauvegarde → Exporter une sauvegarde**. Conserve le JSON.
2. Sauvegarde aussi une copie de ton dossier `Desktop/studyspace`.
3. Vérifie que ta synchronisation V1.2 fonctionne sur ton PC et ton téléphone. Ne remplace jamais tes cours par ceux d'un cloud vide sans sauvegarde.

## A — Publier les fichiers GitHub

1. Décompresse l'archive StudySpace V2.
2. Dans `C:\Users\...\Desktop\studyspace`, copie les fichiers de la V2 (`index.html`, `app.js`, `styles.css`, `cloud.js`, `ai.js`, `sw.js`, `manifest.webmanifest`, les dossiers `assets` et `docs`).
3. **Ne remplace pas ton `config.js` configuré.** Celui fourni est uniquement un modèle sans clés réelles. **Ne copie pas** le répertoire `supabase/` dans une autre partie de ton code ; tu peux le garder à la racine pour déployer la fonction. Le dossier caché `.git` doit rester en place.
4. Lance ces commandes dans le terminal VS Code, depuis le dossier GitHub `studyspace` :

```powershell
git status
git add .
git commit -m "StudySpace V2 - fiches PDF et assistant IA"
git push origin main
```

5. Vérifie l'adresse `https://miko-dev05.github.io/studyspace/` après le déploiement. Les matières et les notes continuent de fonctionner sans installer l'IA.

## B — Déployer l'IA (nécessaire pour le bouton « Générer avec l'IA »)

La V2 utilise une **Supabase Edge Function**. GitHub Pages seul ne peut pas appeler OpenAI en toute sécurité.

### Avec VS Code et le terminal PowerShell

1. Installe Node.js LTS s'il n'est pas installé ; vérifie `node --version` et `npx --version`.
2. Ouvre le dossier GitHub `studyspace` dans VS Code, en t'assurant que `supabase/functions/studyspace-ai/index.ts` et `supabase/config.toml` y sont présents.
3. Dans le terminal, lance :

```powershell
npx supabase login
npx supabase link --project-ref qdniukxbiddvoznxuwdd
npx supabase functions deploy studyspace-ai --no-verify-jwt
```

Si le projet Supabase est différent, remplace l'identifiant après `--project-ref` par celui qui apparaît dans l'URL de ton tableau de bord Supabase.

La fonction est déployée avec `--no-verify-jwt` uniquement parce qu'elle effectue **elle-même** une validation de la session Supabase sur chaque requête via `auth.getUser(token)` et refuse toute requête non authentifiée. Ne supprime pas cette validation.

4. Ouvre StudySpace → **Synchronisation**, connecte-toi au compte Supabase et clique sur **Relier cet appareil** si nécessaire.
5. Ouvre **Assistant IA**, saisis **ta clé API OpenAI personnelle** et une consigne. Choisis un chapitre, un document existant ou joins un fichier, puis **Générer avec l'IA**.
6. Relis la réponse avant d'utiliser **Sauvegarder la fiche**, **Télécharger PDF** ou **Enregistrer PDF dans le chapitre**.

### Si la fonction affiche une erreur

- `401` : reconnecte-toi à StudySpace ; vérifie que tu utilises le même projet Supabase dans `config.js`.
- `404` sur `/functions/v1/studyspace-ai` : la fonction n'est pas encore déployée, ou le projet est incorrect.
- `Invalid API key` : vérifie qu'il s'agit bien d'une **clé OpenAI `sk-...`** dans Assistant IA, pas de la clé Supabase `sb_publishable_...`.
- `429` : limite / budget de ton compte OpenAI atteint.
- Erreur de police : les symboles mathématiques très complexes et certains emoji peuvent mal s'afficher dans les PDF générés par jsPDF (police standard).

## Sécurité et coût

- Les clés `sb_publishable_` et les URL de projet Supabase sont publiques **par conception**. RLS doit rester activé pour les données et le stockage.
- **Ne mets jamais** une clé OpenAI `sk-...` dans `config.js`, GitHub, `localStorage`, une table publique ou un dépôt.
- La clé OpenAI est **uniquement gardée en mémoire pendant la page en cours** et transmise directement à la fonction sécurisée à chaque génération. Elle n'est pas sauvegardée sur les différents appareils : l'utilisateur la renseigne à nouveau après rechargement. Cette V2 ne propose pas encore le stockage chiffré permanent des clés.
- Les PDF et images soumis à l'IA sont transmis à OpenAI pour analyse seulement lorsque tu appuies sur « Générer avec l'IA ».
- L'API OpenAI **n'est pas comprise dans ChatGPT Plus** : les appels sont facturés selon les tarifs OpenAI et le modèle configuré dans la fonction (`gpt-6-luna`). GitHub Pages et les fonctionnalités locales restent gratuits ; l'offre Free de Supabase a des quotas.
- Ne partage pas des cours qui ne doivent pas être envoyés à un prestataire externe.

## Synchronisation et boutons

- Les matières et chapitres se créent dans une boîte de dialogue avec **Annuler / Enregistrer**, en bas de la boîte. « Annuler » ne touche pas à tes données ; « Enregistrer » déclenche une sauvegarde locale puis la synchronisation Supabase si elle est activée.
- Les notes existantes peuvent être modifiées depuis **Modifier** sur la ligne du document.
- Les créations de fiches et PDF IA sont enregistrées seulement si tu cliques sur **Sauvegarder**.
- Si tu es hors ligne, le cloud peut afficher « Modifications à envoyer ». Les deux appareils doivent ensuite retrouver Internet pour se mettre à jour. Si chacun modifie les cours en même temps, V1.2 affiche une alerte de conflit plutôt que d'écraser silencieusement les données.
- Les fichiers supprimés sont retirés des listes, mais V2 ne nettoie pas encore automatiquement les anciens blobs distants ; il peut rester des fichiers orphelins dans Supabase Storage.

## Vérification rapide

1. Crée une matière de test sur ton PC, clique sur **Enregistrer**.
2. Attends que **Synchronisation** affiche `Synchronisé`, puis ouvre StudySpace sur ton téléphone avec le **même compte** ; récupère les changements si nécessaire.
3. Écris une fiche manuellement dans **Assistant IA**, sans clé, puis clique sur **Sauvegarder la fiche** : une nouvelle note doit apparaître dans le chapitre choisi.
4. Clique sur **Télécharger PDF** et vérifie le fichier.
5. Pour l'IA : déploie la fonction, connecte-toi, saisis ta clé OpenAI personnelle, joins un petit document, puis lance une génération.

## Limites connues

- La génération OpenAI ne fonctionne pas tant que la fonction Supabase n'a pas été déployée et qu'une clé OpenAI avec facturation disponible n'a pas été saisie.
- Pas de chat avec historique conservé entre les sessions dans cette première V2 : elle génère une réponse par demande.
- Pas de sauvegarde chiffrée inter-appareils de la clé OpenAI (choix de sécurité).
- Conversion PDF locale depuis du texte : mise en page simple, pas encore de LaTeX mathématique ni d'images incorporées automatiquement.
- L'interface et le code ont été contrôlés statiquement, mais l'appel réel Supabase/OpenAI nécessite ton projet et ta clé pour un test de bout en bout.
