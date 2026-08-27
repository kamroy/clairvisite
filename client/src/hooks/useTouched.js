import { useState } from "react";

// Suit quels champs ont déjà été quittés (blur) au moins une fois, pour n'afficher une
// erreur de format qu'après une première saisie — pas dès l'affichage du formulaire.
export function useTouched() {
  const [touched, setTouched] = useState({});

  function onBlurField(name) {
    return () => setTouched((t) => ({ ...t, [name]: true }));
  }

  function isTouched(name) {
    return Boolean(touched[name]);
  }

  return { onBlurField, isTouched };
}
