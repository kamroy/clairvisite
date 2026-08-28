import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import Field from "../components/Field";
import { useResetPassword } from "../hooks/useAuth";
import { PASSWORD_MIN_LENGTH, PASSWORD_PATTERN, PASSWORD_TITLE, isValidPassword } from "../lib/validation";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const canSubmit = isValidPassword(password) && passwordsMatch;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    resetPassword.mutate({ token, password });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 py-10">
      <div className="mb-2 text-center">
        <div className="font-serif text-lg font-semibold">Luxe & Structure</div>
        <p className="mt-2 text-sm text-ink/70">Choisissez votre nouveau mot de passe.</p>
      </div>

      {!token ? (
        <p className="text-center text-sm text-red-600">
          Ce lien de réinitialisation est invalide. Demandez-en un nouveau depuis la page{" "}
          <Link to="/forgot-password" className="underline">
            mot de passe oublié
          </Link>
          .
        </p>
      ) : resetPassword.isSuccess ? (
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm text-sage">Votre mot de passe a été mis à jour.</p>
          <Link to="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field
            label="Nouveau mot de passe"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            pattern={PASSWORD_PATTERN}
            title={PASSWORD_TITLE}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={password !== "" && !isValidPassword(password)}
            endSlot={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                className="text-xs font-medium text-muted hover:text-ink"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            }
          />
          <p className="-mt-2 text-xs text-muted">{PASSWORD_TITLE}</p>

          <Field
            label="Confirmez le mot de passe"
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            invalid={confirmPassword !== "" && !passwordsMatch}
          />

          {resetPassword.isError && <p className="text-sm text-red-600">{resetPassword.error.message}</p>}

          <Button type="submit" disabled={!canSubmit || resetPassword.isPending}>
            {resetPassword.isPending ? "Mise à jour…" : "Réinitialiser le mot de passe"}
          </Button>
        </form>
      )}
    </div>
  );
}
