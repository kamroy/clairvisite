import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import Field from "../components/Field";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import InfiniteScrollSentinel from "../components/InfiniteScrollSentinel";
import { flattenPages } from "../lib/pagination";
import { useAdminTechnicians, useSetTechnicianStatus } from "../hooks/useAdmin";

const CATEGORY_LABELS = {
  technique: "Contre-visite Technique",
  decoration: "Décoration d'intérieur",
  architecture: "Architecture & Rénovation",
};

const STATUS_BADGE = {
  approved: { variant: "ok", label: "Validé" },
  pending: { variant: "pending", label: "En attente" },
  rejected: { variant: "neutral", label: "Rejeté" },
};

export default function Admin() {
  const [filters, setFilters] = useState({ category: "", status: "", search: "" });
  const techniciansQuery = useAdminTechnicians(filters);
  const setStatus = useSetTechnicianStatus();

  function updateFilter(field) {
    return (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Gestion des Experts & Techniciens</h1>
        <div className="flex gap-4">
          <Link to="/admin/roles" className="text-xs font-medium text-ink underline">
            Rôles & Permissions
          </Link>
          <Link to="/profile" className="text-xs font-medium text-ink underline">
            Mon profil
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Field
          placeholder="Rechercher par nom ou email…"
          value={filters.search}
          onChange={updateFilter("search")}
        />
        <Field
          as="select"
          value={filters.category}
          onChange={updateFilter("category")}
          options={[{ value: "", label: "Toutes les catégories" }, ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        <Field
          as="select"
          value={filters.status}
          onChange={updateFilter("status")}
          options={[
            { value: "", label: "Tous les statuts" },
            { value: "pending", label: "En attente" },
            { value: "approved", label: "Validé" },
            { value: "rejected", label: "Rejeté" },
          ]}
        />
      </div>

      {techniciansQuery.isLoading && <Loading />}
      {techniciansQuery.isError && <ErrorMessage error={techniciansQuery.error} />}

      {techniciansQuery.data && (
        <>
          <table className="w-full overflow-hidden rounded-card border border-line bg-white text-sm shadow-card">
            <thead>
              <tr className="bg-paper text-left text-[10px] uppercase tracking-wide text-muted">
                <th className="px-3.5 py-2.5">Nom</th>
                <th className="px-3.5 py-2.5">Email</th>
                <th className="px-3.5 py-2.5">Catégorie</th>
                <th className="px-3.5 py-2.5">Statut</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {flattenPages(techniciansQuery.data).map((t) => {
                const badge = STATUS_BADGE[t.status] ?? STATUS_BADGE.pending;
                return (
                  <tr key={t.id} className="border-t border-line">
                    <td className="px-3.5 py-3">{t.fullName}</td>
                    <td className="px-3.5 py-3">{t.email}</td>
                    <td className="px-3.5 py-3">{CATEGORY_LABELS[t.category] ?? t.category}</td>
                    <td className="px-3.5 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex gap-3">
                        {t.status !== "approved" && (
                          <button
                            onClick={() => setStatus.mutate({ id: t.id, status: "approved" })}
                            disabled={setStatus.isPending}
                            className="text-xs font-medium text-ink underline"
                          >
                            Valider
                          </button>
                        )}
                        {t.status !== "rejected" && (
                          <button
                            onClick={() => setStatus.mutate({ id: t.id, status: "rejected" })}
                            disabled={setStatus.isPending}
                            className="text-xs font-medium text-red-600 underline"
                          >
                            Rejeter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {flattenPages(techniciansQuery.data).length === 0 && (
            <p className="mt-4 text-center text-sm text-muted">Aucun résultat pour ces filtres.</p>
          )}
        </>
      )}

      {techniciansQuery.hasNextPage && (
        <InfiniteScrollSentinel
          onIntersect={techniciansQuery.fetchNextPage}
          enabled={!techniciansQuery.isFetchingNextPage}
        />
      )}
      {techniciansQuery.isFetchingNextPage && <Loading label="Chargement de plus de profils…" />}
    </div>
  );
}
