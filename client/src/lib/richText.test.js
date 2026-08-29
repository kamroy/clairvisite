import { describe, expect, it } from "vitest";
import { renderRichText } from "./richText";

describe("renderRichText", () => {
  it("transforme **gras** et _italique_ en balises", () => {
    expect(renderRichText("**Attention** à l'_humidité_")).toBe(
      "<strong>Attention</strong> à l&#39;<em>humidité</em>",
    );
  });

  it("échappe le HTML brut au lieu de l'interpréter (anti-XSS)", () => {
    expect(renderRichText("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("échappe le HTML même à l'intérieur d'un marqueur gras/italique", () => {
    expect(renderRichText("**<img src=x onerror=alert(1)>**")).toBe(
      "<strong>&lt;img src=x onerror=alert(1)&gt;</strong>",
    );
  });

  it("convertit les retours à la ligne en <br />", () => {
    expect(renderRichText("Ligne 1\nLigne 2")).toBe("Ligne 1<br />Ligne 2");
  });

  it("renvoie une chaîne vide pour une valeur vide ou nulle", () => {
    expect(renderRichText("")).toBe("");
    expect(renderRichText(null)).toBe("");
  });
});
