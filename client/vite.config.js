import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 0.0.0.0 : nécessaire pour que le port publié par Docker Compose atteigne le
    // serveur Vite à l'intérieur du conteneur (sinon il n'écoute que sur localhost,
    // injoignable depuis l'extérieur du network namespace du conteneur).
    host: true,
    watch: {
      // Le fs.watch natif épuise les file descriptors (EMFILE) sur un node_modules
      // monté en bind mount Docker — bascule en polling uniquement dans ce contexte
      // (CHOKIDAR_USEPOLLING défini dans docker-compose.yml), pour ne pas dégrader le
      // dev hors conteneur.
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
    },
    proxy: {
      // En dev, le client proxy les appels /api vers le serveur NestJS. Configurable
      // via API_PROXY_TARGET car "localhost" ne désigne pas la même chose depuis un
      // conteneur Docker (voir docker-compose.yml, où le service s'appelle "server").
      "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.js"],
  },
});
