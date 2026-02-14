"use server";

import { and, desc, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { timeEntry } from "~/server/db/schema";
import { getActiveTimer } from "./actions";
import { ActiveTimer } from "./components/active-timer";
import { StartTimer } from "./components/start-timer";
import TimeEntry from "./components/time-entry";
import { LinearClient } from "@linear/sdk";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import isoWeek from "dayjs/plugin/isoWeek";
import prettyMilliseconds from "pretty-ms";
import { ViewToggle } from "./components/view-toggle";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isoWeek);

type Entry = {
  startedAt: Date | null;
  endedAt: Date | null;
};

type ViewMode = "daily" | "weekly";

function formatDateHeader(dateKey: string, viewMode: ViewMode) {
  if (viewMode === "weekly") {
    const [year, week] = dateKey.split("-W");
    const date = dayjs().year(parseInt(year!)).isoWeek(parseInt(week!));
    const weekStart = date.startOf("isoWeek");
    const weekEnd = date.endOf("isoWeek");

    if (weekStart.isSame(dayjs(), "week")) return "This Week";
    if (weekStart.isSame(dayjs().subtract(1, "week"), "week"))
      return "Last Week";

    if (weekStart.year() === weekEnd.year()) {
      return `${weekStart.format("MMM D")} - ${weekEnd.format("MMM D")}`;
    }
    return `${weekStart.format("MMM D, YYYY")} - ${weekEnd.format("MMM D, YYYY")}`;
  }

  const date = dayjs(dateKey);
  if (date.isToday()) return "Today";
  if (date.isYesterday()) return "Yesterday";
  if (date.isAfter(dayjs().subtract(7, "days"))) return date.format("dddd");
  if (date.year() === dayjs().year()) return date.format("MMM D");
  return date.format("MMM D, YYYY");
}

function calculateTotal(entries: Entry[]) {
  return entries.reduce((total, entry) => {
    if (entry.startedAt && entry.endedAt) {
      const duration = entry.endedAt.getTime() - entry.startedAt.getTime();
      return total + duration;
    }
    return total;
  }, 0);
}

type TimeDashboardProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function TimeDashboard({
  searchParams,
}: TimeDashboardProps) {
  const session = await getSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const viewMode: ViewMode = params.view === "weekly" ? "weekly" : "daily";

  const entries = await db
    .select()
    .from(timeEntry)
    .where(
      and(eq(timeEntry.userId, session.user.id), isNotNull(timeEntry.endedAt)),
    )
    .orderBy(desc(timeEntry.endedAt));

  const linearClient = session.user.linearApiKey
    ? new LinearClient({ apiKey: session.user.linearApiKey })
    : null;

  const enrichedEntries = await Promise.all(
    entries.map(async (entry) => {
      if (!linearClient || !entry.linearTaskId) return entry;
      try {
        const issue = await linearClient.issue(entry.linearTaskId);
        return { ...entry, linearTaskUrl: issue.url };
      } catch (error) {
        console.error(
          `Failed to fetch Linear task ${entry.linearTaskId}:`,
          error,
        );
        return entry;
      }
    }),
  );

  const entriesByPeriod = enrichedEntries.reduce(
    (acc, entry) => {
      if (!entry.endedAt) return acc;

      let periodKey: string;
      if (viewMode === "weekly") {
        const date = dayjs(entry.endedAt);
        periodKey = `${date.isoWeekYear()}-W${String(date.isoWeek()).padStart(2, "0")}`;
      } else periodKey = dayjs(entry.endedAt).format("YYYY-MM-DD");

      acc[periodKey] ??= [];
      acc[periodKey]?.push(entry);
      return acc;
    },
    {} as Record<string, typeof enrichedEntries>,
  );

  const sortedPeriodKeys = Object.keys(entriesByPeriod).sort((a, b) =>
    b.localeCompare(a),
  );

  const activeTimer = await getActiveTimer();

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-light">willow</h1>
        <p className="text-muted-foreground text-sm">
          here you can find all of your tracked time
        </p>
      </div>

      <StartTimer hasActiveTimer={!!activeTimer} />
      {activeTimer && <ActiveTimer entry={activeTimer} />}

      <ViewToggle currentView={viewMode} />

      <div className="space-y-8">
        {sortedPeriodKeys.length > 0 ? (
          sortedPeriodKeys.map((periodKey) => {
            const periodEntries = entriesByPeriod[periodKey]!;
            const totalMs = calculateTotal(periodEntries);

            return (
              <div key={periodKey}>
                <div className="mb-3 flex flex-col items-baseline">
                  <h2 className="text-muted-foreground text-sm font-medium">
                    {formatDateHeader(periodKey, viewMode)}
                  </h2>
                  <h2 className="text-muted-foreground text-sm font-medium">
                    {prettyMilliseconds(totalMs, {
                      verbose: true,
                      unitCount: 2,
                    })}
                  </h2>
                </div>
                <div className="space-y-3">
                  {periodEntries.map((entry) => (
                    <TimeEntry entry={entry} key={entry.id} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            no entries yet. start tracking your time above.
          </p>
        )}
      </div>
    </div>
  );
}
