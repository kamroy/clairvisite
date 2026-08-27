import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Field from "../components/Field";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import InfiniteScrollSentinel from "../components/InfiniteScrollSentinel";
import { formatDateTime, formatSlotRange, parseCommaList } from "../lib/format";
import { flattenPages } from "../lib/pagination";
import { useTouched } from "../hooks/useTouched";
import { FRENCH_PHONE_PATTERN, FRENCH_PHONE_TITLE, isValidFrenchPhone } from "../lib/validation";
import { useMyTechnicianProfile, useUpdateMyTechnicianProfile } from "../hooks/useTechnicians";
import { useMyAvailabilities, useCreateAvailability, useDeleteAvailability } from "../hooks/useAvailabilities";
import { useTechnicianBookings } from "../hooks/useBookings";

function TabBar() {
  const tabClass = ({ isActive }) =>
    `flex-1 border-r border-line py-3 text-center text-[10px] font-medium uppercase last:border-r-0 ${
      isActive ? "text-ink" : "text-muted"
    }`;

  return (
    <nav className="mt-6 flex border-t border-line bg-white">
      <NavLink to="/technician/availabilities" className={tabClass}>
        Disponibilités
      </NavLink>
      <NavLink to="/technician/bookings" className={tabClass}>
        Réservations
      </NavLink>
      <NavLink to="/technician/profile" className={tabClass}>
        Profil
      </NavLink>
      <NavLink to="/profile" className={tabClass}>
        Mon compte
      </NavLink>
    </nav>
  );
}

const emptyForm = { phone: "", specialties: "", regions: "", hourlyRate: "", bio: "" };

function toFormState(profile) {
  return {
    phone: profile.phone ?? "",
    specialties: (profile.specialties ?? []).join(", "),
    regions: (profile.regions ?? []).join(", "),
    hourlyRate: profile.hourlyRate ?? "",
    bio: profile.bio ?? "",
  };
}

function ProfileTab() {
  const profileQuery = useMyTechnicianProfile();
  const updateProfile = useUpdateMyTechnicianProfile();
  const { onBlurField, isTouched } = useTouched();
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profileQuery.data) setForm(toFormState(profileQuery.data));
  }, [profileQuery.data]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    try {
      await updateProfile.mutateAsync({
        phone: form.phone,
        specialties: parseCommaList(form.specialties),
        regions: parseCommaList(form.regions),
        hourlyRate: form.hourlyRate === "" ? undefined : Number(form.hourlyRate),
        bio: form.bio || undefined,
      });
      setSaved(true);
    } catch {
      // erreur exposée via updateProfile.error ci-dessous
    }
  }

  if (profileQuery.isLoading) return <Loading />;
  if (profileQuery.isError) return <ErrorMessage error={profileQuery.error} />;

  const status = profileQuery.data?.status ?? null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 py-5">
      {status === "pending" && <Badge variant="pending">En attente de validation admin</Badge>}
      {status === "rejected" && <Badge variant="neutral">Profil non retenu par l'admin</Badge>}
      {status === "approved" && <Badge variant="ok">Profil validé</Badge>}

      <Field
        label="Téléphone de contact"
        type="tel"
        pattern={FRENCH_PHONE_PATTERN}
        title={FRENCH_PHONE_TITLE}
        value={form.phone}
        onChange={update("phone")}
        onBlur={onBlurField("phone")}
        invalid={isTouched("phone") && form.phone !== "" && !isValidFrenchPhone(form.phone)}
        required
      />
      <Field
        label="Spécialités (séparées par une virgule)"
        placeholder="électricité, plomberie"
        value={form.specialties}
        onChange={update("specialties")}
        required
      />
      <Field
        label="Départements d'intervention (séparés par une virgule)"
        placeholder="75 - Paris, 13 - Bouches-du-Rhône"
        value={form.regions}
        onChange={update("regions")}
        required
      />
      <Field label="Tarif indicatif (€/h)" name="hourlyRate" type="number" min="0" value={form.hourlyRate} onChange={update("hourlyRate")} />
      <Field as="textarea" label="Bio courte" value={form.bio} onChange={update("bio")} />

      {updateProfile.isError && <p className="text-sm text-red-600">{updateProfile.error.message}</p>}
      {saved && <p className="text-sm text-sage">Profil enregistré.</p>}

      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Enregistrement…" : "Enregistrer le profil"}
      </Button>
    </form>
  );
}

