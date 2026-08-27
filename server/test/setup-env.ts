// Variables requises par ConfigService.getOrThrow(...) dans les modules bootés pendant
// les tests d'intégration. Aucune base de données ni service externe n'est réellement
// utilisé : chaque test override les repositories/ports qui en dépendraient.
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.API_BASE_URL = 'http://localhost:3000/api';
