import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import Button from "../components/Button";
import Field from "../components/Field";
import Badge from "../components/Badge";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { formatDateTime } from "../lib/format";
import { wrapSelection } from "../lib/richText";
import { flattenPages } from "../lib/pagination";
import { useTechnicianBookings } from "../hooks/useBookings";
import {
  useBookingReport,
  useUpdateReportConclusion,
  useUpdateReportSection,
  useSubmitReport,
  useUploadReportPhoto,
  useRemoveReportPhoto,
} from "../hooks/useReports";

const SECTION_LABELS = {
  introduction: "Introduction & Contexte",
  structure: "Analyse Structurelle",
  electricity: "Électricité",
  plumbing: "Plomberie",
  heating: "Chauffage",
};
const SECTION_ORDER = ["introduction", "structure", "electricity", "plumbing", "heating"];
const SYSTEM_SECTIONS = ["electricity", "plumbing", "heating"];
const STATUS_OPTIONS = [
  { value: "", label: "Non évalué" },
  { value: "good", label: "Bon" },
  { value: "medium", label: "Moyen" },
  { value: "critical", label: "Critique" },
];
const ROLE_OPTIONS = [
  { value: "", label: "Photo simple" },
  { value: "before", label: "Avant" },
  { value: "after", label: "Après" },
];

function toDraft(report) {
  const sections = {};
  for (const section of report.sections) {
    sections[section.sectionType] = { content: section.content ?? "", status: section.status ?? "" };
  }
  return { generalConclusion: report.generalConclusion ?? "", sections };
}

function RichTextField({ label, value, onChange }) {
  const textareaRef = useRef(null);

  function applyMarker(marker) {
    return () => {
      const textarea = textareaRef.current;
      const { next, cursor } = wrapSelection(textarea, marker);
      onChange(next);
      requestAnimationFrame(() => textarea.setSelectionRange(cursor, cursor));
    };
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <div className="mb-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={applyMarker("**")}
          className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-xs font-bold text-ink hover:bg-paper"
        >
          G
        </button>
        <button
          type="button"
          onClick={applyMarker("_")}
          className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-xs italic text-ink hover:bg-paper"
        >
          I
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] w-full rounded-field border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/30 focus:border-ink"
        placeholder="**gras**, _italique_ — mise en forme simple, pas de HTML."
      />
    </div>
  );
}

function SectionPhotos({ bookingId, sectionType, photos, disabled }) {
  const uploadPhoto = useUploadReportPhoto(bookingId);
  const removePhoto = useRemoveReportPhoto(bookingId);
  const [role, setRole] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadPhoto.mutate({ sectionType, file, role: role || null });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative">
            <img src={photo.downloadUrl} alt={photo.caption ?? ""} className="aspect-square w-full rounded-field object-cover" />
            {photo.role && (
              <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[9px] font-medium text-white">
                {photo.role === "before" ? "Avant" : "Après"}
              </span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => removePhoto.mutate(photo.id)}
                className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-[10px] font-medium text-red-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-field border border-line bg-white px-2 py-1.5 text-xs"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploadPhoto.isPending} className="text-xs" />
          {uploadPhoto.isPending && <span className="text-xs text-muted">Dépôt…</span>}
        </div>
      )}
    </div>
  );
}

