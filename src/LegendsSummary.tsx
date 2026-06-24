import { useMemo, useState } from "react";

const summaries = [
  { date: "2026-06-22", content: "# 2026-06-22\n\nSee the saved summary in the deployed bundle." },
  { date: "2026-06-24", content: "# 2026-06-24\n\nSee the saved summary in the deployed bundle." },
];

export default function LegendsSummary() {
  const [selected, setSelected] = useState(summaries[0]?.date ?? "");

  const current = useMemo(() => summaries.find((item) => item.date === selected) ?? summaries[0], [selected]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Clash Legends Summary</h1>
      <label>
        Day{" "}
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {summaries.map((item) => (
            <option key={item.date} value={item.date}>
              {item.date}
            </option>
          ))}
        </select>
      </label>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{current?.content ?? "No summary found"}</pre>
    </main>
  );
}
