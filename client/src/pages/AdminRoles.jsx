import { useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import Field from "../components/Field";
import {
  useAdminPermissionGroups,
  useAdminRoles,
  useAdminAdmins,
  useAdminAuditLog,
  useCreateAdminRole,
  useUpdateAdminRolePermissions,
  useCloneAdminRole,
  useDeleteAdminRole,
  useAssignAdminRole,
} from "../hooks/useAdminRoles";

const AUDIT_ACTION_LABELS = {
  "role.created": "Rôle créé",
  "role.permissions_updated": "Permissions modifiées",
  "role.cloned": "Rôle cloné",
  "role.deleted": "Rôle supprimé",
  "user.role_assigned": "Admin réassigné",
};

function RoleEditor({ role, permissionGroups }) {
  const [permissions, setPermissions] = useState(role.permissions);
  const updatePermissions = useUpdateAdminRolePermissions();
  const cloneRole = useCloneAdminRole();
  const deleteRole = useDeleteAdminRole();

  function toggle(key) {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  const dirty = JSON.stringify([...permissions].sort()) !== JSON.stringify([...role.permissions].sort());

  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-ink">
          {role.name} <span className="text-xs text-muted">({role.userCount} utilisateur{role.userCount > 1 ? "s" : ""})</span>
        </h3>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("Nom du rôle cloné :", `${role.name} (copie)`);
              if (name) cloneRole.mutate({ id: role.id, name });
            }}
            className="text-xs font-medium text-ink underline"
          >
            Cloner ce rôle
          </button>
          {!role.isSystem && role.userCount === 0 && (
            <button
              type="button"
              onClick={() => window.confirm(`Supprimer le rôle "${role.name}" ?`) && deleteRole.mutate(role.id)}
              className="text-xs font-medium text-red-600 underline"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {role.isSystem ? (
        <p className="text-xs text-muted">
          Rôle système : dispose de toutes les permissions et ne peut être ni modifié ni supprimé.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {permissionGroups.map((group) => (
              <div key={group.key}>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{group.label}</p>
                <div className="space-y-1.5">
                  {group.permissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.key)}
                        onChange={() => toggle(perm.key)}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={!dirty || updatePermissions.isPending}
            onClick={() => updatePermissions.mutate({ id: role.id, permissions })}
            className="mt-4 rounded-field bg-ink px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            Enregistrer les permissions
          </button>
        </>
      )}
    </div>
  );
}

function CreateRoleForm({ permissionGroups }) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const createRole = useCreateAdminRole();

  function toggle(key) {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function submit(e) {
    e.preventDefault();
    createRole.mutate(
      { name, permissions },
      { onSuccess: () => { setName(""); setPermissions([]); } },
    );
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-line bg-white p-4 shadow-card">
      <h3 className="mb-3 font-medium text-ink">Créer un rôle</h3>
      <Field
        placeholder="Ex. Support Agent"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {permissionGroups.map((group) => (
          <div key={group.key}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{group.label}</p>
            <div className="space-y-1.5">
              {group.permissions.map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={permissions.includes(perm.key)} onChange={() => toggle(perm.key)} />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {createRole.isError && <ErrorMessage error={createRole.error} />}
      <button
        type="submit"
        disabled={!name || createRole.isPending}
        className="mt-4 rounded-field bg-ink px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
      >
        Créer le rôle
      </button>
    </form>
  );
}

function AdminsTable({ admins, roles }) {
  const assignRole = useAssignAdminRole();

  return (
    <table className="w-full overflow-hidden rounded-card border border-line bg-white text-sm shadow-card">
      <thead>
        <tr className="bg-paper text-left text-[10px] uppercase tracking-wide text-muted">
          <th className="px-3.5 py-2.5">Nom</th>
          <th className="px-3.5 py-2.5">Email</th>
          <th className="px-3.5 py-2.5">Rôle</th>
        </tr>
      </thead>
      <tbody>
        {admins.map((admin) => (
          <tr key={admin.id} className="border-t border-line">
            <td className="px-3.5 py-3">{admin.fullName}</td>
            <td className="px-3.5 py-3">{admin.email}</td>
            <td className="px-3.5 py-3">
              <select
                value={admin.adminRoleId ?? ""}
                onChange={(e) => assignRole.mutate({ userId: admin.id, adminRoleId: e.target.value || null })}
                className="rounded-field border border-line px-2 py-1 text-xs"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.isSystem ? "" : r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AuditLog() {
  const auditLogQuery = useAdminAuditLog();
  if (auditLogQuery.isLoading) return <Loading />;
  if (auditLogQuery.isError) return <ErrorMessage error={auditLogQuery.error} />;

  const entries = auditLogQuery.data?.items ?? [];
  if (entries.length === 0) return <p className="text-sm text-muted">Aucune action journalisée.</p>;

  return (
    <ul className="space-y-2 text-sm">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-card border border-line bg-white p-3 shadow-card">
          <span className="font-medium text-ink">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
          <span className="text-muted"> — {entry.actorName}</span>
          <span className="ml-2 text-xs text-muted">{new Date(entry.createdAt).toLocaleString("fr-FR")}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminRoles() {
  const permissionGroupsQuery = useAdminPermissionGroups();
  const rolesQuery = useAdminRoles();
  const adminsQuery = useAdminAdmins();
  const [showAuditLog, setShowAuditLog] = useState(false);

  const loading = permissionGroupsQuery.isLoading || rolesQuery.isLoading || adminsQuery.isLoading;
  const error = permissionGroupsQuery.error ?? rolesQuery.error ?? adminsQuery.error;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Rôles & Permissions</h1>
        <div className="flex gap-4">
          <Link to="/admin" className="text-xs font-medium text-ink underline">
            Experts & Techniciens
          </Link>
          <button type="button" onClick={() => setShowAuditLog((s) => !s)} className="text-xs font-medium text-ink underline">
            Journal d'audit
          </button>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} />}

      {showAuditLog && (
        <div className="mb-6">
          <AuditLog />
        </div>
      )}

      {permissionGroupsQuery.data && rolesQuery.data && (
        <div className="space-y-4">
          {rolesQuery.data.map((role) => (
            <RoleEditor key={role.id} role={role} permissionGroups={permissionGroupsQuery.data} />
          ))}
          <CreateRoleForm permissionGroups={permissionGroupsQuery.data} />
        </div>
      )}

      {adminsQuery.data && rolesQuery.data && (
        <div className="mt-6">
          <h2 className="mb-2 font-serif text-lg font-semibold">Administrateurs</h2>
          <AdminsTable admins={adminsQuery.data} roles={rolesQuery.data} />
        </div>
      )}
    </div>
  );
}
