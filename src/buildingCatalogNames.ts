export function displayNameFor(entry: { name: string; display_name?: string }) {
  return entry.display_name || entry.name;
}

export function deriveFamily(name: string, exportName: string) {
  const source = exportName || name;
  return source
    .replace(/(_lvl\d+.*)$/i, "")
    .replace(/(_level\d+.*)$/i, "")
    .replace(/(_upg|_upgrade|_const|_base|_setup|_idle|_attack|_broken|_locked|_v\d+).*$/i, "")
    .replace(/[_-]+$/, "")
    .trim();
}
