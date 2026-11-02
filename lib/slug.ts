/** Identifiant d'URL lisible : minuscules ASCII, chiffres et tirets. */
export function slugify(value: string, maxLength = 40): string {
  const slug = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "organisation";
}
