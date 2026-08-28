import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Field from "../components/Field";
import { useForgotPassword } from "../hooks/useAuth";
import { isValidEmail } from "../lib/validation";

export default function ForgotPassword() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    forgotPassword.mutate(email);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 py-10">
      <div className="mb-2 text-center">
        <div className="font-serif text-lg font-semibold">Luxe & Structure</div>
        <p className="mt-2 text-sm text-ink/70">
          Indiquez votre email, nous vous envoyons un lien pour choisir un nouveau mot de passe.
        </p>
      </div>

      {forgotPassword.isSuccess ? (
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm text-ink/70">
            Si un compte existe avec <strong>{email}</strong>, un email contenant un lien de réinitialisation
            vient d'être envoyé.
          </p>
          <Link to="/login" className="text-xs font-medium text-ink underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field
            label="Email"
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={email !== "" && !isValidEmail(email)}
          />

          <Button type="submit" disabled={forgotPassword.isPending}>
            {forgotPassword.isPending ? "Envoi…" : "Envoyer le lien"}
          </Button>

          <Link to="/login" className="text-center text-xs font-medium text-muted underline">
            Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  );
}
