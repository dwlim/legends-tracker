export function formatResourceLabel(resource: string) {
  if (resource === "Gold2") return "Builder Gold";
  if (resource === "Elixir2") return "Builder Elixir";
  if (resource === "Gold") return "Gold";
  if (resource === "Elixir") return "Elixir";
  if (resource === "DarkElixir" || resource === "Dark Elixir") return "Dark Elixir";
  if (resource === "Builder Gold") return "Builder Gold";
  if (resource === "Builder Elixir") return "Builder Elixir";
  return resource || "Unknown";
}
