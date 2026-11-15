# StudySpace V1.2 — synchronisation entre PC et téléphone

## Avant de commencer

1. Sur ton PC, ouvre l'ancienne version et va dans **Sauvegarde > Exporter** pour enregistrer tous tes cours. Garde le fichier .json en sécurité.
2. Crée gratuitement un projet sur https://supabase.com/dashboard (offre **Free**).
3. Dans le tableau de bord Supabase, ouvre **SQL Editor > New query**, colle tout le contenu de `supabase_setup.sql`, puis clique **Run**. La table et le bucket privés seront créés avec les protections RLS.
4. Va dans **Project Settings > API Keys** (ou **Connect / API Keys** selon la version). Copie l'URL du projet et la clé publique **publishable** (ou `anon`, si ton projet utilise l'ancien format). **Ne copie JAMAIS `service_role` ou `secret`.**
5. Ouvre `config.js` et remplace les deux valeurs `REMPLACER` par l'URL et la clé publique de ton propre projet.
6. Dans Supabase, ouvre **Authentication > URL Configuration** et mets comme **Site URL** : `https://miko-dev05.github.io/studyspace/` (adapte le nom si besoin). Ajoute aussi cette adresse dans **Redirect URLs**. Garde la confirmation e-mail activée si possible.
7. Dans ton dépôt GitHub `studyspace`, remplace les anciens fichiers par ceux de cette archive (garde `index.html` à la racine), y compris `config.js`, `cloud.js` et les fichiers `sql`/`md` (ces deux derniers sont seulement des instructions). Attends le déploiement de GitHub Pages puis actualise le site (au besoin ferme/réouvre l'app installée pour purger le cache).

## Première connexion

1. Sur ton **PC**, ouvre StudySpace > **Synchronisation**. Crée un compte avec ton e-mail et ton mot de passe. Confirme l'e-mail si Supabase le demande, puis connecte-toi.
2. Clique sur **Relier cet appareil**. Si le cloud est vide, l'app te proposera d'envoyer les cours déjà présents sur le PC.
3. Sur ton **téléphone**, ouvre le même site, va dans **Synchronisation** et connecte-toi avec **le même compte**. Clique sur **Relier cet appareil**, puis accepte de récupérer les cours depuis le cloud.
4. Les données sont ensuite envoyées automatiquement après chaque changement lorsque la connexion fonctionne. Au retour dans l'app sur le deuxième appareil, elle vérifie les nouveautés ; tu peux aussi cliquer sur **Récupérer depuis le cloud**.

## Conseils importants

- Les fichiers importés dans l'application sont privés grâce aux règles RLS (et au bucket non public), à condition de bien exécuter le SQL. Ton dépôt GitHub reste PUBLIC : **n'y mets pas de documents privés ni de mots de passe !**
- Le fichier `config.js` ne doit contenir QUE la clé publique `publishable/anon`, **jamais** la clé `service_role/secret`.
- Utilise un seul appareil à la fois pour modifier une même bibliothèque. Si les deux ont des changements contradictoires, la version cloud la plus récente bloque l'écrasement et les boutons de résolution permettent de choisir après sauvegarde. Ce n'est pas une fusion intelligente.
- En cas de déconnexion Internet, les changements restent sur l'appareil. Ne vide pas les données du navigateur avant leur synchronisation.
- Les fichiers supprimés dans l'interface disparaissent de la liste synchronisée mais leur ancien objet peut persister dans le bucket. Une future version pourra nettoyer les fichiers orphelins.
- Supabase Free comporte des limites (notamment stockage de fichiers de 1 Go par projet et 50 Mo maximum par fichier selon l'offre), et peut mettre le projet en pause après une semaine d'inactivité.
- La sauvegarde JSON reste importante : la synchronisation n'est PAS une sauvegarde avec historique de versions.
- Le PDF de démonstration inclus dans `docs/` est toujours public sur GitHub : ne publie pas d'autres fichiers personnels dans ce dossier. Ajoute-les depuis l'interface StudySpace après connexion.

## Fichiers de cette version

- `index.html` : interface de l'application et scripts.
- `app.js`, `styles.css`, `sw.js` : application existante.
- `config.js` : tes deux paramètres publics Supabase.
- `cloud.js` : connexion, synchronisation des matières / chapitres / notes et fichiers.
- `supabase_setup.sql` : création sécurisée de la base et du stockage.

**Attention :** il faut réellement configurer Supabase, son projet et GitHub Pages pour que la synchronisation fonctionne. La seule mise en ligne des fichiers ne suffit pas.
