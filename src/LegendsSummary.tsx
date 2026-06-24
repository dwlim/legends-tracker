import { useEffect, useMemo, useState } from "react";

type SummaryItem = { date: string; file: string };

export default function LegendsSummary() {
  const [items, setItems] = useState<SummaryItem[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("Loading…");
  const [status, setStatus] = useState("Loading summaries…");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}legend_site/summaries.json`)
      .then((r) => r.json())
      .then((data) => {
        const next = (data.summaries ?? []) as SummaryItem[];
        setItems(next);
        setSelected(next[0]?.date ?? "");
      })
      .catch((err) => {
        setStatus("Failed to load summaries.json");
        setContent(String(err));
      });
  }, []);

  const current = useMemo(() => items.find((item) => item.date === selected), [items, selected]);

  useEffect(() => {
    if (!current) return;
    setStatus(`Showing ${current.date}`);
    setContent("Loading…");
    fetch(`${import.meta.env.BASE_URL}legend_site/${current.file}`)
      .then((r) => r.text())
      .then(setContent)
      .catch((err) => setContent(String(err)));
  }, [current]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Clash Legends Summary</h1>
      <p>{status}</p>
      <label>
        Day{" "}
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {items.map((item) => (
            <option key={item.date} value={item.date}>
              {item.date}
            </option>
          ))}
        </select>
      </label>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{content}</pre>
    </main>
  );
}
