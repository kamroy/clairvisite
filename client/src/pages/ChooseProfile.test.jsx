import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChooseProfile from "./ChooseProfile";

function renderChooseProfile() {
  return render(
    <MemoryRouter>
      <ChooseProfile />
    </MemoryRouter>,
  );
}

describe("ChooseProfile", () => {
  it("propose les deux profils avec un lien vers le bon formulaire d'inscription", () => {
    renderChooseProfile();

    expect(screen.getByRole("link", { name: /Créer un compte Acheteur/ })).toHaveAttribute(
      "href",
      "/signup/acheteur",
    );
    expect(screen.getByRole("link", { name: /Créer un compte Pro/ })).toHaveAttribute("href", "/signup/pro");
  });

  it("propose un lien vers la connexion pour les membres existants", () => {
    renderChooseProfile();
    expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/login");
  });
});
