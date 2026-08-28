import { useEffect, useRef, useState } from "react";
import { searchAddress } from "../lib/adresse";

// Champ texte avec suggestions d'adresses (API Adresse) — `onSelect` reçoit
// { label, lat, lon } quand l'utilisateur choisit une suggestion dans la liste.
export default function AddressAutocomplete({ label, value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(value);
      setSuggestions(results);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  function handleSelect(suggestion) {
    onSelect(suggestion);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <label className="block">
        {label && <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Ex. 14 Rue de Rivoli, 75004 Paris"
          className="w-full rounded-field border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/30"
        />
      </label>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-field border border-line bg-white shadow-card">
          {suggestions.map((s) => (
            <li key={`${s.lat}-${s.lon}`}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-paper"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
