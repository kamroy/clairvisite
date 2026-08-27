import { Link, useLocation, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { formatDateTime } from "../lib/format";
import { flattenPages } from "../lib/pagination";
import { useMyBookings } from "../hooks/useBookings";

export default function BookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  // Passée par TechnicianProfile.jsx juste après la création : évite un aller-retour
  // réseau et fonctionne même si la réservation n'est pas sur la première page
  // paginée de /bookings/me. Repli sur la liste seulement en cas d'accès direct
  // (rechargement de la page, lien partagé).
  const bookingFromNavigation = location.state?.booking;

  const bookingsQuery = useMyBookings({ enabled: !bookingFromNavigation });

  if (!bookingFromNavigation && bookingsQuery.isLoading) return <Loading />;
  if (!bookingFromNavigation && bookingsQuery.isError) return <ErrorMessage error={bookingsQuery.error} />;

  const booking = bookingFromNavigation ?? flattenPages(bookingsQuery.data).find((b) => b.id === id);

  return (
    <div className="mx-auto max-w-sm px-4 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-xl text-white">
        ✓
      </div>
      <h1 className="mb-4 text-base font-semibold text-sage">Réservation confirmée</h1>

      {booking && (
        <div className="mb-4 rounded-card border border-line bg-white p-4.5 text-left shadow-card">
          <div className="mb-2 text-[15px] font-semibold">{booking.technicianFullName}</div>
          <p className="mb-1 text-sm text-ink/70">{formatDateTime(booking.slotStart)}</p>
          <p className="mb-1 text-sm text-ink/70">📍 {booking.propertyAddress}</p>
          <p className="text-sm text-ink/70">
            {booking.technicianEmail} · {booking.technicianPhone}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-sage">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            Email de confirmation envoyé
          </div>
        </div>
      )}

      <Link
        to="/bookings"
        className="block rounded-full border border-line bg-white px-4 py-3 text-sm font-medium text-ink"
      >
        Voir mes réservations
      </Link>
    </div>
  );
}
