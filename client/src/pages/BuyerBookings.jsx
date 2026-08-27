import Badge from "../components/Badge";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import InfiniteScrollSentinel from "../components/InfiniteScrollSentinel";
import { initials, formatDateTime } from "../lib/format";
import { flattenPages } from "../lib/pagination";
import { useMyBookings, useCancelBooking } from "../hooks/useBookings";

export default function BuyerBookings() {
  const bookingsQuery = useMyBookings();
  const cancelBooking = useCancelBooking();

  if (bookingsQuery.isLoading) return <Loading />;
  if (bookingsQuery.isError) return <ErrorMessage error={bookingsQuery.error} />;
  const bookings = flattenPages(bookingsQuery.data);

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <div className="flex flex-col gap-4">
        {bookings.map((b) => (
          <div key={b.id} className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-4.5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-line/40 text-sm font-semibold">
                {initials(b.technicianFullName)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {b.technicianFullName}
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sage text-[10px] text-white">
                    ✓
                  </span>
                </div>
                <div className="text-xs text-muted">{formatDateTime(b.slotStart)}</div>
              </div>
            </div>
            <p className="text-xs text-ink/70">📍 {b.propertyAddress}</p>
            <div className="h-px bg-line" />
            <div className="flex items-center justify-between">
              <Badge variant="ok">Confirmée</Badge>
              <button
                onClick={() => cancelBooking.mutate(b.id)}
                disabled={cancelBooking.isPending}
                className="rounded-full border border-line bg-white px-4 py-2 text-xs font-medium text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="text-center text-sm text-muted">Aucune réservation à venir.</p>
        )}
        {bookingsQuery.hasNextPage && (
          <InfiniteScrollSentinel
            onIntersect={bookingsQuery.fetchNextPage}
            enabled={!bookingsQuery.isFetchingNextPage}
          />
        )}
        {bookingsQuery.isFetchingNextPage && <Loading label="Chargement de plus de réservations…" />}
      </div>
    </div>
  );
}
