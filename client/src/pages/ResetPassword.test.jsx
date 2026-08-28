import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import ResetPassword from "./ResetPassword";

vi.mock("../lib/api", () => ({
  api: {
    resetPassword: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderResetPassword(token = "raw-token") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[token ? `/reset-password?token=${token}` : "/reset-password"]}>
        <ResetPassword />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ResetPassword", () => {
  it("affiche une erreur invitant à redemander un lien quand le token est absent de l'URL", () => {
    renderResetPassword(null);
    expect(screen.getByText(/lien de réinitialisation est invalide/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nouveau mot de passe")).not.toBeInTheDocument();
  });

  it("désactive la soumission tant que les deux mots de passe ne correspondent pas", () => {
    renderResetPassword();

    fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), { target: { value: "P@ssword123!" } });
    fireEvent.change(screen.getByLabelText("Confirmez le mot de passe"), { target: { value: "Autre123!" } });

    expect(screen.getByRole("button", { name: "Réinitialiser le mot de passe" })).toBeDisabled();
  });

  it("soumet le token et le nouveau mot de passe, puis affiche la confirmation", async () => {
    api.resetPassword.mockResolvedValue({ message: "ok" });
    renderResetPassword("raw-token");

    fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), { target: { value: "P@ssword123!" } });
    fireEvent.change(screen.getByLabelText("Confirmez le mot de passe"), { target: { value: "P@ssword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser le mot de passe" }));

    await waitFor(() => expect(api.resetPassword).toHaveBeenCalledWith("raw-token", "P@ssword123!"));
    expect(await screen.findByText("Votre mot de passe a été mis à jour.")).toBeInTheDocument();
  });

  it("affiche l'erreur renvoyée par l'API pour un jeton invalide ou expiré", async () => {
    api.resetPassword.mockRejectedValue(new Error("Lien de réinitialisation invalide ou expiré"));
    renderResetPassword("expired-token");

    fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), { target: { value: "P@ssword123!" } });
    fireEvent.change(screen.getByLabelText("Confirmez le mot de passe"), { target: { value: "P@ssword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser le mot de passe" }));

    expect(await screen.findByText("Lien de réinitialisation invalide ou expiré")).toBeInTheDocument();
  });

  it("bascule l'affichage du mot de passe en clair via le bouton Afficher/Masquer", () => {
    renderResetPassword();
    const password = screen.getByLabelText("Nouveau mot de passe");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Afficher" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Masquer" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
