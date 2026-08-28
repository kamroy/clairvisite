import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Button from "../components/Button";
import Field from "../components/Field";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { useLogin, useResendVerification } from "../hooks/useAuth";
import { useTouched } from "../hooks/useTouched";
import { isValidEmail } from "../lib/validation";

const HOME_BY_ROLE = { acheteur: "/projects", technicien: "/technician/dashboard", admin: "/admin" };

const ERROR_MESSAGES = {
  verification: "Ce lien de confirmation est invalide ou a expiré.",
  oidc_account_exists: "Un compte existe déjà avec cet email. Connectez-vous avec votre mot de passe.",
  oidc: "Une erreur est survenue avec la connexion Google.",
};

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useLogin();
  const resendVerification = useResendVerification();
  const { onBlurField, isTouched } = useTouched();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("verified") === "1") {
      queryClient
        .fetchQuery({ queryKey: queryKeys.me, queryFn: api.me })
        .then((me) => navigate(HOME_BY_ROLE[me?.role] ?? "/projects"));
      return;
    }

    const errorCode = params.get("error");
    if (errorCode) setError(ERROR_MESSAGES[errorCode] ?? "Une erreur est survenue.");
  }, [navigate, queryClient]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    try {
      const me = await login.mutateAsync(form);
      navigate(HOME_BY_ROLE[me?.role] ?? "/projects");
    } catch (err) {
      if (err.message === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(form.email);
      } else {
        setError(err.message);
      }
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 py-10">
      <div className="mb-2 text-center">
        <div className="font-serif text-lg font-semibold">Luxe & Structure</div>
        <p className="mt-2 text-sm text-ink/70">
          Connectez-vous pour réserver ou gérer votre agenda
        </p>
      </div>

      {/* Redirige vers GET /api/auth/google (flux Authorization Code + PKCE) */}
      <a
        href="/api/auth/google"
        className="flex items-center justify-center gap-2.5 rounded-field border border-line bg-white py-3 text-sm font-medium text-ink hover:bg-paper"
      >
        <span
          className="h-3.5 w-3.5 rounded-full"
          style={{
            background:
              "conic-gradient(#4285F4 0deg 90deg,#34A853 90deg 180deg,#FBBC05 180deg 270deg,#EA4335 270deg 360deg)",
          }}
        />
        Continuer avec Google
      </a>

      <div className="text-center text-xs text-muted">ou</div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          label="Mot de passe"
          type={showPassword ? "text" : "password"}
          name="password"
          required
          value={form.password}
          onChange={update("password")}
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
        <Link to="/forgot-password" className="-mt-2 self-end text-xs font-medium text-muted underline">
          Mot de passe oublié ?
        </Link>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {unverifiedEmail && (
          <div className="flex flex-col gap-2 rounded-field border border-line bg-paper p-3 text-sm">
            <p>Confirmez d'abord votre email avant de vous connecter.</p>
            <Button
              variant="ghost"
              type="button"
              onClick={() => resendVerification.mutate(unverifiedEmail)}
              disabled={resendVerification.isPending}
            >
              {resendVerification.isSuccess
                ? "Email renvoyé"
                : resendVerification.isPending
                  ? "Envoi…"
                  : "Renvoyer l'email"}
            </Button>
          </div>
        )}

        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <Button variant="ghost" type="button" onClick={() => navigate("/signup")}>
        Créer un compte
      </Button>
    </div>
  );
}
