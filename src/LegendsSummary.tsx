import { useMemo, useState } from "react";

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

const summaries: SummaryData[] = [
  {
    date: "2026-06-22",
    updated: "Updated hourly from the tracked Legend League poll data.",
    stats: {
      attacks: "1600",
      avgStars: "2.65",
      avgDestruction: "95.397%",
      threeStarRate: "70.0%",
      fullArmy: "1588",
      discarded: "12",
    },
    intro: "1588 full-army attacks tracked today. Similar variants are combined.",
    armies: [
      { rank: 1, name: "Dragon Rider Air (DD Electro Fangs)", uses: "579 uses (36.5%)", performance: "2.67★ avg, 96.5% avg destruction, 70.3% triples", troops: "9 Dragon, 5 Dragon Rider, 2 Inferno Dragon, 2 Rocket Loon, 1 Archer | Spells: 5 Totem, 1 Rage, 1 Overgrowth, 2 Freeze, 2 Revive", clanCastle: "1 Sky Wagon, 1 Rocket Loon, 2 Dragon Rider", heroes: "AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Sneezy); MP (eq: Dark Orb, Meteor Staff; pet: Greedy Raven); DD (eq: Electro Fangs, Fire Heart; pet: Phoenix)" },
      { rank: 2, name: "Dragon Rider Air (DD Rocket Backpack)", uses: "337 uses (21.2%)", performance: "2.75★ avg, 97.2% avg destruction, 76.6% triples", troops: "7 Rocket Loon, 7 Dragon, 5 Dragon Rider, 2 Inferno Dragon, 1 Archer | Spells: 1 Earthquake, 6 Totem, 1 Rage, 1 Poison, 1 Skeleton, 2 Freeze, 1 Overgrowth", clanCastle: "1 Sky Wagon, 1 Inferno Dragon, 1 Super Dragon", heroes: "AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Sneezy); MP (eq: Dark Orb, Meteor Staff; pet: Greedy Raven); DD (eq: Flame Blower, Rocket Backpack; pet: Angry Jelly)" },
      { rank: 3, name: "Super Bowler Smash", uses: "261 uses (16.4%)", performance: "2.65★ avg, 95.6% avg destruction, 67.0% triples", troops: "1 Baby Dragon, 2 Ice Golem, 3 Super Wall Breaker, 6 Super Bowler, 1 Rocket Loon, 5 Healer, 1 Apprentice Warden, 1 Sky Wagon, 2 Headhunter, 1 Archer | Spells: 6 Invisibility, 2 Totem, 1 Freeze, 1 Revive, 2 Rage", clanCastle: "1 Super Valkyrie, 1 Super Yeti", heroes: "BK (eq: Snake Bracelet, Spiky Ball; pet: Frosty); AQ (eq: Action Figure, Giant Arrow; pet: Sneezy); GW (eq: Eternal Tome, Heroic Torch; pet: Poison Lizard); DD (eq: Electro Fangs, Fire Heart; pet: Spirit Fox)" },
      { rank: 4, name: "Thrower Smash", uses: "173 uses (10.9%)", performance: "2.61★ avg, 96.0% avg destruction, 67.6% triples", troops: "5 Healer, 5 Furnace, 9 Thrower, 1 Super Wall Breaker, 1 Ice Golem, 3 Sneaky Goblin, 1 Baby Dragon, 2 Minion, 2 Archer | Spells: 4 Clone, 1 Rage, 1 Totem", clanCastle: "1 Troop Launcher, 1 Super Valkyrie, 1 Super Yeti", heroes: "BK (eq: Snake Bracelet, Spiky Ball; pet: Spirit Fox); AQ (eq: Giant Arrow, Healer Puppet; pet: Frosty); GW (eq: Life Gem, Rage Gem; pet: Greedy Raven); DD (eq: Fire Heart, Stun Blaster; pet: Phoenix)" },
      { rank: 5, name: "Warden Lalo", uses: "33 uses (2.1%)", performance: "2.61★ avg, 96.6% avg destruction, 69.7% triples", troops: "1 Baby Dragon, 23 Rocket Loon, 3 Ice Hound, 4 Inferno Dragon, 1 Minion, 2 Valkyrie | Spells: 2 Earthquake, 1 Poison, 3 Freeze, 1 Healing, 2 Totem, 1 Invisibility, 1 Rage, 1 Overgrowth", clanCastle: "1 Sky Wagon, 1 Inferno Dragon, 1 Ice Hound", heroes: "GW (eq: Eternal Tome, Life Gem; pet: Sneezy); RC (eq: Rocket Spear, Seeking Shield; pet: Phoenix); MP (eq: Dark Orb, Meteor Staff; pet: Greedy Raven); DD (eq: Flame Blower, Rocket Backpack; pet: Angry Jelly)" },
    ],
  },
  {
    date: "2026-06-24",
    updated: "Updated hourly from the tracked Legend League poll data.",
    stats: {
      attacks: "1575",
      avgStars: "2.59",
      avgDestruction: "95.352%",
      threeStarRate: "63.302%",
      fullArmy: "1574",
      discarded: "1",
    },
    intro: "1574 full-army attacks tracked today. Similar variants are combined.",
    armies: [
      { rank: 1, name: "Dragon Rider Air (DD Electro Fangs)", uses: "542 uses (34.4%)", performance: "2.61★ avg, 95.3% avg destruction, 64.4% triples", troops: "7 Dragon, 2 Rocket Loon, 8 Dragon Rider, 2 Archer | Spells: 6 Invisibility, 2 Totem, 1 Freeze, 1 Revive, 2 Rage", clanCastle: "1 Sky Wagon, 1 Rocket Loon, 2 Dragon Rider", heroes: "AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Greedy Raven); MP (eq: Dark Orb, Meteor Staff; pet: Phoenix); DD (eq: Electro Fangs, Fire Heart; pet: Spirit Fox)" },
      { rank: 2, name: "Super Bowler Smash", uses: "477 uses (30.3%)", performance: "2.53★ avg, 94.2% avg destruction, 58.1% triples", troops: "2 Ice Golem, 1 Apprentice Warden, 7 Super Bowler, 5 Healer, 1 Headhunter, 1 Baby Dragon, 2 Archer, 2 Minion | Spells: 5 Invisibility, 2 Rage, 2 Totem, 2 Revive", clanCastle: "1 Sky Wagon, 1 Super Valkyrie, 1 Super Yeti", heroes: "BK (eq: Earthquake Boots, Spiky Ball; pet: Phoenix); AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Heroic Torch; pet: Poison Lizard); DD (eq: Electro Fangs, Fire Heart; pet: Spirit Fox)" },
      { rank: 3, name: "Dragon Rider Air (DD Rocket Backpack)", uses: "312 uses (19.8%)", performance: "2.68★ avg, 97.1% avg destruction, 71.5% triples", troops: "8 Dragon, 6 Dragon Rider, 1 Sky Wagon, 4 Rocket Loon, 1 Baby Dragon | Spells: 3 Earthquake, 5 Totem, 1 Poison, 2 Freeze, 1 Overgrowth, 1 Revive", clanCastle: "2 Inferno Dragon, 1 Dragon Rider", heroes: "AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Sneezy); MP (eq: Dark Orb, Meteor Staff; pet: Greedy Raven); DD (eq: Fire Heart, Rocket Backpack; pet: Phoenix)" },
      { rank: 4, name: "Thrower Smash", uses: "113 uses (7.2%)", performance: "2.55★ avg, 95.4% avg destruction, 60.2% triples", troops: "2 Ice Golem, 10 Thrower, 5 Healer, 1 Ruin Witch, 1 Log Launcher, 3 Rocket Loon, 2 Super Barbarian, 3 Super Wall Breaker, 1 Headhunter, 1 Baby Dragon, 1 Archer | Spells: 3 Earthquake, 1 Skeleton, 1 Poison, 1 Invisibility, 4 Totem, 1 Freeze, 1 Overgrowth, 1 Revive", clanCastle: "1 Super Valkyrie, 1 Super Yeti", heroes: "BK (eq: Snake Bracelet, Spiky Ball; pet: Spirit Fox); AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Life Gem, Rage Gem; pet: Sneezy); DD (eq: Fire Heart, Rocket Backpack; pet: Phoenix)" },
      { rank: 5, name: "Super Yeti Smash", uses: "44 uses (2.8%)", performance: "2.43★ avg, 96.0% avg destruction, 54.5% triples", troops: "1 Super Wall Breaker, 1 Ice Golem, 2 Headhunter, 3 Druid, 7 Super Yeti, 1 Apprentice Warden, 4 Archer | Spells: 1 Rage, 2 Totem, 1 Invisibility, 3 Revive, 1 Skeleton, 1 Poison, 2 Freeze", clanCastle: "1 Siege Barracks, 1 Super Valkyrie, 1 Super Yeti", heroes: "BK (eq: Earthquake Boots, Spiky Ball; pet: Diggy); AQ (eq: Action Figure, Magic Mirror; pet: Frosty); GW (eq: Heroic Torch, Rage Gem; pet: Poison Lizard); DD (eq: Electro Fangs, Fire Heart; pet: Phoenix)" },
    ],
  },
];

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
  const [selected, setSelected] = useState(summaries[0]?.date ?? "");
  const current = useMemo(() => summaries.find((item) => item.date === selected) ?? summaries[0], [selected]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif", color: "#111827", background: "#f9fafb" }}>
      <h1 style={{ marginTop: 0 }}>Clash Legends Summary</h1>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
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
        <div style={{ color: "#6b7280" }}>{current?.updated}</div>
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
