import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import TechnicianCard from "../components/TechnicianCard";
import { initials } from "../lib/format";
import {
  useTechnician,
  useTechnicianPricingItems,
  useTechnicianPortfolio,
  useSimilarTechnicians,
} from "../hooks/useTechnicians";

const CATEGORY_LABELS = {
  technique: "Contre-visite Technique",
  decoration: "Décoration d'intérieur",
  architecture: "Architecture & Rénovation",
};

function PricingSection({ technicianId }) {
  const pricingQuery = useTechnicianPricingItems(technicianId);
  const items = pricingQuery.data ?? [];
  if (pricingQuery.isLoading || items.length === 0) return null;

  return (
    <section className="mb-4 rounded-card border border-line bg-white p-4.5 shadow-card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Grille tarifaire</h2>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-ink/80">{item.label}</span>
            <span className="font-semibold text-ink">{item.price} €</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PortfolioSection({ technicianId }) {
  const portfolioQuery = useTechnicianPortfolio(technicianId);
  const items = portfolioQuery.data ?? [];
  if (portfolioQuery.isLoading || items.length === 0) return null;

  return (
    <section className="mb-4 rounded-card border border-line bg-white p-4.5 shadow-card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Réalisations</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-field border border-line">
            <img src={item.imageUrl} alt={item.caption ?? ""} className="aspect-square w-full object-cover" />
            {item.caption && <figcaption className="px-2 py-1.5 text-[11px] text-muted">{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

function SimilarProfilesSection({ technicianId }) {
  const similarQuery = useSimilarTechnicians(technicianId);
  const items = similarQuery.data ?? [];
  if (similarQuery.isLoading || items.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Profils similaires</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((t) => (
          <TechnicianCard key={t.id} technician={t} />
        ))}
      </div>
    </section>
  );
}

// Le choix du créneau, de l'adresse et du type de bien se fait désormais dans le
// tunnel de réservation dédié (BookingTunnel.jsx, 3 étapes) — ce panneau n'est plus
// qu'un point d'entrée depuis le profil.
function BookingPanel({ technician }) {
  const slotsCount = technician.availableSlots.length;
  const isDeco = technician.category === "decoration";
  const ctaLabel = isDeco ? "Réserver une consultation" : "Prendre rendez-vous";

  return (
    <div className="rounded-card border border-line bg-white p-4.5 shadow-card sm:sticky sm:top-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{ctaLabel}</h2>

      <p className="mb-4 text-sm text-ink/70">
        {slotsCount > 0
          ? `${slotsCount} créneau${slotsCount > 1 ? "x" : ""} disponible${slotsCount > 1 ? "s" : ""}`
          : "Aucun créneau disponible pour le moment."}
      </p>

      {slotsCount > 0 ? (
        <Link to={`/technicians/${technician.id}/book`}>
          <Button>{ctaLabel}</Button>
        </Link>
      ) : (
        <Button disabled>{ctaLabel}</Button>
      )}
    </div>
  );
}

export default function TechnicianProfile() {
  const { id } = useParams();
  const technicianQuery = useTechnician(id);

  if (technicianQuery.isLoading) return <Loading />;
  if (technicianQuery.isError) return <ErrorMessage error={technicianQuery.error} />;
  const technician = technicianQuery.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_320px] sm:items-start">
        <div>
          <div className="mb-4 flex flex-col gap-3.5 rounded-card border border-line bg-white p-4.5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-line/40 text-sm font-semibold">
                {initials(technician.fullName)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {technician.fullName}
                  <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-sage text-[10px] text-white">
                    ✓
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {technician.specialties?.[0]} · {technician.regions?.[0]}
                  {technician.yearsOfExperience != null && ` · ${technician.yearsOfExperience} ans d'expérience`}
                </div>
              </div>
            </div>
            {technician.category && (
              <span className="w-fit rounded-field bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink">
                {CATEGORY_LABELS[technician.category] ?? technician.category}
              </span>
            )}
            {technician.bio && <p className="text-sm text-ink/70">{technician.bio}</p>}
          </div>

          <PricingSection technicianId={id} />
          <PortfolioSection technicianId={id} />
        </div>

        {/* Une seule instance : sur mobile la grille n'a qu'une colonne, donc ce bloc
            suit naturellement le contenu dans l'ordre du DOM (pas de sidebar sticky) ;
            sur sm:+ il occupe la 2e colonne définie par sm:grid-cols-[1fr_320px]. */}
        <BookingPanel technician={technician} />
      </div>

      <SimilarProfilesSection technicianId={id} />
    </div>
  );
}
