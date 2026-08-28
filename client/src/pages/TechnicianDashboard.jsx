import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
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
import { useMe } from "../hooks/useAuth";
import {
  useMyTechnicianProfile,
  useUpdateMyTechnicianProfile,
  useMyTechnicianDocuments,
  useUploadTechnicianDocument,
  useTechnicianPricingItems,
  useAddTechnicianPricingItem,
  useRemoveTechnicianPricingItem,
  useTechnicianPortfolio,
  useUploadTechnicianPortfolioItem,
  useRemoveTechnicianPortfolioItem,
} from "../hooks/useTechnicians";
import { useMyAvailabilities, useCreateAvailability, useDeleteAvailability } from "../hooks/useAvailabilities";
import { useTechnicianBookings } from "../hooks/useBookings";

function TabBar() {
  const tabClass = ({ isActive }) =>
    `flex-1 border-r border-line py-3 text-center text-[10px] font-medium uppercase last:border-r-0 ${
      isActive ? "text-ink" : "text-muted"
    }`;

  return (
    <nav className="mt-6 flex border-t border-line bg-white">
      <NavLink to="/technician/dashboard" className={tabClass} end>
        Tableau de bord
      </NavLink>
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

const CATEGORY_OPTIONS = [
  { value: "technique", label: "Contre-visite Technique" },
  { value: "decoration", label: "Décoration d'intérieur" },
  { value: "architecture", label: "Architecture & Rénovation" },
];

const emptyForm = {
  phone: "",
  specialties: "",
  regions: "",
  hourlyRate: "",
  bio: "",
  category: "technique",
  companyName: "",
  siret: "",
  yearsOfExperience: "",
};

function toFormState(profile) {
  return {
    phone: profile.phone ?? "",
    specialties: (profile.specialties ?? []).join(", "),
    regions: (profile.regions ?? []).join(", "),
    hourlyRate: profile.hourlyRate ?? "",
    bio: profile.bio ?? "",
    category: profile.category ?? "technique",
    companyName: profile.companyName ?? "",
    siret: profile.siret ?? "",
    yearsOfExperience: profile.yearsOfExperience ?? "",
  };
}

function DocumentsSection() {
  const documentsQuery = useMyTechnicianDocuments();
  const upload = useUploadTechnicianDocument();

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate(file);
  }

  return (
    <div className="flex flex-col gap-2 rounded-field border border-line bg-white p-3.5">
      <p className="text-xs font-semibold text-muted">Pièces justificatives</p>
      <p className="text-xs text-ink/70">
        Assurance RC Pro, pièce d'identité, diplômes... nécessaires à la validation de votre dossier.
      </p>

      {documentsQuery.isLoading && <Loading />}
      {(documentsQuery.data ?? []).map((doc) => (
        <a
          key={doc.id}
          href={doc.downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs font-medium text-ink underline"
        >
          {doc.fileName}
        </a>
      ))}
      {documentsQuery.data?.length === 0 && <p className="text-xs text-muted">Aucun document déposé.</p>}

      <label className="mt-1">
        <span className="sr-only">Déposer un document</span>
        <input type="file" onChange={handleFileChange} disabled={upload.isPending} className="text-xs" />
      </label>
      {upload.isPending && <p className="text-xs text-muted">Dépôt en cours…</p>}
      {upload.isError && <p className="text-xs text-red-600">{upload.error.message}</p>}
    </div>
  );
}

function PricingManagementSection({ technicianId }) {
  const itemsQuery = useTechnicianPricingItems(technicianId);
  const addItem = useAddTechnicianPricingItem();
  const removeItem = useRemoveTechnicianPricingItem();
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!label || price === "") return;
    addItem.mutate(
      { label, price: Number(price) },
      { onSuccess: () => { setLabel(""); setPrice(""); } },
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-field border border-line bg-white p-3.5">
      <p className="text-xs font-semibold text-muted">Grille tarifaire (visible publiquement)</p>

      {(itemsQuery.data ?? []).map((item) => (
        <div key={item.id} className="flex items-center justify-between text-xs">
          <span className="text-ink/80">
            {item.label} — {item.price} €
          </span>
          <button
            type="button"
            onClick={() => removeItem.mutate(item.id)}
            className="font-medium text-red-600 underline"
          >
            Retirer
          </button>
        </div>
      ))}

      <form onSubmit={handleAdd} className="mt-1 flex gap-2">
        <input
          placeholder="Prestation"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="min-w-0 flex-1 rounded-field border border-line px-2.5 py-1.5 text-xs"
        />
        <input
          type="number"
          min="0"
          placeholder="Prix €"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-20 rounded-field border border-line px-2.5 py-1.5 text-xs"
        />
        <button type="submit" disabled={addItem.isPending} className="rounded-field bg-ink px-3 py-1.5 text-xs font-medium text-white">
          Ajouter
        </button>
      </form>
      {addItem.isError && <p className="text-xs text-red-600">{addItem.error.message}</p>}
    </div>
  );
}

function PortfolioManagementSection({ technicianId }) {
  const itemsQuery = useTechnicianPortfolio(technicianId);
  const upload = useUploadTechnicianPortfolioItem();
  const removeItem = useRemoveTechnicianPortfolioItem();

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate({ file, caption: "" });
  }

  return (
    <div className="flex flex-col gap-2 rounded-field border border-line bg-white p-3.5">
      <p className="text-xs font-semibold text-muted">Réalisations (portfolio public)</p>

      <div className="grid grid-cols-3 gap-2">
        {(itemsQuery.data ?? []).map((item) => (
          <div key={item.id} className="relative">
            <img src={item.imageUrl} alt={item.caption ?? ""} className="aspect-square w-full rounded-field object-cover" />
            <button
              type="button"
              onClick={() => removeItem.mutate(item.id)}
              className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-[10px] font-medium text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <label className="mt-1">
        <span className="sr-only">Ajouter une photo</span>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={upload.isPending} className="text-xs" />
      </label>
      {upload.isPending && <p className="text-xs text-muted">Dépôt en cours…</p>}
      {upload.isError && <p className="text-xs text-red-600">{upload.error.message}</p>}
    </div>
  );
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
        category: form.category,
        companyName: form.companyName || undefined,
        siret: form.siret ? form.siret.replace(/\s/g, "") : undefined,
        yearsOfExperience: form.yearsOfExperience === "" ? undefined : Number(form.yearsOfExperience),
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
        as="select"
        label="Catégorie"
        value={form.category}
        onChange={update("category")}
        options={CATEGORY_OPTIONS}
      />
      <Field
        label="Raison sociale / Nom d'entreprise"
        value={form.companyName}
        onChange={update("companyName")}
      />
      <Field
        label="Numéro SIRET"
        placeholder="123 456 789 00012"
        value={form.siret}
        onChange={update("siret")}
      />
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
      <Field
        label="Années d'expérience"
        name="yearsOfExperience"
        type="number"
        min="0"
        max="80"
        value={form.yearsOfExperience}
        onChange={update("yearsOfExperience")}
      />
      <Field as="textarea" label="Bio courte" value={form.bio} onChange={update("bio")} />

      {updateProfile.isError && <p className="text-sm text-red-600">{updateProfile.error.message}</p>}
      {saved && <p className="text-sm text-sage">Profil enregistré.</p>}

      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Enregistrement…" : "Enregistrer le profil"}
      </Button>

      {/* Nécessite un profil déjà créé (la clé de stockage est dérivée de l'id
          technicien côté serveur) — masqué tant que le formulaire n'a jamais été soumis. */}
      {profileQuery.data && (
        <>
          <DocumentsSection />
          <PricingManagementSection technicianId={profileQuery.data.id} />
          <PortfolioManagementSection technicianId={profileQuery.data.id} />
        </>
      )}
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

const PROPERTY_TYPE_LABELS = { apartment: "Appartement", house: "Maison" };
const MONTH_TREND_SIZE = 6;
const DASHBOARD_PREVIEW_SIZE = 5;
const NEXT_DAYS_WINDOW = 7;

// Honoraires "générés" faute de module de facturation (Phase 2, cf. 04-paiement-et-signature.md) :
// on approxime 1h de visite = tarif horaire du technicien, sur les réservations déjà chargées
// (première page). C'est une estimation d'activité, pas un relevé financier réel.
function monthlyFeeTrend(bookings, hourlyRate) {
  const now = new Date();
  const months = [];
  for (let i = MONTH_TREND_SIZE - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("fr-FR", { month: "short" }), total: 0 });
  }
  for (const b of bookings) {
    const d = new Date(b.slotStart);
    const month = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (month) month.total += hourlyRate ?? 0;
  }
  return months;
}

function FeeTrendChart({ months }) {
  const max = Math.max(1, ...months.map((m) => m.total));
  return (
    <div className="flex h-10 items-end gap-1">
      {months.map((m) => (
        <div key={m.key} className="flex flex-1 flex-col items-center gap-1" title={`${m.label} : ${m.total} €`}>
          <div
            className="w-full rounded-sm bg-amber/70"
            style={{ height: `${Math.max(8, (m.total / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, footer }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border border-line bg-white p-3.5 shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="font-serif text-2xl font-semibold text-ink">{value}</p>
      {footer}
    </div>
  );
}

function DashboardTab() {
  const meQuery = useMe();
  const profileQuery = useMyTechnicianProfile();
  const bookingsQuery = useTechnicianBookings();

  if (meQuery.isLoading || profileQuery.isLoading || bookingsQuery.isLoading) return <Loading />;
  if (meQuery.isError) return <ErrorMessage error={meQuery.error} />;
  if (profileQuery.isError) return <ErrorMessage error={profileQuery.error} />;
  if (bookingsQuery.isError) return <ErrorMessage error={bookingsQuery.error} />;

  const firstName = meQuery.data.fullName?.split(" ")[0] ?? "";
  const hourlyRate = profileQuery.data?.hourlyRate ?? null;
  const bookings = flattenPages(bookingsQuery.data); // triées par date croissante, toutes confirmées

  const now = Date.now();
  const upcoming = bookings.filter((b) => new Date(b.slotStart).getTime() >= now);
  const upcomingSoon = upcoming.filter(
    (b) => new Date(b.slotStart).getTime() <= now + NEXT_DAYS_WINDOW * 24 * 60 * 60 * 1000,
  );
  const totalFees = bookings.reduce((sum, b) => sum + (hourlyRate ?? 0), 0);
  const months = monthlyFeeTrend(bookings, hourlyRate);

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="font-serif text-lg font-semibold text-ink">Bonjour, {firstName}.</h1>

      <div className="grid grid-cols-3 gap-2.5">
        <KpiCard label="Projets actifs" value={upcoming.length} />
        <KpiCard label={`Visites (${NEXT_DAYS_WINDOW}j)`} value={upcomingSoon.length} />
        <KpiCard
          label="Honoraires estimés"
          value={`${totalFees} €`}
          footer={<FeeTrendChart months={months} />}
        />
      </div>
      {hourlyRate == null && (
        <p className="text-[11px] text-muted">
          Renseignez votre tarif horaire dans l'onglet Profil pour affiner cette estimation.
        </p>
      )}

      <div className="flex gap-2">
        <Link to="/technician/availabilities" className="flex-1">
          <Button variant="ghost">Planifier une visite</Button>
        </Link>
        <Button variant="ghost" disabled className="flex-1 cursor-not-allowed opacity-50" title="Disponible en Phase 2">
          Rédiger un rapport
        </Button>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Dossiers en cours</h2>
          <Link to="/technician/bookings" className="text-xs font-medium text-ink underline">
            Voir tout
          </Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {upcoming.slice(0, DASHBOARD_PREVIEW_SIZE).map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-field border border-line bg-white p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{b.buyerFullName}</p>
                <p className="truncate text-xs text-muted">
                  {PROPERTY_TYPE_LABELS[b.propertyType] ?? "Contre-visite technique"} · {b.propertyAddress}
                </p>
              </div>
              <Badge variant="ok">RDV confirmé</Badge>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-sm text-muted">Aucun dossier en cours.</p>}
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-3.5 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Agenda expert</h2>
          <Link to="/technician/bookings" className="text-xs font-medium text-ink underline">
            Voir l'agenda complet
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-line">
          {upcoming.slice(0, DASHBOARD_PREVIEW_SIZE).map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">{formatDateTime(b.slotStart)}</span>
              <span className="text-xs text-muted">Contre-visite technique</span>
            </div>
          ))}
          {upcoming.length === 0 && <p className="py-1 text-xs text-muted">Aucun rendez-vous à venir.</p>}
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-3.5 shadow-card">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Ressources pro</h2>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/technician/profile" className="text-ink underline">
            Ma grille tarifaire
          </Link>
          <span className="text-muted">Assurance décennale — bientôt disponible</span>
          <span className="text-muted">Charte qualité — bientôt disponible</span>
        </div>
      </section>
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
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardTab />} />
        <Route path="profile" element={<ProfileTab />} />
        <Route path="availabilities" element={<AvailabilitiesTab />} />
        <Route path="bookings" element={<BookingsTab />} />
      </Routes>
      <TabBar />
    </div>
  );
}
