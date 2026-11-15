# StudySpace V1.1 — lecteur plein écran

StudySpace est une application web installable (PWA), gratuite et sans compte. Elle permet d'organiser des matières, chapitres et documents (PDF, images, texte et notes), de rechercher, d'ouvrir, de télécharger et de supprimer des documents.

## Nouveauté V1.1 : affichage en grand
- Ouvrir un document depuis un chapitre, puis cliquer sur **« ⛶ Agrandir la fiche »**.
- Le PDF occupe alors tout l’écran disponible, sur ordinateur comme sur téléphone.
- Cliquer sur **« ✕ Fermer le grand écran »**, ou utiliser Échap sur ordinateur, pour revenir.
- Le navigateur PDF permet généralement de zoomer sur le document.
- Les documents texte, notes et images profitent aussi du mode agrandi.

## Contenu inclus
- Matières : Mathématiques, Philosophie, Histoire-Géo, NSI.
- Chapitres de démarrage : « Le devoir peut-il être libérateur ? », « Dénombrement et combinaisons », « Récursivité ».
- PDF de philosophie déjà intégré dans le chapitre correspondant.
- Export et import de sauvegarde complète au format JSON.

## Tester sur un ordinateur
1. Décompresser le ZIP.
2. Ouvrir un terminal **dans le dossier StudySpace**.
3. Lancer `python -m http.server 8000` (ou `py -m http.server 8000` sur Windows).
4. Ouvrir http://localhost:8000 dans Chrome, Edge ou Firefox.

Pourquoi ne pas double-cliquer directement sur index.html ? Certaines fonctions (PDF intégré, PWA, service worker) nécessitent que l'application soit servie en HTTP(S).

## Utiliser sur ordinateur ET téléphone gratuitement
1. Créer un dépôt GitHub **public** (attention : le code et le PDF fourni seront publics avec GitHub Pages).
2. Envoyer **le contenu du dossier StudySpace** à la racine du dépôt (pas le dossier lui-même).
3. Dans Settings > Pages, choisir Deploy from a branch, branche `main`, dossier `/ (root)` ; enregistrer.
4. Ouvrir l'URL indiquée dans Pages depuis chaque appareil.
5. Depuis Chrome ou Edge sur PC : bouton « Installer l'app » ou menu du navigateur > Installer.
6. Sur Android : menu Chrome > Ajouter à l'écran d'accueil / Installer l'application. Sur iPhone : Safari > Partager > Sur l'écran d'accueil.

**IMPORTANT :** en V1, chaque appareil a son propre stockage. Il n'y a PAS de synchronisation automatique. Utiliser l'onglet « Sauvegarde » pour exporter sur un appareil, puis importer sur l'autre. Ne pas effacer les données du navigateur sans sauvegarde.

**Confidentialité :** les documents que vous ajoutez dans l'application restent dans le stockage de votre navigateur (IndexedDB), et ne sont pas envoyés vers GitHub. En revanche, les fichiers déjà fournis dans le dossier `docs/` sont des fichiers du site et deviennent publics lorsque le dépôt est public. Vous pouvez supprimer `docs/philosophie-devoir.pdf` et la référence de démarrage dans `app.js` si vous ne voulez pas publier cette fiche.

**Limites :** espace de stockage dépendant du navigateur/appareil. Import/export JSON en mémoire, à réserver à des volumes raisonnables de documents. Installer l'app ne permet pas la synchronisation. Les polices en ligne ne sont pas indispensables : l'app fonctionne avec les polices système hors connexion.

## Structure
- `index.html` : l'application
- `styles.css` : le design responsive
- `app.js` : logique, chapitres, notes, fichiers, sauvegarde
- `manifest.webmanifest` : installation PWA
- `sw.js` : cache pour utilisation hors connexion après première visite
- `assets/` : icônes
- `docs/` : fiche PDF de philosophie fournie
