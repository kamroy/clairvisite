import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "../components/Button";
import Field from "../components/Field";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import AddressAutocomplete from "../components/AddressAutocomplete";
import AddressMap from "../components/AddressMap";
import { formatSlotRange, parseCommaList } from "../lib/format";
import { FRENCH_PHONE_PATTERN, FRENCH_PHONE_TITLE, isValidFrenchPhone } from "../lib/validation";
import { useTechnician } from "../hooks/useTechnicians";
import { useCreateBooking } from "../hooks/useBookings";
import { useTouched } from "../hooks/useTouched";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
];

function stepsFor(isDeco) {
  return [
    { n: 1, label: isDeco ? "Détails du projet" : "Détails du bien" },
    { n: 2, label: "Créneau" },
    { n: 3, label: "Confirmation" },
  ];
}

function Stepper({ current, isDeco }) {
  const steps = stepsFor(isDeco);
  return (
    <ol className="mb-6 flex items-center gap-2">
      {steps.map((step, i) => (
        <li key={step.n} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold ${
              step.n <= current ? "bg-ink text-white" : "bg-line/50 text-muted"
            }`}
          >
            {step.n}
          </span>
          <span className={`hidden text-xs font-medium sm:block ${step.n === current ? "text-ink" : "text-muted"}`}>
            {step.label}
          </span>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

// Groupe les créneaux par jour et par demi-journée (matin < 12h, après-midi >= 12h)
// — matche l'agencement "matin/après-midi" du calendrier du prototype.
function groupSlotsByDay(slots) {
  const groups = new Map();
  for (const slot of slots) {
    const day = new Date(slot.startDatetime).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!groups.has(day)) groups.set(day, { morning: [], afternoon: [] });
    const bucket = new Date(slot.startDatetime).getHours() < 12 ? "morning" : "afternoon";
    groups.get(day)[bucket].push(slot);
  }
  return groups;
}

function RecapPanel({ technician, isDeco, propertyType, surface, addressLabel, selectedSlot }) {
  return (
    <div className="rounded-card border border-line bg-white p-4.5 shadow-card sm:sticky sm:top-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Récapitulatif</h2>

      <div className="mb-3 flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">{isDeco ? "Décoratrice" : "Expert"}</span>
        <span className="text-ink">{technician.fullName}</span>
      </div>

      <div className="mb-3 flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">{isDeco ? "Votre projet" : "Votre bien"}</span>
        {addressLabel ? (
          <>
            <span className="text-ink">{addressLabel}</span>
            <span className="text-xs text-ink/70">
              {PROPERTY_TYPES.find((p) => p.value === propertyType)?.label ?? "—"}
              {surface && ` · ${surface} m²`}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted">À sélectionner</span>
        )}
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">Date & heure</span>
        {selectedSlot ? (
          <span className="text-ink">{formatSlotRange(selectedSlot.startDatetime, selectedSlot.endDatetime)}</span>
        ) : (
          <span className="text-xs text-muted">À sélectionner</span>
        )}
      </div>
    </div>
  );
}

export default function BookingTunnel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const technicianQuery = useTechnician(id);
  const createBooking = useCreateBooking();
  const { onBlurField, isTouched } = useTouched();

  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState("apartment");
  const [surface, setSurface] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [addressCoords, setAddressCoords] = useState(null);
  const [roomsConcerned, setRoomsConcerned] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [buyerPhone, setBuyerPhone] = useState("");

  if (technicianQuery.isLoading) return <Loading />;
  if (technicianQuery.isError) return <ErrorMessage error={technicianQuery.error} />;
  const technician = technicianQuery.data;
  // US-BOOK-03 : même tunnel, étape 1 adaptée pour une consultation déco (pièces
  // concernées + description) plutôt que de dupliquer tout le tunnel (étapes 2/3
  // identiques dans les deux cas : créneau, récap, confirmation).
  const isDeco = technician.category === "decoration";

  const slotGroups = groupSlotsByDay(technician.availableSlots);
  const selectedSlot = technician.availableSlots.find((s) => s.id === selectedSlotId) ?? null;

  const canProceedStep1 = propertyType && surface !== "" && addressLabel.trim() !== "";
  const canProceedStep2 = selectedSlotId && buyerPhone && isValidFrenchPhone(buyerPhone);

  async function handleConfirm() {
    try {
      const booking = await createBooking.mutateAsync({
        availability_id: selectedSlotId,
        buyer_phone: buyerPhone,
        property_address: addressLabel,
        property_type: propertyType,
        surface_m2: surface === "" ? undefined : Number(surface),
        rooms_concerned: isDeco && roomsConcerned.trim() !== "" ? parseCommaList(roomsConcerned) : undefined,
        project_description: isDeco && projectDescription.trim() !== "" ? projectDescription.trim() : undefined,
      });
      navigate(`/bookings/${booking.id}/confirmation`, { state: { booking } });
    } catch {
      // 409 = créneau déjà réservé entre-temps, erreur exposée via createBooking.error
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to={`/technicians/${id}`} className="mb-4 inline-block text-xs font-medium text-muted underline">
        ← Retour au profil
      </Link>

      <Stepper current={step} isDeco={isDeco} />

      <div className="grid gap-4 sm:grid-cols-[1fr_280px] sm:items-start">
        <div className="rounded-card border border-line bg-white p-4.5 shadow-card">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h1 className="text-base font-semibold">
                {isDeco ? "Parlez-nous de votre projet déco" : "Parlez-nous de votre bien"}
              </h1>

              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPropertyType(t.value)}
                    className={`rounded-field border p-3 text-sm font-medium ${
                      propertyType === t.value ? "border-ink bg-ink/5 text-ink" : "border-line text-ink/70"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Field
                label="Surface estimée (m²)"
                type="number"
                min="1"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
              />

              <AddressAutocomplete
                label="Adresse du bien"
                value={addressLabel}
                onChange={setAddressLabel}
                onSelect={(s) => {
                  setAddressLabel(s.label);
                  setAddressCoords({ lat: s.lat, lon: s.lon });
                }}
              />
              {addressCoords && <AddressMap lat={addressCoords.lat} lon={addressCoords.lon} />}

              {isDeco && (
                <>
                  <Field
                    label="Pièces concernées (séparées par une virgule)"
                    placeholder="Salon, Cuisine"
                    value={roomsConcerned}
                    onChange={(e) => setRoomsConcerned(e.target.value)}
                  />
                  <Field
                    as="textarea"
                    label="Décrivez votre projet (style souhaité, budget, contraintes…)"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </>
              )}

              <Button disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Continuer
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h1 className="text-base font-semibold">Choisissez un créneau</h1>

              {[...slotGroups.entries()].map(([day, { morning, afternoon }]) => (
                <div key={day}>
                  <p className="mb-2 text-xs font-semibold capitalize text-muted">{day}</p>
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[...morning, ...afternoon].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`rounded-field border px-2.5 py-2 text-xs font-medium ${
                          selectedSlotId === slot.id ? "border-ink bg-ink text-white" : "border-line text-ink/70"
                        }`}
                      >
                        {formatSlotRange(slot.startDatetime, slot.endDatetime)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {technician.availableSlots.length === 0 && (
                <p className="text-sm text-muted">Aucun créneau disponible pour le moment.</p>
              )}

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

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button disabled={!canProceedStep2} onClick={() => setStep(3)}>
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h1 className="text-base font-semibold">Confirmez votre réservation</h1>

              <div className="flex flex-col gap-2 rounded-field border border-line bg-paper p-3.5 text-sm">
                <p>
                  <span className="font-medium">Bien :</span> {addressLabel} (
                  {PROPERTY_TYPES.find((t) => t.value === propertyType)?.label}, {surface} m²)
                </p>
                {isDeco && roomsConcerned.trim() !== "" && (
                  <p>
                    <span className="font-medium">Pièces concernées :</span> {roomsConcerned}
                  </p>
                )}
                {isDeco && projectDescription.trim() !== "" && (
                  <p>
                    <span className="font-medium">Projet :</span> {projectDescription}
                  </p>
                )}
                <p>
                  <span className="font-medium">{isDeco ? "Décoratrice" : "Expert"} :</span> {technician.fullName}
                </p>
                <p>
                  <span className="font-medium">Date :</span>{" "}
                  {selectedSlot && formatSlotRange(selectedSlot.startDatetime, selectedSlot.endDatetime)}
                </p>
                <p>
                  <span className="font-medium">Contact :</span> {buyerPhone}
                </p>
              </div>

              {createBooking.isError && <p className="text-sm text-red-600">{createBooking.error.message}</p>}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button disabled={createBooking.isPending} onClick={handleConfirm}>
                  {createBooking.isPending ? "Confirmation…" : "Confirmer la réservation"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <RecapPanel
          technician={technician}
          isDeco={isDeco}
          propertyType={propertyType}
          surface={surface}
          addressLabel={addressLabel}
          selectedSlot={selectedSlot}
        />
      </div>
    </div>
  );
}
