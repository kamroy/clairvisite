import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import Field from "../components/Field";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { initials, formatSlotRange } from "../lib/format";
import { FRENCH_PHONE_PATTERN, FRENCH_PHONE_TITLE, isValidFrenchPhone } from "../lib/validation";
import { useTechnician } from "../hooks/useTechnicians";
import { useCreateBooking } from "../hooks/useBookings";
import { useTouched } from "../hooks/useTouched";

export default function TechnicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const technicianQuery = useTechnician(id);
  const createBooking = useCreateBooking();
  const { onBlurField, isTouched } = useTouched();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  async function handleBooking() {
    if (!selectedSlot || !buyerPhone || !propertyAddress) return;
    try {
      const booking = await createBooking.mutateAsync({
        availability_id: selectedSlot,
        buyer_phone: buyerPhone,
        property_address: propertyAddress,
      });
      // La réponse de création contient déjà tous les détails nécessaires à l'écran
      // de confirmation : on les transmet via l'état de navigation pour éviter un
      // aller-retour réseau (et le cas limite où la réservation ne serait pas encore
      // sur la première page paginée de /bookings/me).
      navigate(`/bookings/${booking.id}/confirmation`, { state: { booking } });
    } catch {
      // 409 = créneau déjà réservé entre-temps, erreur exposée via createBooking.error
    }
  }

  if (technicianQuery.isLoading) return <Loading />;
  if (technicianQuery.isError) return <ErrorMessage error={technicianQuery.error} />;
  const technician = technicianQuery.data;

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <div className="mb-4 flex flex-col gap-3.5 rounded-card border border-line bg-white p-4.5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-line/40 text-sm font-semibold">
            {initials(technician.fullName)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[15px] font-semibold">
              {technician.fullName}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sage text-[10px] text-white">
                ✓
              </span>
            </div>
            <div className="text-xs text-muted">
              {technician.specialties?.[0]} · {technician.regions?.[0]}
            </div>
          </div>
        </div>
        {technician.bio && <p className="text-sm text-ink/70">{technician.bio}</p>}
      </div>

      <div className="mb-4 flex flex-col gap-2.5">
        {technician.availableSlots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => setSelectedSlot(slot.id)}
            className={`flex items-center justify-between rounded-field border bg-white px-3.5 py-3 text-sm ${
              selectedSlot === slot.id ? "border-ink" : "border-line"
            }`}
          >
            <span>{formatSlotRange(slot.startDatetime, slot.endDatetime)}</span>
            <span
              className={`h-4.5 w-4.5 rounded-full border-2 ${
                selectedSlot === slot.id ? "border-ink bg-ink" : "border-ink"
              }`}
            />
          </button>
        ))}
        {technician.availableSlots.length === 0 && (
          <p className="text-center text-sm text-muted">Aucun créneau disponible pour le moment.</p>
        )}
      </div>

      {selectedSlot && (
        <div className="mb-4 flex flex-col gap-3">
          <Field
            label="Votre téléphone"
            type="tel"
            pattern={FRENCH_PHONE_PATTERN}
            title={FRENCH_PHONE_TITLE}
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            onBlur={onBlurField("buyerPhone")}
            invalid={isTouched("buyerPhone") && buyerPhone !== "" && !isValidFrenchPhone(buyerPhone)}
            required
          />
          <Field
            label="Adresse du bien à visiter"
            type="text"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            required
          />
        </div>
      )}

      {createBooking.isError && <p className="mb-3 text-sm text-red-600">{createBooking.error.message}</p>}

      <Button
        disabled={!selectedSlot || !buyerPhone || !propertyAddress || createBooking.isPending}
        onClick={handleBooking}
      >
        {createBooking.isPending ? "Réservation…" : "Réserver ce créneau"}
      </Button>
    </div>
  );
}
