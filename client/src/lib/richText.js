// Rendu "riche" volontairement minimal : seuls **gras** et _italique_ sont
// interprétés (US-REPORT-01, "éditeur de texte enrichi gras/italique"), tout le
// reste du texte est échappé avant transformation. Pas d'éditeur WYSIWYG, pas de
// dangerouslySetInnerHTML sur du HTML arbitraire — élimine le risque XSS sans
// dépendance externe.
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderRichText(text) {
  if (!text) return "";
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

// Enveloppe la sélection courante d'un <textarea> avec `marker` (boutons Gras/
// Italique de l'éditeur) et renvoie le nouveau texte + la position de curseur à
// restaurer après le re-render.
export function wrapSelection(textarea, marker) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd) || "texte";
  const next = `${value.slice(0, selectionStart)}${marker}${selected}${marker}${value.slice(selectionEnd)}`;
  const cursor = selectionStart + marker.length + selected.length + marker.length;
  return { next, cursor };
}
