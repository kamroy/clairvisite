// API Adresse (Base Adresse Nationale, data.gouv.fr) : autocomplétion d'adresses
// françaises, gratuite, sans clé, CORS ouvert — appelée directement depuis le
// navigateur. Documentation : https://adresse.data.gouv.fr/api-doc/adresse
const BAN_SEARCH_URL = "https://api-adresse.data.gouv.fr/search/";

export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];

  const res = await fetch(`${BAN_SEARCH_URL}?q=${encodeURIComponent(query)}&limit=5`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.features ?? []).map((feature) => ({
    label: feature.properties.label,
    lat: feature.geometry.coordinates[1],
    lon: feature.geometry.coordinates[0],
  }));
}
