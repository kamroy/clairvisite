import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Field from "../components/Field";
import { useRegister, useResendVerification } from "../hooks/useAuth";
import { useTouched } from "../hooks/useTouched";
import {
  FRENCH_PHONE_PATTERN,
  FRENCH_PHONE_TITLE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_TITLE,
  isValidEmail,
  isValidFrenchPhone,
  isValidPassword,
} from "../lib/validation";

export default function Signup({ role }) {
  const register = useRegister();
  const resendVerification = useResendVerification();
  const { onBlurField, isTouched } = useTouched();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [registeredEmail, setRegisteredEmail] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register.mutateAsync({ ...form, role, phone: form.phone || undefined });
      // Le compte n'est pas encore actif : il faut cliquer le lien reçu par email
      // avant de pouvoir se connecter (voir server/.../verify-email.use-case.ts).
      setRegisteredEmail(form.email);
    } catch {
      // erreur exposée via register.error ci-dessous
    }
  }

  if (registeredEmail) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 py-10 text-center">
        <div className="font-serif text-lg font-semibold">Luxe & Structure</div>
        <p className="text-sm text-ink/70">
          Un email de confirmation a été envoyé à <strong>{registeredEmail}</strong>. Cliquez sur le lien qu'il
          contient pour activer votre compte.
        </p>
        {role === "technicien" && (
          <p className="text-sm text-ink/70">
            Une fois connecté, complétez votre profil professionnel (spécialités, SIRET, documents) pour
            soumettre votre candidature à validation.
          </p>
        )}

        <Button
          variant="ghost"
          type="button"
          onClick={() => resendVerification.mutate(registeredEmail)}
          disabled={resendVerification.isPending}
        >
          {resendVerification.isSuccess
            ? "Email renvoyé"
            : resendVerification.isPending
              ? "Envoi…"
              : "Renvoyer l'email"}
        </Button>

        <Link to="/login" className="text-xs font-medium text-ink underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 py-10">
      <div className="mb-2 text-center">
        <div className="font-serif text-lg font-semibold">Luxe & Structure</div>
        <p className="mt-2 text-sm text-ink/70">
          {role === "technicien"
            ? "Soumettez votre candidature professionnelle"
            : "Créez votre compte avec un email et un mot de passe"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field
          label="Nom complet"
          type="text"
          name="fullName"
          required
          value={form.fullName}
          onChange={update("fullName")}
        />
        <Field
          label="Email"
          type="email"
          name="email"
          required
          value={form.email}
          onChange={update("email")}
          onBlur={onBlurField("email")}
          invalid={isTouched("email") && form.email !== "" && !isValidEmail(form.email)}
        />
        <Field
          label="Téléphone"
          type="tel"
          name="phone"
          placeholder="06 12 34 56 78"
          pattern={FRENCH_PHONE_PATTERN}
          title={FRENCH_PHONE_TITLE}
          value={form.phone}
          onChange={update("phone")}
          onBlur={onBlurField("phone")}
          invalid={isTouched("phone") && form.phone !== "" && !isValidFrenchPhone(form.phone)}
        />
        <Field
          label="Mot de passe"
          type="password"
          name="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          pattern={PASSWORD_PATTERN}
          title={PASSWORD_TITLE}
          value={form.password}
          onChange={update("password")}
          onBlur={onBlurField("password")}
          invalid={isTouched("password") && form.password !== "" && !isValidPassword(form.password)}
        />
        <p className="-mt-2 text-xs text-muted">{PASSWORD_TITLE}</p>

        {register.isError && <p className="text-sm text-red-600">{register.error.message}</p>}

        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-ink underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