export default function TechnicianReportEditor() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const bookingFromNavigation = location.state?.booking;
  const bookingsQuery = useTechnicianBookings({ enabled: !bookingFromNavigation });
  const booking = bookingFromNavigation ?? flattenPages(bookingsQuery.data).find((b) => b.id === bookingId);

  const reportQuery = useBookingReport(bookingId);
  const updateConclusion = useUpdateReportConclusion(bookingId);
  const updateSection = useUpdateReportSection(bookingId);
  const submitReport = useSubmitReport(bookingId);

  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (reportQuery.data) setDraft(toDraft(reportQuery.data));
  }, [reportQuery.data]);

  if (reportQuery.isLoading || !draft) return <Loading />;
  if (reportQuery.isError) return <ErrorMessage error={reportQuery.error} />;
  const report = reportQuery.data;
  const isSubmitted = report.status === "submitted";

  function updateSectionField(sectionType, field, value) {
    setDraft((d) => ({ ...d, sections: { ...d.sections, [sectionType]: { ...d.sections[sectionType], [field]: value } } }));
  }

  async function handleSaveDraft() {
    setSaved(false);
    await Promise.all([
      updateConclusion.mutateAsync(draft.generalConclusion),
      ...SECTION_ORDER.map((type) =>
        updateSection.mutateAsync({
          sectionType: type,
          content: draft.sections[type].content,
          status: draft.sections[type].status || null,
        }),
      ),
    ]);
    setSaved(true);
  }

  async function handleSubmit() {
    await handleSaveDraft();
    await submitReport.mutateAsync();
    navigate(`/technician/bookings`);
  }

  const isSaving = updateConclusion.isPending || updateSection.isPending;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/technician/bookings" className="text-xs font-medium text-muted underline">
          ← Retour aux réservations
        </Link>
        {isSubmitted && <Badge variant="ok">Rapport soumis</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_260px] sm:items-start">
        <div className="flex flex-col gap-4">
          <h1 className="font-serif text-xl font-semibold text-ink">Rapport technique</h1>

          {SECTION_ORDER.map((type) => (
            <div key={type} className="rounded-card border border-line bg-white p-4.5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">{SECTION_LABELS[type]}</h2>
                {SYSTEM_SECTIONS.includes(type) && !isSubmitted && (
                  <select
                    value={draft.sections[type].status}
                    onChange={(e) => updateSectionField(type, "status", e.target.value)}
                    className="rounded-field border border-line bg-white px-2 py-1.5 text-xs"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {SYSTEM_SECTIONS.includes(type) && isSubmitted && draft.sections[type].status && (
                  <Badge variant={draft.sections[type].status === "good" ? "ok" : draft.sections[type].status === "medium" ? "pending" : "danger"}>
                    {STATUS_OPTIONS.find((o) => o.value === draft.sections[type].status)?.label}
                  </Badge>
                )}
              </div>

              {isSubmitted ? (
                <p className="whitespace-pre-wrap text-sm text-ink/80">{draft.sections[type].content || "—"}</p>
              ) : (
                <RichTextField
                  label="Contenu"
                  value={draft.sections[type].content}
                  onChange={(value) => updateSectionField(type, "content", value)}
                />
              )}

              <div className="mt-3">
                <SectionPhotos
                  bookingId={bookingId}
                  sectionType={type}
                  photos={report.sections.find((s) => s.sectionType === type)?.photos ?? []}
                  disabled={isSubmitted}
                />
              </div>
            </div>
          ))}

          <div className="rounded-card border border-line bg-white p-4.5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-ink">Conclusion générale</h2>
            {isSubmitted ? (
              <p className="whitespace-pre-wrap text-sm text-ink/80">{draft.generalConclusion || "—"}</p>
            ) : (
              <RichTextField
                label="Conclusion"
                value={draft.generalConclusion}
                onChange={(value) => setDraft((d) => ({ ...d, generalConclusion: value }))}
              />
            )}
          </div>

          {!isSubmitted && (
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="ghost" onClick={() => window.print()} className="flex-1">
                Générer PDF
              </Button>
              <Button variant="ghost" disabled={isSaving} onClick={handleSaveDraft} className="flex-1">
                {isSaving ? "Enregistrement…" : "Enregistrer le brouillon"}
              </Button>
              <Button disabled={isSaving || submitReport.isPending} onClick={handleSubmit} className="flex-1">
                {submitReport.isPending ? "Envoi…" : "Soumettre le rapport"}
              </Button>
            </div>
          )}
          {isSubmitted && (
            <Button variant="ghost" onClick={() => window.print()} className="print:hidden">
              Générer PDF
            </Button>
          )}
          {saved && !isSubmitted && <p className="text-sm text-sage print:hidden">Brouillon enregistré.</p>}
          {(updateConclusion.isError || updateSection.isError || submitReport.isError) && (
            <p className="text-sm text-red-600 print:hidden">
              {(updateConclusion.error || updateSection.error || submitReport.error)?.message}
            </p>
          )}
        </div>

        <div className="rounded-card border border-line bg-white p-4.5 shadow-card sm:sticky sm:top-6 print:hidden">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Récapitulatif</h2>
          {booking ? (
            <div className="flex flex-col gap-2 text-sm">
              <div>
                <span className="block text-xs font-medium text-muted">Client</span>
                <span className="text-ink">{booking.buyerFullName}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-muted">Bien</span>
                <span className="text-ink">{booking.propertyAddress}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-muted">Date de visite</span>
                <span className="text-ink">{formatDateTime(booking.slotStart)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">Détails de la réservation indisponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
}
