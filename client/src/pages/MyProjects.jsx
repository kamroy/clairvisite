import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { initials, formatDateTime } from "../lib/format";
import { flattenPages } from "../lib/pagination";
import { useMyBookings } from "../hooks/useBookings";

// Deux types de projet existent pour l'instant côté produit (contre-visite technique,
// consultation déco) ; le devis de travaux (US-BOOK-02) reste "Should have" et n'est
// pas construit. Le concept de "projet" transverse dégénère donc, pour cette tranche,
// à un simple enrichissement d'affichage au-dessus des réservations existantes — pas
// de nouvelle entité serveur, le type est dérivé de la catégorie du technicien.
function projectTypeLabel(booking) {
  return booking.technicianCategory === "decoration" ? "Consultation déco" : "Contre-visite technique";
}
const HISTORY_PREVIEW_SIZE = 3;

function isPast(booking) {
  return new Date(booking.slotStart).getTime() < Date.now();
}

function splitProjects(bookings) {
  const ongoing = [];
  const past = [];
  for (const b of bookings) {
    if (b.status === "confirmed" && !isPast(b)) ongoing.push(b);
    else past.push(b);
  }
  return { ongoing, past };
}

function ProgressBar() {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
      <div className="h-full w-1/2 rounded-full bg-amber" />
    </div>
  );
}

function OngoingProjectCard({ booking }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-4.5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{projectTypeLabel(booking)}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-line/40 text-xs font-semibold">
              {initials(booking.technicianFullName)}
            </span>
            <span className="text-sm font-semibold text-ink">{booking.technicianFullName}</span>
          </div>
        </div>
        <Badge variant="ok">RDV confirmé</Badge>
      </div>

      <p className="text-xs text-ink/70">📍 {booking.propertyAddress}</p>
      <p className="text-xs text-ink/70">🗓️ {formatDateTime(booking.slotStart)}</p>

      <div className="flex flex-col gap-1">
        <ProgressBar />
        <p className="text-[11px] text-muted">Réservation confirmée · visite à venir</p>
      </div>

      <div className="flex gap-2">
        <Link to={`/bookings/${booking.id}/confirmation`} className="flex-1">
          <Button variant="ghost">Voir les détails</Button>
        </Link>
        <a href={`mailto:${booking.technicianEmail}`} className="flex-1">
          <Button variant="ghost">Contacter l'expert</Button>
        </a>
      </div>
      {booking.technicianCategory !== "decoration" && (
        <Link to={`/bookings/${booking.id}/report`} className="text-center text-xs font-medium text-ink underline">
          Voir le rapport technique
        </Link>
      )}
    </div>
  );
}

function PastProjectRow({ booking }) {
  const isCancelled = booking.status === "cancelled";
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{booking.technicianFullName}</p>
        <p className="text-xs text-muted">{formatDateTime(booking.slotStart)}</p>
        {!isCancelled && booking.technicianCategory !== "decoration" && (
          <Link to={`/bookings/${booking.id}/report`} className="text-xs font-medium text-ink underline">
            Rapport
          </Link>
        )}
      </div>
      <Badge variant={isCancelled ? "neutral" : "ok"}>{isCancelled ? "Annulée" : "Terminée"}</Badge>
    </div>
  );
}

export default function MyProjects() {
  const bookingsQuery = useMyBookings();

  if (bookingsQuery.isLoading) return <Loading />;
  if (bookingsQuery.isError) return <ErrorMessage error={bookingsQuery.error} />;

  const bookings = flattenPages(bookingsQuery.data);
  const { ongoing, past } = splitProjects(bookings);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-serif text-xl font-semibold text-ink">Mes projets</h1>
        <Link to="/search">
          <Button>+ Nouveau projet</Button>
        </Link>
      </div>

      {ongoing.length > 0 && (
        <div className="mb-4 rounded-field border border-amber/30 bg-amber/10 px-3.5 py-2.5 text-sm text-ink">
          {ongoing.length} projet{ongoing.length > 1 ? "s" : ""} en cours
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_260px] sm:items-start">
        <div className="flex flex-col gap-3.5">
          {ongoing.map((b) => (
            <OngoingProjectCard key={b.id} booking={b} />
          ))}
          {ongoing.length === 0 && (
            <p className="rounded-card border border-line bg-white p-4.5 text-sm text-muted shadow-card">
              Aucun projet en cours. Lancez une recherche pour réserver votre première prestation.
            </p>
          )}
        </div>

        <div className="rounded-card border border-line bg-white p-4.5 shadow-card">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Projets passés</h2>
          <div className="divide-y divide-line">
            {past.slice(0, HISTORY_PREVIEW_SIZE).map((b) => (
              <PastProjectRow key={b.id} booking={b} />
            ))}
          </div>
          {past.length === 0 && <p className="py-2 text-xs text-muted">Aucun historique pour le moment.</p>}
          <Link to="/bookings" className="mt-2 inline-block text-xs font-medium text-ink underline">
            Voir tout l'historique
          </Link>
        </div>
      </div>
    </div>
  );
}
