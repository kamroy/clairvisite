import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Field from "../components/Field";
import Button from "../components/Button";
import TechnicianCard from "../components/TechnicianCard";
import InfiniteScrollSentinel from "../components/InfiniteScrollSentinel";
import Loading from "../components/Loading";
import { useRegions } from "../hooks/useRegions";
import { useSearchTechnicians } from "../hooks/useTechnicians";
import { flattenPages } from "../lib/pagination";

function HeroIllustration() {
  return (
    <svg viewBox="0 0 200 150" className="mx-auto h-auto w-48 sm:w-56" role="img" aria-label="Illustration d'une maison inspectée à la loupe">
      <path d="M28 78 L100 24 L172 78 V132 H28 Z" fill="#FFFFFF" stroke="#182A3D" strokeWidth="3" strokeLinejoin="round" />
      <rect x="86" y="94" width="28" height="38" fill="none" stroke="#182A3D" strokeWidth="3" />
      <rect x="45" y="90" width="20" height="20" fill="none" stroke="#182A3D" strokeWidth="2.5" />
      <rect x="135" y="90" width="20" height="20" fill="none" stroke="#182A3D" strokeWidth="2.5" />
      <circle cx="148" cy="58" r="24" fill="#F7F7F5" stroke="#5C7A6B" strokeWidth="4.5" />
      <line x1="165" y1="75" x2="184" y2="94" stroke="#5C7A6B" strokeWidth="6" strokeLinecap="round" />
      <path d="M138 58 L145 65 L159 49" fill="none" stroke="#5C7A6B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 flex-none" aria-hidden="true">
      <path
        d="M20 4 L34 10 V19 C34 28 28 34.5 20 37 C12 34.5 6 28 6 19 V10 Z"
        fill="rgba(92,122,107,0.1)"
        stroke="#5C7A6B"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M13 20 L18 25 L27 14" fill="none" stroke="#5C7A6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 flex-none" aria-hidden="true">
      <line x1="20" y1="6" x2="20" y2="30" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="32" y2="12" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 12 L4 22 A6 6 0 0 0 16 22 Z" fill="rgba(201,162,39,0.1)" stroke="#C9A227" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 12 L28 22 A6 6 0 0 0 40 22 Z" fill="rgba(201,162,39,0.1)" stroke="#C9A227" strokeWidth="2" strokeLinejoin="round" />
      <line x1="14" y1="34" x2="26" y2="34" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="20" y2="34" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 flex-none" aria-hidden="true">
      <circle cx="20" cy="16" r="11" fill="rgba(24,42,61,0.06)" stroke="#182A3D" strokeWidth="2" />
      <path d="M15 16 L18.5 19.5 L26 11" fill="none" stroke="#182A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 25 L11 36 L20 31 L29 36 L26 25" fill="rgba(24,42,61,0.06)" stroke="#182A3D" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function categoryIcon(color, children) {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7 flex-none" aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

const CATEGORIES = [
  {
    key: "électricité",
    label: "Électricité",
    Icon: () => categoryIcon("#C9A227", <path d="M22 5 12 21h7l-2 14L30 19h-7z" />),
  },
  {
    key: "plomberie",
    label: "Plomberie",
    Icon: () =>
      categoryIcon("#5C7A6B", (
        <>
          <path d="M10 14h14v8" />
          <circle cx="24" cy="27" r="3.2" fill="rgba(92,122,107,0.12)" />
        </>
      )),
  },
  {
    key: "structure",
    label: "Structure",
    Icon: () =>
      categoryIcon("#182A3D", (
        <>
          <path d="M7 20 20 9l13 11v11H7z" />
          <rect x="17" y="24" width="6" height="8" />
        </>
      )),
  },
  {
    key: "chauffage",
    label: "Chauffage",
    Icon: () =>
      categoryIcon("#C9A227", (
        <>
          <line x1="20" y1="7" x2="20" y2="24" />
          <circle cx="20" cy="29" r="5.5" fill="rgba(201,162,39,0.12)" />
        </>
      )),
  },
  {
    key: "toiture",
    label: "Toiture",
    Icon: () =>
      categoryIcon("#5C7A6B", (
        <>
          <path d="M6 21 20 9l14 12" />
          <line x1="11" y1="21" x2="29" y2="21" />
        </>
      )),
  },
  {
    key: "humidité",
    label: "Humidité",
    Icon: () =>
      categoryIcon("#182A3D", (
        <>
          <path d="M20 6c-6 9-10 14.5-10 19a10 10 0 0 0 20 0c0-4.5-4-10-10-19z" fill="rgba(24,42,61,0.06)" />
        </>
      )),
  },
  {
    key: "menuiserie",
    label: "Menuiserie",
    Icon: () =>
      categoryIcon("#C9A227", (
        <>
          <rect x="9" y="9" width="22" height="22" />
          <line x1="20" y1="9" x2="20" y2="31" />
          <line x1="9" y1="20" x2="31" y2="20" />
        </>
      )),
  },
  {
    key: "extérieur",
    label: "Extérieur",
    Icon: () =>
      categoryIcon("#5C7A6B", (
        <>
          <circle cx="20" cy="15" r="10" fill="rgba(92,122,107,0.1)" />
          <line x1="20" y1="24" x2="20" y2="33" />
        </>
      )),
  },
];

const REASONS = [
  {
    Icon: ShieldIcon,
    title: "Évitez les mauvaises surprises",
    text: "Un technicien indépendant vérifie l'électricité, la plomberie ou la structure avant que vous ne signiez.",
  },
  {
    Icon: ScaleIcon,
    title: "Négociez en connaissance de cause",
    text: "Un défaut identifié avant l'achat, c'est un argument de négociation — pas une facture après coup.",
  },
  {
    Icon: BadgeIcon,
    title: "Un avis indépendant et qualifié",
    text: "Nos techniciens sont validés manuellement avant d'apparaître dans les résultats de recherche.",
  },
];

const STEPS = [
  "Recherchez un technicien disponible près du bien à visiter",
  "Réservez un créneau qui correspond à votre date de visite",
  "Recevez son avis avant de vous engager",
];

const PROFILE_CATEGORIES = [
  { value: "", label: "Tous les profils" },
  { value: "technique", label: "Contre-visite Technique" },
  { value: "decoration", label: "Décoration d'intérieur" },
  { value: "architecture", label: "Architecture & Rénovation" },
];

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Toute expérience" },
  { value: "10", label: "Plus de 10 ans" },
  { value: "5", label: "5 à 10 ans" },
];

const SORT_OPTIONS = [
  { value: "", label: "Pertinence" },
  { value: "price_asc", label: "Tarif croissant" },
];

export default function Search() {
  const [region, setRegion] = useState("");
  const [date, setDate] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [sort, setSort] = useState("");
  const [searchParams, setSearchParams] = useState(null);
  const resultsRef = useRef(null);

  const regionsQuery = useRegions();
  const searchQuery = useSearchTechnicians(searchParams ?? {}, { enabled: searchParams !== null });

  function runSearch(params) {
    setSearchParams(params);
    resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  function currentParams(overrides = {}) {
    return { region, date, specialty, category, experience, sort, ...overrides };
  }

  function handleSearch(e) {
    e.preventDefault();
    runSearch(currentParams());
  }

  function handleCategoryClick(key) {
    const next = specialty === key ? "" : key;
    setSpecialty(next);
    runSearch(currentParams({ specialty: next }));
  }

  // Les filtres secondaires relancent la recherche immédiatement (pas besoin de
  // re-cliquer "Rechercher") — seuls région/date restent liés au bouton du hero,
  // car ils font partie du même petit formulaire visuel.
  function handleFilterChange(setter, field) {
    return (e) => {
      const value = e.target.value;
      setter(value);
      if (searchParams !== null) runSearch(currentParams({ [field]: value }));
    };
  }

  const technicians = flattenPages(searchQuery.data);

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-3xl px-4 pb-6">
        {/* Hero + recherche */}
        <section className="mb-10 flex flex-col items-center gap-5 text-center">
          <HeroIllustration />
          <h1 className="max-w-md text-2xl font-bold leading-snug sm:text-3xl">
            Achetez sereinement : faites une contre-visite du bien avant de signer
          </h1>
          <p className="max-w-md text-sm text-ink/70">
            Réservez en quelques clics un technicien indépendant (électricité, plomberie, structure) pour un avis
            professionnel avant votre achat immobilier.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-2 flex w-full max-w-md flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-card sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Field
                as="select"
                label="Département"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                options={[
                  { value: "", label: "Tous départements" },
                  ...(regionsQuery.data ?? []).map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </div>
            <div className="flex-1">
              <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button type="submit" className="sm:w-auto">
              Rechercher
            </Button>
          </form>
        </section>

        {/* Comment ça marche */}
        <section className="mb-10 rounded-card border border-line bg-white p-4.5 shadow-card sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Comment ça marche</h2>
          <ol className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            {STEPS.map((step, i) => (
              <li key={step} className="flex flex-1 items-start gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-ink/80">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Spécialités */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Recherchez par spécialité
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryClick(key)}
                className={`flex flex-col items-center gap-2 rounded-card border p-4 text-center shadow-card transition-colors ${
                  specialty === key ? "border-ink bg-ink/5" : "border-line bg-white hover:bg-paper"
                }`}
              >
                <Icon />
                <span className="text-xs font-medium text-ink">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Pourquoi */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {REASONS.map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col items-start gap-2.5 rounded-card border border-line bg-white p-4.5 shadow-card">
              <Icon />
              <div className="text-sm font-semibold">{title}</div>
              <p className="text-xs text-ink/70">{text}</p>
            </div>
          ))}
        </section>

        {/* Résultats */}
        <section ref={resultsRef} className="scroll-mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Techniciens disponibles
            </h2>
            {specialty && (
              <button
                type="button"
                onClick={() => handleCategoryClick(specialty)}
                className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink"
              >
                {CATEGORIES.find((c) => c.key === specialty)?.label ?? specialty}
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field
              as="select"
              label="Profil"
              value={category}
              onChange={handleFilterChange(setCategory, "category")}
              options={PROFILE_CATEGORIES}
            />
            <Field
              as="select"
              label="Expérience"
              value={experience}
              onChange={handleFilterChange(setExperience, "experience")}
              options={EXPERIENCE_OPTIONS}
            />
            <Field
              as="select"
              label="Trier par"
              value={sort}
              onChange={handleFilterChange(setSort, "sort")}
              options={SORT_OPTIONS}
            />
          </div>

          {searchQuery.isError && (
            <p className="mb-3 text-center text-sm text-red-600">{searchQuery.error.message}</p>
          )}
          {searchQuery.isLoading && <p className="text-center text-sm text-muted">Recherche en cours…</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {technicians.map((tech) => (
              <TechnicianCard key={tech.id} technician={tech} />
            ))}
          </div>
          {searchParams === null && (
            <p className="text-center text-sm text-muted">
              Lancez une recherche pour voir les techniciens disponibles.
            </p>
          )}
          {searchParams !== null && !searchQuery.isLoading && technicians.length === 0 && (
            <p className="text-center text-sm text-muted">Aucun technicien disponible pour ces critères.</p>
          )}
          {searchQuery.hasNextPage && (
            <InfiniteScrollSentinel
              onIntersect={searchQuery.fetchNextPage}
              enabled={!searchQuery.isFetchingNextPage}
            />
          )}
          {searchQuery.isFetchingNextPage && <Loading label="Chargement de plus de techniciens…" />}
        </section>

        {/* CTA technicien */}
        <section className="my-12 flex flex-col items-center gap-3 rounded-card border border-line bg-white p-6 text-center shadow-card">
          <h2 className="text-lg font-bold">Vous êtes technicien ?</h2>
          <p className="max-w-sm text-sm text-ink/70">
            Rejoignez Clairvisite pour recevoir des demandes de clairvisite près de chez vous et gérer votre
            agenda en toute autonomie.
          </p>
          <Link to="/signup?role=technicien" className="mt-1">
            <Button variant="ghost">Devenir technicien partenaire</Button>
          </Link>
        </section>
      </div>

      <footer className="border-t border-line py-8 text-center">
        <div className="text-sm font-bold text-ink">Clairvisite</div>
        <p className="mx-auto mt-2 max-w-xs text-xs text-muted">
          Des techniciens indépendants pour une clairvisite immobilière en toute confiance.
        </p>
        <p className="mt-4 text-xs text-muted">© {new Date().getFullYear()} Clairvisite</p>
      </footer>
    </div>
  );
}
