import { useParams } from "react-router-dom";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { renderRichText } from "../lib/richText";
import { useBookingReport } from "../hooks/useReports";

const SECTION_LABELS = {
  introduction: "Introduction & Contexte",
  structure: "Analyse Structurelle",
  electricity: "Électricité",
  plumbing: "Plomberie",
  heating: "Chauffage",
};
const SYSTEM_SECTIONS = ["electricity", "plumbing", "heating"];
const STATUS_LABELS = { good: "Bon", medium: "Moyen", critical: "Critique" };
const STATUS_BADGE_VARIANT = { good: "ok", medium: "pending", critical: "danger" };

function RichText({ text }) {
  // eslint-disable-next-line react/no-danger -- renderRichText échappe tout HTML brut
  // avant d'interpréter **gras**/_italique_ (voir lib/richText.js) : jamais de HTML
  // arbitraire injecté ici.
  return <p className="whitespace-pre-wrap text-sm text-ink/80" dangerouslySetInnerHTML={{ __html: renderRichText(text) }} />;
}

function PhotoGrid({ photos }) {
  if (photos.length === 0) return null;
  const before = photos.filter((p) => p.role === "before");
  const after = photos.filter((p) => p.role === "after");
  const plain = photos.filter((p) => !p.role);

  return (
    <div className="mt-3 flex flex-col gap-3">
      {(before.length > 0 || after.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Avant</p>
            <div className="grid grid-cols-2 gap-1.5">
              {before.map((p) => (
                <img key={p.id} src={p.downloadUrl} alt={p.caption ?? ""} className="aspect-square w-full rounded-field object-cover" />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Après</p>
            <div className="grid grid-cols-2 gap-1.5">
              {after.map((p) => (
                <img key={p.id} src={p.downloadUrl} alt={p.caption ?? ""} className="aspect-square w-full rounded-field object-cover" />
              ))}
            </div>
          </div>
        </div>
      )}
      {plain.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {plain.map((p) => (
            <a key={p.id} href={p.downloadUrl} target="_blank" rel="noreferrer">
              <img src={p.downloadUrl} alt={p.caption ?? ""} className="aspect-square w-full rounded-field object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingReport() {
  const { bookingId } = useParams();
  const reportQuery = useBookingReport(bookingId);

  if (reportQuery.isLoading) return <Loading />;
  if (reportQuery.isError) return <ErrorMessage error={reportQuery.error} />;
  const report = reportQuery.data;

  const sectionByType = Object.fromEntries(report.sections.map((s) => [s.sectionType, s]));
  const attentionPoints = report.sections.filter((s) => s.status && s.status !== "good");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="font-serif text-xl font-semibold text-ink">Rapport technique</h1>
        <Button variant="ghost" onClick={() => window.print()} className="w-auto px-4">
          Imprimer / PDF
        </Button>
      </div>

      <div className="mb-4 rounded-card border border-amber/30 bg-amber/10 p-4.5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/70">Conclusion générale</h2>
        <RichText text={report.generalConclusion || "Aucune conclusion renseignée."} />
      </div>

      {attentionPoints.length > 0 && (
        <div className="mb-4 rounded-card border border-line bg-white p-4.5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Points d'attention prioritaires
          </h2>
          <div className="flex flex-col gap-2">
            {attentionPoints.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink">{SECTION_LABELS[s.sectionType]}</span>
                <Badge variant={STATUS_BADGE_VARIANT[s.status]}>{STATUS_LABELS[s.status]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 rounded-card border border-line bg-white p-4.5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Synthèse par système</h2>
        <div className="flex flex-col divide-y divide-line">
          {SYSTEM_SECTIONS.map((type) => (
            <div key={type} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">{SECTION_LABELS[type]}</span>
              {sectionByType[type]?.status ? (
                <Badge variant={STATUS_BADGE_VARIANT[sectionByType[type].status]}>
                  {STATUS_LABELS[sectionByType[type].status]}
                </Badge>
              ) : (
                <span className="text-xs text-muted">Non évalué</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {report.sections.map((section) => (
        <div key={section.id} className="mb-4 rounded-card border border-line bg-white p-4.5 shadow-card">
          <h2 className="mb-2 text-sm font-semibold text-ink">{SECTION_LABELS[section.sectionType]}</h2>
          <RichText text={section.content || "Non renseigné."} />
          <PhotoGrid photos={section.photos} />
        </div>
      ))}
    </div>
  );
}
