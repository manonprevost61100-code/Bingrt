# Bingr — Lot 1 : base du projet

Ce lot pose les fondations : projet Next.js 14, schéma de base de données complet,
authentification Google, et intégration TMDB pour la recherche/import de séries,
films et animes.

## Contenu de ce lot

- `prisma/schema.prisma` — schéma complet (users, media, épisodes, statuts de
  visionnage, notes, badges, follows, activité)
- `src/lib/auth.ts` — configuration NextAuth v5 (Google OAuth, sessions en base)
- `src/lib/tmdb.ts` — client TMDB : recherche, détails film/série, épisodes par
  saison, prochaine diffusion. Distingue automatiquement les animes (genre
  Animation + origine japonaise)
- `src/app/api/media/search/route.ts` — endpoint de recherche (proxy sécurisé,
  la clé TMDB ne part jamais côté client)
- `tailwind.config.ts` — la palette et les polices des maquettes (fond quasi-noir,
  accents ambre/magenta/teal, Anton/Manrope/JetBrains Mono)

## Installation

```bash
npm install
cp .env.example .env
# renseigner DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, TMDB_API_KEY
npx prisma migrate dev --name init
npm run dev
```

### Obtenir une clé TMDB
Compte gratuit sur https://www.themoviedb.org/ → Paramètres → API → demander une
clé v3 (approbation quasi instantanée pour un usage personnel).

### Config Google OAuth
Console Google Cloud → Identifiants → Créer des identifiants OAuth → type
"Application Web" → URI de redirection autorisée :
`http://localhost:3000/api/auth/callback/google`

## Prochain lot

Une fois cette base validée et lancée en local (connexion Google OK, recherche
TMDB qui retourne des résultats), on enchaîne sur l'écran **Recherche + Fiche
média** (import TMDB → base locale, marquage des épisodes vus).
