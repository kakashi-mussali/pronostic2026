# ⚽ Pronos Coupe du Monde 2026

Concours de pronostics pour vos équipes (Mondial 2026). App **Next.js 16** déployable sur **Vercel**, avec classement **partagé** (backend Upstash Redis) — vos collègues participent **sans aucun compte**.

## Fonctionnalités
- **Matchs de groupes** : pronostic du score des **72 rencontres** (12 groupes A–L), barème score exact / bon résultat.
- **Cartographie** : tableau final interactif des **16es de finale jusqu'au champion** — on choisit ses 32 qualifiés puis on fait avancer les équipes tour par tour.
- **Bonus** : meilleur buteur, révélation, total de buts (départage).
- Classement automatique avec podium 🥇🥈🥉 et détail des points (groupes / bracket / bonus).
- Espace **organisateur** protégé par code : saisie des vrais scores + vrai tableau, verrouillage des pronos, réinitialisation.
- Stockage partagé : tout le monde voit le même classement en temps réel, sans compte.

## Lancer en local
```bash
npm install
npm run dev
# http://localhost:3000
```
> Sans base Upstash, l'app tourne en mémoire (non partagé, non persistant) — pratique pour tester l'interface.

Pour tester le partage en local, créez un fichier `.env.local` :
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Déployer sur Vercel (≈ 5 min)
1. **Pousser le code sur GitHub** (nouveau dépôt, puis `git push`).
2. Sur **vercel.com** → *Add New… > Project* → importer le dépôt → **Deploy**.
3. **Ajouter la base Redis** : dans le projet Vercel → onglet **Storage** → *Create / Marketplace* → **Upstash (Redis)** → créer et connecter au projet. Vercel injecte automatiquement les variables d'environnement.
4. **Redéployer** (onglet *Deployments* → *Redeploy*) pour que l'app prenne en compte la base.
5. Partager l'URL `https://votre-projet.vercel.app` à vos équipes. 🎉

> L'app lit `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (ou les variantes `KV_REST_API_URL` / `KV_REST_API_TOKEN`). Les deux jeux fonctionnent.

## Utilisation
- **Organisateur** : onglet 🔧 → créer un code (1ère fois) → saisir les résultats au fil du tournoi.
- **Participants** : onglet ⚽ → remplir + valider. Re-valider avec le même prénom met à jour la grille.
- **Classement** : onglet 🏆 → liste des participants, puis classement dès qu'un résultat est saisi.

## Stack
- Next.js 16 (App Router) · React 19 · TypeScript
- Upstash Redis (`@upstash/redis`) via le Marketplace Vercel
- Routes API : `/api/state` (lecture), `/api/entry` (soumission), `/api/admin` (organisateur)

## Personnalisation rapide
- Équipes, drapeaux, stades, barème : `lib/data.ts`
- Logique de points : `lib/scoring.ts`
- Couleurs / thème : `app/globals.css` (variables `:root`)
