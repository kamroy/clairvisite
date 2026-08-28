import { Link } from "react-router-dom";
import { initials } from "../lib/format";

const CATEGORY_LABELS = {
  technique: "Contre-visite Technique",
  decoration: "Décoration d'intérieur",
  architecture: "Architecture & Rénovation",
};

export default function TechnicianCard({ technician }) {
  const { id, fullName, specialties = [], regions = [], category, yearsOfExperience, hourlyRate, availableSlotsCount } =
    technician;

  return (
    <div className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-4.5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-line/40 text-sm font-semibold text-ink">
          {initials(fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px] font-semibold">
            {fullName}
            <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-sage text-[10px] text-white">
              ✓
            </span>
          </div>
          <div className="text-xs text-muted">
            {specialties[0]} · {regions[0]}
            {yearsOfExperience != null && ` · ${yearsOfExperience} ans d'expérience`}
          </div>
        </div>
        {hourlyRate != null && (
          <div className="text-right text-[15px] font-semibold text-ink">
            {hourlyRate}€
            <span className="block text-[10px] font-normal text-muted">indicatif</span>
          </div>
        )}
      </div>

      {category && (
        <span className="w-fit rounded-field bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink">
          {CATEGORY_LABELS[category] ?? category}
        </span>
      )}

      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((tag) => (
            <span key={tag} className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-ink/70">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="h-px bg-line" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-ink/70">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" />
          {availableSlotsCount} créneaux disponibles
        </div>
        <Link
          to={`/technicians/${id}`}
          className="rounded-field bg-ink px-4 py-2 text-xs font-medium text-white hover:bg-ink/90"
        >
          Voir le profil
        </Link>
      </div>
    </div>
  );
}
