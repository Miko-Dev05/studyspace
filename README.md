# StudySpace V1.2 — design personnalisé + synchronisation

Cette version conserve le thème clair/sombre, le sélecteur d’icônes et le lecteur de documents agrandi des fichiers fournis.

## Installation
1. Exporte une sauvegarde depuis StudySpace sur ton PC.
2. Copie ton `config.js` déjà configuré (URL + clé publique) par-dessus le `config.js` fourni. **Ne partage pas de clé secrète.**
3. Copie les fichiers du dossier dans ton dépôt GitHub cloné, sans remplacer le dossier `.git`.
4. Vérifie `git status`, puis lance `git add .`, `git commit -m "StudySpace V1.2 synchronisation"` et `git push origin main`.
5. Ouvre GitHub Pages et le menu Synchronisation. Crée un compte ou connecte-toi, puis relie d’abord le PC (source des cours) et ensuite ton téléphone.

Le SQL nécessaire est fourni à titre de référence. Si tu l’as déjà exécuté avec succès, **ne le relance pas**.

Attention : l’archive contient un `config.js` d’exemple, sans clé réelle. Ne l’envoie pas tel quel : remplace-le par ta configuration publique.
