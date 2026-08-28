import { Link, useNavigate } from "react-router-dom";
import { useMe, useLogout } from "../hooks/useAuth";
import { initials } from "../lib/format";

const HOME_BY_ROLE = { acheteur: "/projects", technicien: "/technician/dashboard", admin: "/admin" };

export default function Header() {
  const navigate = useNavigate();
  const meQuery = useMe();
  const logout = useLogout();
  const user = meQuery.data;

  async function handleLogout() {
    await logout.mutateAsync();
    navigate("/");
  }

  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
      <Link to={user ? (HOME_BY_ROLE[user.role] ?? "/search") : "/"} className="font-serif text-lg font-semibold text-ink">
        Luxe & Structure
      </Link>

      <div className="flex items-center gap-3">
        {meQuery.isLoading ? null : user ? (
          <>
            <Link to="/profile" className="flex items-center gap-2">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-line/40 text-xs font-semibold text-ink">
                {initials(user.fullName)}
              </span>
              <span className="text-sm font-medium text-ink">{user.fullName}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="text-xs font-medium text-muted underline hover:text-ink"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-ink hover:underline">
              Se connecter
            </Link>
            <Link
              to="/signup"
              className="rounded-field bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              Créer un compte
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
