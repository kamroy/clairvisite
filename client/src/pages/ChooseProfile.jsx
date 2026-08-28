import { Link } from "react-router-dom";

const PROFILES = [
  {
    to: "/signup/acheteur",
    title: "Je suis un Acheteur",
    description: "Vous recherchez des biens d'exception, des artisans de confiance pour vos projets de rénovation haut de gamme.",
    cta: "Créer un compte Acheteur",
  },
  {
    to: "/signup/pro",
    title: "Je suis un Professionnel",
    description: "Vous êtes architecte, maître d'œuvre, technicien du bâtiment ou décorateur d'intérieur qualifié.",
    cta: "Créer un compte Pro",
  },
];

export default function ChooseProfile() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <div className="font-serif text-lg font-semibold">Luxe & Structure</div>
        <h1 className="mt-3 font-serif text-2xl font-semibold">Rejoignez Luxe & Structure</h1>
        <p className="mt-2 text-sm text-ink/70">
          Sélectionnez votre profil pour accéder à l'écosystème immobilier de prestige.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PROFILES.map((profile) => (
          <Link
            key={profile.to}
            to={profile.to}
            className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 text-center shadow-card transition-colors hover:border-ink/40"
          >
            <div className="text-base font-semibold">{profile.title}</div>
            <p className="flex-1 text-xs text-ink/70">{profile.description}</p>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink underline underline-offset-2">
              {profile.cta} →
            </span>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        Déjà membre ?{" "}
        <Link to="/login" className="font-medium text-ink underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
