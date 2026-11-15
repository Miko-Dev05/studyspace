# StudySpace V2

Application web installable (PWA) de révision, sans framework.

## Nouveautés

- L'assistant IA prépare des fiches, des résumés, des quiz et des explications depuis des textes, PDF, images ou documents existants.
- Les résultats peuvent être modifiés, enregistrés comme notes, téléchargés en PDF ou ajoutés en PDF dans le chapitre.
- Les formulaires de création/modification contiennent **Annuler / Enregistrer** ; les sauvegardes sont synchronisées par Supabase quand le compte est connecté.
- Un nouveau Service Worker rafraîchit les scripts et la page HTML depuis le réseau quand il est disponible, tout en conservant l'accès hors ligne.

**Important :** l'API OpenAI est **payante à l'usage**, et la clé n'est conservée que temporairement en mémoire pour plus de sécurité. Pour l'activer, il faut déployer la fonction `supabase/functions/studyspace-ai/index.ts`.

Pour installer et déployer : **INSTALLATION_V2.md**.
