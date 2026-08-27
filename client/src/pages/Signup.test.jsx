import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "../../test/utils";
import Signup from "./Signup";

vi.mock("../lib/api", () => ({
  api: {
    register: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderSignup() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Signup — validation au blur", () => {
  it("n'entoure pas le champ email en rouge avant qu'il soit quitté", () => {
    renderSignup();
    expect(screen.getByLabelText("Email")).not.toHaveClass("border-red-500");
  });

  it("entoure l'email en rouge au blur si le format est invalide, puis retire le rouge une fois corrigé", () => {
    renderSignup();
    const email = screen.getByLabelText("Email");

    fireEvent.change(email, { target: { value: "pas-un-email" } });
    fireEvent.blur(email);
    expect(email).toHaveClass("border-red-500");

    fireEvent.change(email, { target: { value: "alice@test.local" } });
    expect(email).not.toHaveClass("border-red-500");
  });

  it("entoure le téléphone en rouge au blur si le format n'est pas français, puis retire le rouge une fois corrigé", () => {
    renderSignup();
    const phone = screen.getByLabelText("Téléphone");

    fireEvent.change(phone, { target: { value: "123" } });
    fireEvent.blur(phone);
    expect(phone).toHaveClass("border-red-500");

    fireEvent.change(phone, { target: { value: "06 11 22 33 44" } });
    expect(phone).not.toHaveClass("border-red-500");
  });

  it("ne signale pas d'erreur au blur si le téléphone (optionnel) est laissé vide", () => {
    renderSignup();
    const phone = screen.getByLabelText("Téléphone");

    fireEvent.blur(phone);
    expect(phone).not.toHaveClass("border-red-500");
  });

  it("entoure le mot de passe en rouge au blur s'il ne respecte pas les règles, puis retire le rouge une fois corrigé", () => {
    renderSignup();
    const password = screen.getByLabelText("Mot de passe");

    fireEvent.change(password, { target: { value: "trop-court" } });
    fireEvent.blur(password);
    expect(password).toHaveClass("border-red-500");

    fireEvent.change(password, { target: { value: "P@ssword123!" } });
    expect(password).not.toHaveClass("border-red-500");
  });
});
