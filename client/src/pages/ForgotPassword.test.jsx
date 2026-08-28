import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import ForgotPassword from "./ForgotPassword";

vi.mock("../lib/api", () => ({
  api: {
    forgotPassword: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderForgotPassword() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ForgotPassword", () => {
  it("envoie l'email saisi et affiche un message générique de succès", async () => {
    api.forgotPassword.mockResolvedValue({ message: "ok" });
    renderForgotPassword();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice@test.local" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));

    await waitFor(() => expect(api.forgotPassword).toHaveBeenCalledWith("alice@test.local"));
    expect(await screen.findByText(/vient d'être envoyé/)).toBeInTheDocument();
  });

  it("affiche le même message générique même si l'API échoue silencieusement (anti-enumeration)", async () => {
    // Le serveur ne renvoie jamais d'erreur pour cet endpoint (anti-enumeration) : ce test
    // documente que le client n'a pas besoin de distinguer les cas, seule la réussite compte.
    api.forgotPassword.mockResolvedValue({ message: "ok" });
    renderForgotPassword();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "unknown@test.local" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));

    expect(await screen.findByText(/vient d'être envoyé/)).toBeInTheDocument();
  });
});