function AvailabilitiesTab() {
  const slotsQuery = useMyAvailabilities();
  const createAvailability = useCreateAvailability();
  const deleteAvailability = useDeleteAvailability();
  const [showForm, setShowForm] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!start || !end) return;
    try {
      await createAvailability.mutateAsync({
        startDatetime: new Date(start).toISOString(),
        endDatetime: new Date(end).toISOString(),
      });
      setStart("");
      setEnd("");
      setShowForm(false);
    } catch {
      // erreur exposée via createAvailability.error ci-dessous
    }
  }

  if (slotsQuery.isLoading) return <Loading />;
  if (slotsQuery.isError) return <ErrorMessage error={slotsQuery.error} />;
  const slots = slotsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3 px-4 py-5">
      {showForm ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-2.5 rounded-field border border-line bg-white p-3.5">
          <Field label="Début" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
          <Field label="Fin" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
          {createAvailability.isError && (
            <p className="text-xs text-red-600">{createAvailability.error.message}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={createAvailability.isPending}>
              {createAvailability.isPending ? "Ajout…" : "Ajouter"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" onClick={() => setShowForm(true)}>
          + Ajouter un créneau
        </Button>
      )}

      <p className="mt-1 text-xs font-semibold text-muted">Créneaux à venir</p>
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="flex items-center justify-between rounded-field border border-line bg-white px-3.5 py-3 text-sm"
        >
          <span>{formatSlotRange(slot.startDatetime, slot.endDatetime)}</span>
          <div className="flex items-center gap-2.5">
            <Badge variant={slot.isBooked ? "ok" : "neutral"}>{slot.isBooked ? "Réservé" : "Libre"}</Badge>
            {!slot.isBooked && (
              <button
                onClick={() => deleteAvailability.mutate(slot.id)}
                className="text-xs font-medium text-red-600 underline"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      ))}
      {slots.length === 0 && <p className="text-sm text-muted">Aucun créneau pour l'instant.</p>}
    </div>
  );
}

function BookingsTab() {
  const bookingsQuery = useTechnicianBookings();

  if (bookingsQuery.isLoading) return <Loading />;
  if (bookingsQuery.isError) return <ErrorMessage error={bookingsQuery.error} />;
  const bookings = flattenPages(bookingsQuery.data);

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {bookings.map((b) => (
        <div key={b.id} className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-4.5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-semibold">{b.buyerFullName}</div>
            <Badge variant="ok">Confirmée</Badge>
          </div>
          <p className="text-xs text-muted">{formatDateTime(b.slotStart)}</p>
          <p className="text-xs text-ink/70">📍 {b.propertyAddress}</p>
          <div className="h-px bg-line" />
          <p className="text-xs text-ink/70">{b.buyerPhone}</p>
        </div>
      ))}
      {bookings.length === 0 && <p className="text-sm text-muted">Aucune réservation à venir.</p>}
      {bookingsQuery.hasNextPage && (
        <InfiniteScrollSentinel
          onIntersect={bookingsQuery.fetchNextPage}
          enabled={!bookingsQuery.isFetchingNextPage}
        />
      )}
      {bookingsQuery.isFetchingNextPage && <Loading label="Chargement de plus de réservations…" />}
    </div>
  );
}

export default function TechnicianDashboard() {
  return (
    <div className="mx-auto min-h-screen max-w-sm bg-paper">
      <Routes>
        <Route path="profile" element={<ProfileTab />} />
        <Route path="availabilities" element={<AvailabilitiesTab />} />
        <Route path="bookings" element={<BookingsTab />} />
      </Routes>
      <TabBar />
    </div>
  );
}
