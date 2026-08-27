import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { createTestQueryClient, wrapperWithClient } from "../../test/utils";
import { useMe, useLogin, useRegister, useResendVerification, useUpdateMyAccount } from "./useAuth";

vi.mock("../lib/api", () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    resendVerification: vi.fn(),
    updateMyAccount: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMe", () => {
  it("expose l'utilisateur courant une fois la requête résolue", async () => {
    api.me.mockResolvedValue({ id: "u1", email: "alice@test.local", role: "acheteur" });
    const { result } = renderHook(() => useMe(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "u1", email: "alice@test.local", role: "acheteur" });
  });

  it("passe en erreur sans retenter (utilisateur non connecté)", async () => {
    api.me.mockRejectedValue(new Error("401"));
    const { result } = renderHook(() => useMe(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(api.me).toHaveBeenCalledTimes(1);
  });
});

describe("useLogin", () => {
  it("appelle login puis me, et peuple le cache 'me' avec le résultat", async () => {
    api.login.mockResolvedValue(undefined);
    api.me.mockResolvedValue({ id: "u1", role: "technicien" });
    const client = createTestQueryClient();
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWithClient(client) });

    let me;
    await act(async () => {
      me = await result.current.mutateAsync({ email: "a@test.local", password: "secret123" });
    });

    expect(api.login).toHaveBeenCalledWith({ email: "a@test.local", password: "secret123" });
    expect(me).toEqual({ id: "u1", role: "technicien" });
    await waitFor(() => expect(client.getQueryData(queryKeys.me)).toEqual({ id: "u1", role: "technicien" }));
  });

  it("propage l'erreur de login sans appeler /me", async () => {
    api.login.mockRejectedValue(new Error("EMAIL_NOT_VERIFIED"));
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWithClient() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ email: "a@test.local", password: "secret123" });
      }),
    ).rejects.toThrow("EMAIL_NOT_VERIFIED");
    expect(api.me).not.toHaveBeenCalled();
  });
});

describe("useRegister", () => {
  it("transmet le formulaire d'inscription à l'API", async () => {
    api.register.mockResolvedValue({ id: "u2", email: "new@test.local" });
    const { result } = renderHook(() => useRegister(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ fullName: "New User", email: "new@test.local", password: "secret123" });
    });

    expect(api.register).toHaveBeenCalledWith({
      fullName: "New User",
      email: "new@test.local",
      password: "secret123",
    });
  });

  it("propage l'erreur de l'API (ex. email déjà utilisé)", async () => {
    api.register.mockRejectedValue(new Error("Email déjà utilisé"));
    const { result } = renderHook(() => useRegister(), { wrapper: wrapperWithClient() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ fullName: "X", email: "dup@test.local", password: "secret123" });
      }),
    ).rejects.toThrow("Email déjà utilisé");
  });
});

describe("useResendVerification", () => {
  it("transmet l'email à l'API", async () => {
    api.resendVerification.mockResolvedValue(null);
    const { result } = renderHook(() => useResendVerification(), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync("alice@test.local");
    });

    expect(api.resendVerification).toHaveBeenCalledWith("alice@test.local");
  });
});

describe("useUpdateMyAccount", () => {
  it("met à jour le cache 'me' avec le profil renvoyé par le serveur", async () => {
    api.updateMyAccount.mockResolvedValue({ id: "u1", phone: "0600000000" });
    const client = createTestQueryClient();
    const { result } = renderHook(() => useUpdateMyAccount(), { wrapper: wrapperWithClient(client) });

    await act(async () => {
      await result.current.mutateAsync({ phone: "0600000000" });
    });

    await waitFor(() => expect(client.getQueryData(queryKeys.me)).toEqual({ id: "u1", phone: "0600000000" }));
  });
});
