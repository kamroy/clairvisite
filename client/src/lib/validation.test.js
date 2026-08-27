import { describe, expect, it } from "vitest";
import { FRENCH_PHONE_PATTERN, isValidEmail, isValidFrenchPhone, isValidPassword } from "./validation";

// Même comportement attendu que server/src/common/validators/french-phone.spec.ts —
// l'attribut HTML pattern ancre implicitement toute la valeur, on reproduit ça ici.
const regex = new RegExp(`^(?:${FRENCH_PHONE_PATTERN})$`);

describe("FRENCH_PHONE_PATTERN", () => {
  it.each(["0611223344", "06 11 22 33 44", "06.11.22.33.44", "06-11-22-33-44", "+33611223344", "+33 6 11 22 33 44"])(
    "accepte %s",
    (value) => {
      expect(regex.test(value)).toBe(true);
    },
  );

  it.each(["", "123456789", "0011223344", "061122334", "06112233445", "+1 611 223 344", "abcdefghij"])(
    "rejette %s",
    (value) => {
      expect(regex.test(value)).toBe(false);
    },
  );
});

describe("isValidFrenchPhone", () => {
  it("accepte un numéro français valide", () => {
    expect(isValidFrenchPhone("06 11 22 33 44")).toBe(true);
  });

  it("rejette un numéro invalide", () => {
    expect(isValidFrenchPhone("123")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it.each(["alice@test.local", "a.b+c@sub.example.com"])("accepte %s", (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each(["", "alice", "alice@", "alice@test", "@test.local", "alice test@test.local"])(
    "rejette %s",
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );
});

describe("isValidPassword", () => {
  it.each(["P@ssword123!", "Tr3s-S3cure-Passw0rd"])("accepte %s", (value) => {
    expect(isValidPassword(value)).toBe(true);
  });

  it("rejette un mot de passe trop court malgré majuscule et caractère spécial", () => {
    expect(isValidPassword("Sh0rt!")).toBe(false);
  });

  it("rejette un mot de passe sans majuscule", () => {
    expect(isValidPassword("p@ssword123!")).toBe(false);
  });

  it("rejette un mot de passe sans caractère spécial", () => {
    expect(isValidPassword("Password1234")).toBe(false);
  });
});
