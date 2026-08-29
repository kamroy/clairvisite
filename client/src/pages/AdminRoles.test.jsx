import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import AdminRoles from "./AdminRoles";

vi.mock("../lib/api", () => ({
  api: {
    adminPermissionGroups: vi.fn(),
    adminRoles: vi.fn(),
    adminAdmins: vi.fn(),
    adminAuditLog: vi.fn(),
    createAdminRole: vi.fn(),
    updateAdminRolePermissions: vi.fn(),
    cloneAdminRole: vi.fn(),
    deleteAdminRole: vi.fn(),
    assignAdminRole: vi.fn(),
  },
}));

const PERMISSION_GROUPS = [
  {
    key: "support",
    label: "Support",
    permissions: [
      { key: "support:view", label: "Consulter les tickets support" },
      { key: "support:manage", label: "Traiter et clôturer les tickets" },
    ],
  },
];

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AdminRoles />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.adminPermissionGroups.mockResolvedValue(PERMISSION_GROUPS);
  api.adminAdmins.mockResolvedValue([
    { id: "admin-1", email: "admin1@example.com", fullName: "Admin One", adminRoleId: null, adminRoleName: "Super Admin" },
  ]);
});

describe("AdminRoles — gestion des rôles admin (US-ADMIN-01)", () => {
  it("affiche le rôle Super Admin comme rôle système, non modifiable", async () => {
    api.adminRoles.mockResolvedValue([
      { id: "role-1", name: "Super Admin", permissions: ["support:view", "support:manage"], isSystem: true, userCount: 1 },
    ]);

    renderPage();

    expect(await screen.findByRole("heading", { level: 3, name: /Super Admin/ })).toBeInTheDocument();
    expect(screen.getByText(/ne peut être ni modifié ni supprimé/)).toBeInTheDocument();
  });

  it("crée un rôle avec les permissions cochées", async () => {
    api.adminRoles.mockResolvedValue([
      { id: "role-1", name: "Super Admin", permissions: [], isSystem: true, userCount: 1 },
    ]);
    api.createAdminRole.mockResolvedValue({ id: "role-2" });

    renderPage();

    await screen.findByText("Créer un rôle");
    fireEvent.change(screen.getByPlaceholderText("Ex. Support Agent"), { target: { value: "Support Agent" } });
    fireEvent.click(screen.getByLabelText("Consulter les tickets support"));
    fireEvent.click(screen.getByRole("button", { name: "Créer le rôle" }));

    await waitFor(() =>
      expect(api.createAdminRole).toHaveBeenCalledWith("Support Agent", ["support:view"]),
    );
  });

  it("permet de modifier les permissions d'un rôle non-système", async () => {
    api.adminRoles.mockResolvedValue([
      { id: "role-2", name: "Support Agent", permissions: ["support:view"], isSystem: false, userCount: 0 },
    ]);
    api.updateAdminRolePermissions.mockResolvedValue({ id: "role-2" });

    renderPage();

    await screen.findByRole("heading", { level: 3, name: /Support Agent/ });
    // Le même libellé de permission apparaît aussi dans le formulaire "Créer un rôle" :
    // l'éditeur du rôle existant est toujours rendu en premier dans le DOM.
    fireEvent.click(screen.getAllByLabelText("Traiter et clôturer les tickets")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer les permissions" }));

    await waitFor(() =>
      expect(api.updateAdminRolePermissions).toHaveBeenCalledWith("role-2", ["support:view", "support:manage"]),
    );
  });

  it("propose de supprimer un rôle non-système sans utilisateur assigné", async () => {
    api.adminRoles.mockResolvedValue([
      { id: "role-2", name: "Support Agent", permissions: ["support:view"], isSystem: false, userCount: 0 },
    ]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.deleteAdminRole.mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(await screen.findByText("Supprimer"));

    await waitFor(() => expect(api.deleteAdminRole).toHaveBeenCalledWith("role-2"));
  });

  it("ne propose pas de suppression pour un rôle encore assigné à un administrateur", async () => {
    api.adminRoles.mockResolvedValue([
      { id: "role-2", name: "Support Agent", permissions: ["support:view"], isSystem: false, userCount: 1 },
    ]);

    renderPage();

    await screen.findByRole("heading", { level: 3, name: /Support Agent/ });
    expect(screen.queryByText("Supprimer")).not.toBeInTheDocument();
  });

  it("réassigne un administrateur à un autre rôle", async () => {
    api.adminRoles.mockResolvedValue([
      { id: "role-1", name: "Super Admin", permissions: [], isSystem: true, userCount: 1 },
      { id: "role-2", name: "Support Agent", permissions: ["support:view"], isSystem: false, userCount: 0 },
    ]);
    api.assignAdminRole.mockResolvedValue({ id: "admin-1" });

    renderPage();

    const select = await screen.findByDisplayValue("Super Admin");
    fireEvent.change(select, { target: { value: "role-2" } });

    await waitFor(() => expect(api.assignAdminRole).toHaveBeenCalledWith("admin-1", "role-2"));
  });
});
