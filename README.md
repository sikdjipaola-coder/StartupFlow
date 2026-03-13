# Backend pour StartupFlow

Instructions rapides pour lancer le backend localement.

Prérequis:
- Node.js 18+ et npm

Étapes:

1. Installer les dépendances

```bash
npm install
```

2. Copier les variables d'environnement

```bash
cp .env.example .env
# puis modifier .env si nécessaire
```

3. Générer et migrer la base de données Prisma (SQLite utilisé ici)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Démarrer en mode développement

```bash
npm run dev
```

Endpoints principaux (exemples):
- `POST /auth/register` - body: `{ name, email, password }`
- `POST /auth/login` - body: `{ email, password }`
- `GET /projects` - lister les projets
- `POST /projects` - créer un projet (token requis: `Authorization: Bearer <token>`)
- `POST /projects/:id/invest` - investir (token requis)

Notes:
- Le projet utilise SQLite pour simplifier le développement local. Pour production, changez `DATABASE_URL` et le provider Prisma.
- Le stockage des montants est en `Float` pour simplicité (adapter en `Decimal` pour précision financière).
