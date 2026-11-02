/** Accepte uniquement un chemin interne (empêche les redirections ouvertes). */
export function safeCallbackUrl(value: unknown, fallback = "/espace"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
