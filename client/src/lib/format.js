export function initials(fullName) {
  if (!fullName) return "";
  return fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function formatDateTime(isoOrDate) {
  if (!isoOrDate) return "";
  return dateTimeFormatter.format(new Date(isoOrDate));
}

export function formatSlotRange(startDatetime, endDatetime) {
  if (!startDatetime) return "";
  const label = dateTimeFormatter.format(new Date(startDatetime));
  return endDatetime ? `${label} – ${timeFormatter.format(new Date(endDatetime))}` : label;
}

// Transforme une saisie "électricité, plomberie" en ["électricité", "plomberie"] —
// utilisé pour les champs texte représentant une liste (spécialités, régions).
export function parseCommaList(value) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
