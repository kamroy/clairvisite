import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import InfiniteScrollSentinel from "../components/InfiniteScrollSentinel";
import { flattenPages } from "../lib/pagination";
import { useAdminTechnicians, useSetTechnicianStatus } from "../hooks/useAdmin";

export default function Admin() {
  const techniciansQuery = useAdminTechnicians();
  const setStatus = useSetTechnicianStatus();

  if (techniciansQuery.isLoading) return <Loading />;
  if (techniciansQuery.isError) return <ErrorMessage error={techniciansQuery.error} />;
  const technicians = flattenPages(techniciansQuery.data);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Techniciens</h1>
        <Link to="/profile" className="text-xs font-medium text-ink underline">
          Mon profil
        </Link>
      </div>
      <table className="w-full overflow-hidden rounded-card border border-line bg-white text-sm shadow-card">
        <thead>
          <tr className="bg-paper text-left text-[10px] uppercase tracking-wide text-muted">
            <th className="px-3.5 py-2.5">Nom</th>
            <th className="px-3.5 py-2.5">Email</th>
            <th className="px-3.5 py-2.5">Spécialité</th>
            <th className="px-3.5 py-2.5">Statut</th>
            <th className="px-3.5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {technicians.map((t) => (
            <tr key={t.id} className="border-t border-line">
              <td className="px-3.5 py-3">{t.fullName}</td>
              <td className="px-3.5 py-3">{t.email}</td>
              <td className="px-3.5 py-3">{t.specialty}</td>
              <td className="px-3.5 py-3">
                <Badge variant={t.status === "approved" ? "ok" : "pending"}>
                  {t.status === "approved" ? "Approuvé" : "En attente"}
                </Badge>
              </td>
              <td className="px-3.5 py-3">
                {t.status !== "approved" && (
                  <button
                    onClick={() => setStatus.mutate({ id: t.id, status: "approved" })}
                    disabled={setStatus.isPending}
                    className="text-xs font-medium text-ink underline"
                  >
                    Valider
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {techniciansQuery.hasNextPage && (
        <InfiniteScrollSentinel
          onIntersect={techniciansQuery.fetchNextPage}
          enabled={!techniciansQuery.isFetchingNextPage}
        />
      )}
      {techniciansQuery.isFetchingNextPage && <Loading label="Chargement de plus de techniciens…" />}
    </div>
  );
}
