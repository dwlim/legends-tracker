export type UpgradeCategory =
  | "offense"
  | "defense"
  | "heroes"
  | "walls"
  | "utility"
  | "other";

export interface UpgradeInput {
  id: string;
  name: string;
  durationMinutes: number;
  category: UpgradeCategory;
  notes?: string;
}

export interface ScheduledUpgrade extends UpgradeInput {
  builderIndex: number;
  startAt: Date;
  endAt: Date;
}

export interface BuilderLane {
  builderIndex: number;
  availableAt: Date;
  busyMinutes: number;
  assignments: ScheduledUpgrade[];
}

export interface PlannerSummary {
  builderCount: number;
  upgradeCount: number;
  totalDurationMinutes: number;
  spanMinutes: number;
  idleMinutes: number;
  utilization: number;
  startAt: Date;
  endAt: Date | null;
}

export interface PlannerResult {
  lanes: BuilderLane[];
  assignments: ScheduledUpgrade[];
  summary: PlannerSummary;
}

export function parseDurationInput(rawValue: string): number | null {
  const value = rawValue.trim().toLowerCase();
  if (!value) return null;

  if (/^\d+(\.\d+)?$/.test(value)) {
    return Math.max(0, Math.round(Number(value) * 60));
  }

  const pattern =
    /(\d+(?:\.\d+)?)\s*(d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/g;

  let minutes = 0;
  let matched = false;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    matched = true;
    const amount = Number(match[1]);
    const unit = match[2];

    if (unit.startsWith("d")) {
      minutes += amount * 24 * 60;
    } else if (unit.startsWith("h")) {
      minutes += amount * 60;
    } else {
      minutes += amount;
    }
  }

  if (!matched) return null;
  return Math.max(0, Math.round(minutes));
}

export function formatDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const days = Math.floor(safeMinutes / (24 * 60));
  const hours = Math.floor((safeMinutes % (24 * 60)) / 60);
  const remainder = safeMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || (days > 0 && remainder > 0)) parts.push(`${hours}h`);
  if (parts.length === 0 || remainder > 0) parts.push(`${remainder}m`);
  return parts.join(" ");
}

export function formatClock(date: Date | null): string {
  if (!date) return "No finish";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function buildPlanner({
  builderCount,
  startAt,
  upgrades,
}: {
  builderCount: number;
  startAt: Date;
  upgrades: UpgradeInput[];
}): PlannerResult {
  const safeBuilderCount = Math.max(1, Math.floor(builderCount));
  const baseStart = new Date(startAt.getTime());

  const lanes: BuilderLane[] = Array.from({ length: safeBuilderCount }, (_, index) => ({
    builderIndex: index,
    availableAt: new Date(baseStart.getTime()),
    busyMinutes: 0,
    assignments: [],
  }));

  const assignments: ScheduledUpgrade[] = [];

  for (const upgrade of upgrades) {
    const lane = lanes.reduce<BuilderLane | null>((best, current) => {
      if (!best) return current;

      const currentTime = current.availableAt.getTime();
      const bestTime = best.availableAt.getTime();

      if (currentTime < bestTime) return current;
      if (currentTime === bestTime && current.builderIndex < best.builderIndex) return current;
      return best;
    }, null);

    if (!lane) continue;

    const durationMinutes = Math.max(0, Math.round(upgrade.durationMinutes));
    const startMs = Math.max(lane.availableAt.getTime(), baseStart.getTime());
    const startDate = new Date(startMs);
    const endDate = new Date(startMs + durationMinutes * 60_000);

    const scheduled: ScheduledUpgrade = {
      ...upgrade,
      durationMinutes,
      builderIndex: lane.builderIndex,
      startAt: startDate,
      endAt: endDate,
    };

    lane.assignments.push(scheduled);
    lane.availableAt = endDate;
    lane.busyMinutes += durationMinutes;
    assignments.push(scheduled);
  }

  const endAt =
    assignments.reduce<Date | null>((latest, current) => {
      if (!latest) return new Date(current.endAt.getTime());
      return current.endAt.getTime() > latest.getTime()
        ? new Date(current.endAt.getTime())
        : latest;
    }, null) ?? null;

  const totalDurationMinutes = assignments.reduce(
    (sum, upgrade) => sum + upgrade.durationMinutes,
    0,
  );
  const spanMinutes = endAt
    ? Math.max(0, Math.round((endAt.getTime() - baseStart.getTime()) / 60_000))
    : 0;
  const idleMinutes = Math.max(0, spanMinutes * safeBuilderCount - totalDurationMinutes);
  const utilization =
    spanMinutes > 0 && safeBuilderCount > 0
      ? totalDurationMinutes / (spanMinutes * safeBuilderCount)
      : 0;

  return {
    lanes,
    assignments,
    summary: {
      builderCount: safeBuilderCount,
      upgradeCount: upgrades.length,
      totalDurationMinutes,
      spanMinutes,
      idleMinutes,
      utilization,
      startAt: baseStart,
      endAt,
    },
  };
}
