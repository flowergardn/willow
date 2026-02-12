"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { timeEntry } from "~/server/db/schema";
import { getActiveTimer } from "./actions";
import { ActiveTimer } from "./components/active-timer";
import { StartTimer } from "./components/start-timer";
import TimeEntry from "./components/time-entry";

export default async function TimeDashboard() {
  const session = await getSession();
  if (!session) redirect("/");

  const entries = await db
    .select()
    .from(timeEntry)
    .where(
      and(eq(timeEntry.userId, session.user.id), isNotNull(timeEntry.endedAt)),
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

      <div className="space-y-3">
        <h2 className="text-muted-foreground mb-4 text-sm">recent entries</h2>

        {entries.map((entry) => (
          <TimeEntry entry={entry} key={entry.id} />
        ))}

        {entries.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            no entries yet. start tracking your time above.
          </p>
        )}
      </div>
    </div>
  );
}
