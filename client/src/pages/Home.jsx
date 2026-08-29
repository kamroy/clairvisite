import { Link } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";

const SERVICES = [
  {
    category: "technique",
    title: "Contre-visite Technique",
    description:
      "Un technicien indépendant inspecte l'électricité, la plomberie ou la structure d'un bien avant votre achat.",
    cta: "Réserver une contre-visite",
  },
  {
    category: "decoration",
    title: "Décoration & Idées",
    description:
      "Une décoratrice d'intérieur vous accompagne pour imaginer et chiffrer l'aménagement de votre futur logement.",
    cta: "Explorer la décoration",
  },
];

const STEPS = [
  { title: "Diagnostic", text: "Décrivez votre bien ou votre projet : nous identifions vos besoins." },
  { title: "Comparaison", text: "Comparez les profils disponibles : tarifs, spécialités, années d'expérience." },
  { title: "Clé en main", text: "Réservez un créneau et suivez votre dossier depuis Mes Projets." },
  { title: "Exécution", text: "L'expert intervient et vous transmet son avis ou ses recommandations." },
];

export default function Home() {
  return (
    <div>
      <Header />

      <div className="mx-auto max-w-3xl px-4 pb-12">
        <section className="mb-12 flex flex-col items-center gap-5 pt-6 text-center">
          <h1 className="max-w-lg font-serif text-3xl font-semibold leading-snug text-ink sm:text-4xl">
            Deux services, un seul interlocuteur de confiance
          </h1>
          <p className="max-w-md text-sm text-ink/70">
            Contre-visite technique avant un achat immobilier ou accompagnement en décoration d'intérieur :
            réservez un expert indépendant validé par notre équipe.
          </p>
          <Link to="/search" className="w-full max-w-xs">
            <Button>Réserver</Button>
          </Link>
        </section>

        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <div
              key={service.category}
              className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-card"
            >
              <h2 className="font-serif text-xl font-semibold text-ink">{service.title}</h2>
              <p className="flex-1 text-sm text-ink/70">{service.description}</p>
              <Link to={`/search?category=${service.category}`}>
                <Button variant="ghost">{service.cta}</Button>
              </Link>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-muted">
            Comment ça marche
          </h2>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-ink">{step.title}</span>
                <p className="text-xs text-ink/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="border-t border-line py-8 text-center">
        <div className="font-serif text-sm font-semibold text-ink">Luxe & Structure</div>
        <p className="mt-4 text-xs text-muted">© {new Date().getFullYear()} Luxe & Structure</p>
      </footer>
    </div>
  );
}
