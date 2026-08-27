# Image de développement local (hot-reload via bind mount dans docker-compose.yml).
# Pas destinée au déploiement en production telle quelle (voir server/Dockerfile).
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Reste root ici, par exception — voir le commentaire équivalent dans server/Dockerfile
# (bind mount de ./client sur /app : un utilisateur non privilégié ne pourrait pas y
# écrire sans faire correspondre les UID hôte/conteneur).
EXPOSE 5173

CMD ["npm", "run", "dev"]
