import { useMemo, useState } from "react";

const summaries = [
  {
    date: "2026-06-22",
    content: `# Legend Daily Summary — 2026-06-22

Updated hourly from the tracked Legend League poll data.

Overall tracked attacks: 1600
Overall average stars: 2.65
Overall average destruction: 95.397%
Overall 3-star rate: 70.0%
Full-army attacks used for army comps: 1588
Discarded partial/hero-only codes from army comps: 12

**Top 5 most popular armies for 2026-06-22**
1588 full-army attacks tracked today. Similar variants are combined.

**1. Dragon Rider Air (DD Electro Fangs)** — 579 uses (36.5%)
• Performance: 2.67★ avg, 96.5% avg destruction, 70.3% triples
• Troops: 9 Dragon, 5 Dragon Rider, 2 Inferno Dragon, 2 Rocket Loon, 1 Archer | Spells: 5 Totem, 1 Rage, 1 Overgrowth, 2 Freeze, 2 Revive
• Clan Castle: 1 Sky Wagon, 1 Rocket Loon, 2 Dragon Rider
• Heroes: AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Sneezy); MP (eq: Dark Orb, Meteor Staff; pet: Greedy Raven); DD (eq: Electro Fangs, Fire Heart; pet: Phoenix)

**2. Dragon Rider Air (DD Rocket Backpack)** — 337 uses (21.2%)
• Performance: 2.75★ avg, 97.2% avg destruction, 76.6% triples
• Troops: 7 Rocket Loon, 7 Dragon, 5 Dragon Rider, 2 Inferno Dragon, 1 Archer | Spells: 1 Earthquake, 6 Totem, 1 Rage, 1 Poison, 1 Skeleton, 2 Freeze, 1 Overgrowth
• Clan Castle: 1 Sky Wagon, 1 Inferno Dragon, 1 Super Dragon
• Heroes: AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Sneezy); MP (eq: Dark Orb, Meteor Staff; pet: Phoenix); DD (eq: Flame Blower, Rocket Backpack; pet: Angry Jelly)

**3. Super Bowler Smash** — 261 uses (16.4%)
• Performance: 2.65★ avg, 95.6% avg destruction, 67.0% triples
• Troops: 1 Baby Dragon, 2 Ice Golem, 3 Super Wall Breaker, 6 Super Bowler, 1 Rocket Loon, 5 Healer, 1 Apprentice Warden, 1 Sky Wagon, 2 Headhunter, 1 Archer | Spells: 6 Invisibility, 2 Totem, 1 Freeze, 1 Revive, 2 Rage
• Clan Castle: 1 Super Valkyrie, 1 Super Yeti
• Heroes: BK (eq: Snake Bracelet, Spiky Ball; pet: Frosty); AQ (eq: Action Figure, Giant Arrow; pet: Sneezy); GW (eq: Eternal Tome, Heroic Torch; pet: Poison Lizard); DD (eq: Electro Fangs, Fire Heart; pet: Spirit Fox)

**4. Thrower Smash** — 173 uses (10.9%)
• Performance: 2.61★ avg, 96.0% avg destruction, 67.6% triples
• Troops: 5 Healer, 5 Furnace, 9 Thrower, 1 Super Wall Breaker, 1 Ice Golem, 3 Sneaky Goblin, 1 Baby Dragon, 2 Minion, 2 Archer | Spells: 4 Clone, 1 Rage, 1 Totem
• Clan Castle: 1 Troop Launcher, 1 Super Valkyrie, 1 Super Yeti
• Heroes: BK (eq: Snake Bracelet, Spiky Ball; pet: Spirit Fox); AQ (eq: Giant Arrow, Healer Puppet; pet: Frosty); GW (eq: Life Gem, Rage Gem; pet: Greedy Raven); DD (eq: Fire Heart, Stun Blaster; pet: Phoenix)

**5. Warden Lalo** — 33 uses (2.1%)
• Performance: 2.61★ avg, 96.6% avg destruction, 69.7% triples
• Troops: 1 Baby Dragon, 23 Rocket Loon, 3 Ice Hound, 4 Inferno Dragon, 1 Minion, 2 Valkyrie | Spells: 2 Earthquake, 1 Poison, 3 Freeze, 1 Healing, 2 Totem, 1 Invisibility, 1 Rage, 1 Overgrowth
• Clan Castle: 1 Sky Wagon, 1 Inferno Dragon, 1 Ice Hound
• Heroes: GW (eq: Eternal Tome, Life Gem; pet: Sneezy); RC (eq: Rocket Spear, Seeking Shield; pet: Phoenix); MP (eq: Dark Orb, Meteor Staff; pet: Greedy Raven); DD (eq: Flame Blower, Rocket Backpack; pet: Angry Jelly)`,
  },
  {
    date: "2026-06-24",
    content: `# Legend Daily Summary — 2026-06-24

Updated hourly from the tracked Legend League poll data.

Overall tracked attacks: 1575
Overall average stars: 2.59
Overall average destruction: 95.352%
Overall 3-star rate: 63.302%
Full-army attacks used for army comps: 1574
Discarded partial/hero-only codes from army comps: 1

**Top 5 most popular armies for 2026-06-24**
1574 full-army attacks tracked today. Similar variants are combined.

**1. Dragon Rider Air (DD Electro Fangs)** — 542 uses (34.4%)
• Performance: 2.61★ avg, 95.3% avg destruction, 64.4% triples
• Troops: 7 Dragon, 2 Rocket Loon, 8 Dragon Rider, 2 Archer | Spells: 6 Invisibility, 2 Totem, 1 Freeze, 1 Revive, 2 Rage
• Clan Castle: 1 Sky Wagon, 1 Rocket Loon, 2 Dragon Rider
• Heroes: AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Greedy Raven); MP (eq: Dark Orb, Meteor Staff; pet: Phoenix); DD (eq: Electro Fangs, Fire Heart; pet: Spirit Fox)

**2. Super Bowler Smash** — 477 uses (30.3%)
• Performance: 2.53★ avg, 94.2% avg destruction, 58.1% triples
• Troops: 2 Ice Golem, 1 Apprentice Warden, 7 Super Bowler, 5 Healer, 1 Headhunter, 1 Baby Dragon, 2 Archer, 2 Minion | Spells: 5 Invisibility, 2 Rage, 2 Totem, 2 Revive
• Clan Castle: 1 Sky Wagon, 1 Super Valkyrie, 1 Super Yeti
• Heroes: BK (eq: Earthquake Boots, Spiky Ball; pet: Phoenix); AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Heroic Torch; pet: Poison Lizard); DD (eq: Electro Fangs, Fire Heart; pet: Spirit Fox)

**3. Dragon Rider Air (DD Rocket Backpack)** — 312 uses (19.8%)
• Performance: 2.68★ avg, 97.1% avg destruction, 71.5% triples
• Troops: 8 Dragon, 6 Dragon Rider, 1 Sky Wagon, 4 Rocket Loon, 1 Baby Dragon | Spells: 3 Earthquake, 5 Totem, 1 Poison, 2 Freeze, 1 Overgrowth, 1 Revive
• Clan Castle: 2 Inferno Dragon, 1 Dragon Rider
• Heroes: AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Eternal Tome, Healing Tome; pet: Sneezy); MP (eq: Dark Orb, Meteor Staff; pet: Greedy Raven); DD (eq: Fire Heart, Rocket Backpack; pet: Phoenix)

**4. Thrower Smash** — 113 uses (7.2%)
• Performance: 2.55★ avg, 95.4% avg destruction, 60.2% triples
• Troops: 2 Ice Golem, 10 Thrower, 5 Healer, 1 Ruin Witch, 1 Log Launcher, 3 Rocket Loon, 2 Super Barbarian, 3 Super Wall Breaker, 1 Headhunter, 1 Baby Dragon, 1 Archer | Spells: 3 Earthquake, 1 Skeleton, 1 Poison, 1 Invisibility, 4 Totem, 1 Freeze, 1 Overgrowth, 1 Revive
• Clan Castle: 1 Super Valkyrie, 1 Super Yeti
• Heroes: BK (eq: Snake Bracelet, Spiky Ball; pet: Spirit Fox); AQ (eq: Action Figure, Giant Arrow; pet: Frosty); GW (eq: Life Gem, Rage Gem; pet: Sneezy); DD (eq: Fire Heart, Rocket Backpack; pet: Phoenix)

**5. Super Yeti Smash** — 44 uses (2.8%)
• Performance: 2.43★ avg, 96.0% avg destruction, 54.5% triples
• Troops: 1 Super Wall Breaker, 1 Ice Golem, 2 Headhunter, 3 Druid, 7 Super Yeti, 1 Apprentice Warden, 4 Archer | Spells: 1 Rage, 2 Totem, 1 Invisibility, 3 Revive, 1 Skeleton, 1 Poison, 2 Freeze
• Clan Castle: 1 Siege Barracks, 1 Super Valkyrie, 1 Super Yeti
• Heroes: BK (eq: Earthquake Boots, Spiky Ball; pet: Diggy); AQ (eq: Action Figure, Magic Mirror; pet: Frosty); GW (eq: Heroic Torch, Rage Gem; pet: Poison Lizard); DD (eq: Electro Fangs, Fire Heart; pet: Phoenix)`,
  },
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
