import { useEffect, useMemo, useState } from "react";

type SummaryCard = {
  rank: number;
  name: string;
  uses: string;
  performance: string;
  troops: string;
  clanCastle: string;
  heroes: string;
};

type SummaryData = {
  date: string;
  updated: string;
  stats: {
    attacks: string;
    avgStars: string;
    avgDestruction: string;
    threeStarRate: string;
    fullArmy: string;
    discarded: string;
  };
  intro: string;
  armies: SummaryCard[];
};

type SiteIndex = {
  summaries: Array<{ date: string; file: string }>;
};

const summaryCache = new Map<string, SummaryData>();

function parseSummaryMarkdown(date: string, markdown: string): SummaryData {
  const lines = markdown.split(/\r?\n/);
  const stat = (label: string) => {
    const line = lines.find((entry) => entry.startsWith(`${label}:`));
    return line ? line.slice(label.length + 2).trim() : "—";
  };
  const armyStart = lines.findIndex((line) => line.startsWith("**Top 5 most popular armies"));
  const armyLines = armyStart >= 0 ? lines.slice(armyStart + 1) : [];
  const armies: SummaryCard[] = [];
  let current: SummaryCard | null = null;
  for (const line of armyLines) {
    const match = line.match(/^\s*\d+\.\s+(.+?)\s+—\s+(.+?)\s*$/);
    if (match) {
      if (current) armies.push(current);
      current = { rank: armies.length + 1, name: match[1], uses: match[2], performance: "", troops: "", clanCastle: "", heroes: "" };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("- Performance:")) current.performance = line.replace("- Performance:", "").trim();
    if (line.startsWith("- Troops:")) current.troops = line.replace("- Troops:", "").trim();
    if (line.startsWith("- Clan Castle:")) current.clanCastle = line.replace("- Clan Castle:", "").trim();
    if (line.startsWith("- Heroes:")) current.heroes = line.replace("- Heroes:", "").trim();
  }
  if (current) armies.push(current);
  return {
    date,
    updated: "Updated hourly from the tracked Legend League poll data.",
    stats: {
      attacks: stat("Tracked attacks"),
      avgStars: stat("Overall average stars"),
      avgDestruction: stat("Overall average destruction"),
      threeStarRate: stat("Overall 3-star rate"),
      fullArmy: stat("Main attacks used for army comps"),
      discarded: stat("Discarded partial/hero-only codes from army comps"),
    },
    intro: lines.find((line) => line.includes("full-army") || line.includes("main attacks")) ?? "",
    armies,
  };
}

function siteUrl(path: string) {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return new URL(path.replace(/^\.?\/?/, ""), window.location.origin + base).toString();
}

async function loadSummaries(): Promise<SummaryData[]> {
  const res = await fetch(siteUrl("legend_site/summaries.json"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load summaries index (${res.status})`);
  const index = (await res.json()) as SiteIndex;
  const loaded: SummaryData[] = [];
  for (const item of index.summaries) {
    if (summaryCache.has(item.date)) {
      loaded.push(summaryCache.get(item.date)!);
      continue;
    }
    const mdRes = await fetch(siteUrl(`legend_site/${item.file}`), { cache: "no-store" });
    if (!mdRes.ok) throw new Error(`Failed to load summary ${item.file} (${mdRes.status})`);
    const md = await mdRes.text();
    const parsed = parseSummaryMarkdown(item.date, md);
    summaryCache.set(item.date, parsed);
    loaded.push(parsed);
  }
  return loaded;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 12, border: "1px solid #d1d5db", borderRadius: 12, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function ArmyCard({ army }: { army: SummaryCard }) {
  return (
    <section style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{army.rank}. {army.name}</h3>
        <strong>{army.uses}</strong>
      </div>
      <p style={{ margin: "8px 0 0", color: "#374151" }}>{army.performance}</p>
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        <div><strong>Troops & Spells:</strong> {army.troops}</div>
        <div><strong>Clan Castle:</strong> {army.clanCastle}</div>
        <div><strong>Heroes:</strong> {army.heroes}</div>
      </div>
    </section>
  );
}

export default function LegendsSummary() {
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadSummaries()
      .then((loaded) => {
        setSummaries(loaded);
        setSelected((current) => current || loaded[0]?.date || "");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load legends summaries.");
      });
  }, []);

  const current = useMemo(() => summaries.find((item) => item.date === selected) ?? summaries[0], [summaries, selected]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif", color: "#111827", background: "#f9fafb" }}>
      <h1 style={{ marginTop: 0 }}>Clash Legends Summary</h1>
      {error ? <div style={{ padding: 16, border: "1px solid #fca5a5", background: "#fef2f2", color: "#991b1b", borderRadius: 12 }}>{error}</div> : null}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Day {" "}
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {summaries.map((item) => (
              <option key={item.date} value={item.date}>
                {item.date}
              </option>
            ))}
          </select>
        </label>
        <div style={{ color: "#6b7280" }}>{current?.updated ?? (error ? "" : "Loading…")}</div>
      </div>

      <p style={{ marginTop: 16, color: "#374151" }}>{current?.intro}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
        <Stat label="Tracked attacks" value={current?.stats.attacks ?? "—"} />
        <Stat label="Average stars" value={current?.stats.avgStars ?? "—"} />
        <Stat label="Average destruction" value={current?.stats.avgDestruction ?? "—"} />
        <Stat label="3-star rate" value={current?.stats.threeStarRate ?? "—"} />
        <Stat label="Full-army attacks" value={current?.stats.fullArmy ?? "—"} />
        <Stat label="Discarded codes" value={current?.stats.discarded ?? "—"} />
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Top 5 armies</h2>
        {current?.armies.map((army) => <ArmyCard key={`${current.date}-${army.rank}`} army={army} />)}
      </section>
    </main>
  );
}
