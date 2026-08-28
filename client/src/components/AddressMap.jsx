import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Le bundler (Vite) réécrit les URLs des images par défaut de Leaflet en chemins
// relatifs cassés si on ne les réimporte pas explicitement — correctif standard.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Carte en lecture seule (pas d'interaction) affichant juste un repère à l'adresse
// sélectionnée — fond de carte OpenStreetMap, gratuit et sans clé.
export default function AddressMap({ lat, lon }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView(
      [lat, lon],
      16,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
    markerRef.current = L.marker([lat, lon], { icon: defaultIcon }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([lat, lon], 16);
    markerRef.current?.setLatLng([lat, lon]);
  }, [lat, lon]);

  return <div ref={containerRef} className="h-48 w-full rounded-field" />;
}
