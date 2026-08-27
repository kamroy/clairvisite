import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Field from "./Field";

describe("Field", () => {
  it("n'affiche pas de bordure rouge par défaut", () => {
    render(<Field label="Email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Email")).not.toHaveClass("border-red-500");
  });

  it("affiche une bordure rouge quand invalid est vrai", () => {
    render(<Field label="Email" value="" onChange={() => {}} invalid />);
    expect(screen.getByLabelText("Email")).toHaveClass("border-red-500");
  });

  it("applique aussi la bordure rouge sur un textarea", () => {
    render(<Field as="textarea" label="Bio" value="" onChange={() => {}} invalid />);
    expect(screen.getByLabelText("Bio")).toHaveClass("border-red-500");
  });
});
