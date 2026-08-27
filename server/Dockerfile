# Image de développement local (hot-reload via bind mount dans docker-compose.yml).
# Pas destinée au déploiement en production telle quelle : pas de build "runtime" minimal
# séparé, puisque nest start --watch a justement besoin des devDependencies et du code
# source monté en direct.
FROM node:20-alpine

WORKDIR /app

# openssl : requis par le moteur de requêtes Prisma pour démarrer sur Alpine (musl
# libc) — sans ça, "Could not parse schema engine response" au runtime malgré une
# génération du client apparemment réussie au build.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

# Reste root ici, par exception : docker-compose.yml bind-monte ./server sur /app, donc
# ce dossier appartient à l'utilisateur hôte au runtime (le chown fait plus haut ne
# porte que sur la copie intégrée à l'image, écrasée par le mount). Un utilisateur
# non privilégié ne pourrait pas y écrire (dist/, .prisma) sans faire correspondre les
# UID hôte/conteneur — complexité qui n'a pas sa place dans une image de dev, dont le
# code est de toute façon celui du host. Non applicable telle quelle à une image de
# production sans bind mount (voir le commentaire en tête de fichier).
EXPOSE 3000

CMD ["npm", "run", "start:dev"]
