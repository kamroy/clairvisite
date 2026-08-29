import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { wrapperWithClient } from "../../test/utils";
import {
  useAdminPermissionGroups,
  useAdminRoles,
  useAdminAdmins,
  useCreateAdminRole,
  useUpdateAdminRolePermissions,
  useCloneAdminRole,
  useDeleteAdminRole,
  useAssignAdminRole,
} from "./useAdminRoles";

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAdminPermissionGroups / useAdminRoles / useAdminAdmins", () => {
  it("chargent respectivement le catalogue, les rôles et les admins", async () => {
    api.adminPermissionGroups.mockResolvedValue([{ key: "users", permissions: [] }]);
    api.adminRoles.mockResolvedValue([{ id: "r1", name: "Super Admin" }]);
    api.adminAdmins.mockResolvedValue([{ id: "u1", fullName: "Admin One" }]);

    const { result: groups } = renderHook(() => useAdminPermissionGroups(), { wrapper: wrapperWithClient() });
    const { result: roles } = renderHook(() => useAdminRoles(), { wrapper: wrapperWithClient() });
    const { result: admins } = renderHook(() => useAdminAdmins(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(groups.current.isSuccess).toBe(true));
    await waitFor(() => expect(roles.current.isSuccess).toBe(true));
    await waitFor(() => expect(admins.current.isSuccess).toBe(true));
  });
});

describe("mutations RBAC", () => {
  it("useCreateAdminRole transmet nom et permissions", async () => {
    api.createAdminRole.mockResolvedValue({ id: "r2" });
    const { result } = renderHook(() => useCreateAdminRole(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ name: "Support Agent", permissions: ["support:view"] });
    });

    expect(api.createAdminRole).toHaveBeenCalledWith("Support Agent", ["support:view"]);
  });

  it("useUpdateAdminRolePermissions transmet l'id et les permissions", async () => {
    api.updateAdminRolePermissions.mockResolvedValue({ id: "r2" });
    const { result } = renderHook(() => useUpdateAdminRolePermissions(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ id: "r2", permissions: ["support:manage"] });
    });

    expect(api.updateAdminRolePermissions).toHaveBeenCalledWith("r2", ["support:manage"]);
  });

  it("useCloneAdminRole transmet l'id source et le nouveau nom", async () => {
    api.cloneAdminRole.mockResolvedValue({ id: "r3" });
    const { result } = renderHook(() => useCloneAdminRole(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ id: "r2", name: "Copie" });
    });

    expect(api.cloneAdminRole).toHaveBeenCalledWith("r2", "Copie");
  });

  it("useDeleteAdminRole transmet l'id", async () => {
    api.deleteAdminRole.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteAdminRole(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync("r2");
    });

    expect(api.deleteAdminRole).toHaveBeenCalledWith("r2");
  });

  it("useAssignAdminRole transmet userId et adminRoleId", async () => {
    api.assignAdminRole.mockResolvedValue({ id: "u1" });
    const { result } = renderHook(() => useAssignAdminRole(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ userId: "u1", adminRoleId: "r2" });
    });

    expect(api.assignAdminRole).toHaveBeenCalledWith("u1", "r2");
  });
});
