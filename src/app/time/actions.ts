"use server";

import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { timeEntry } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { eq, and, isNull } from "drizzle-orm";
import { LinearClient } from "@linear/sdk";

export async function extractIssueId(input: string) {
  const regex = /\b([A-Za-z]{1,5}-\d+)\b/;
  const m = regex.exec(input);
  return m ? m[1] : null;
}

export async function startTimer(rawDescription: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const activeTimer = await getActiveTimer();
  if (activeTimer) throw new Error("You already have an active timer");

  const row: {
    userId: string;
    description: string;
    linearTaskId?: string;
  } = {
    userId: session.user.id,
    description: rawDescription ?? "untitled",
  };

  const extractedId = await extractIssueId(rawDescription);
  if (extractedId && session.user.linearApiKey) {
    const linearClient = new LinearClient({
      apiKey: session.user.linearApiKey,
    });
    const issue = await linearClient.issue(extractedId);
    row.description = issue.title;
    row.linearTaskId = issue.identifier;
  }

  const [entry] = await db.insert(timeEntry).values(row).returning();

  revalidatePath("/time");
  return entry;
}

export async function stopTimer() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const activeTimer = await getActiveTimer();
  if (!activeTimer) throw new Error("No active timer found");

  const [updated] = await db
    .update(timeEntry)
    .set({ endedAt: new Date() })
    .where(eq(timeEntry.id, activeTimer.id))
    .returning();

  revalidatePath("/time");
  return updated;
}

export async function deleteTimeEntry(entryId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db
    .delete(timeEntry)
    .where(
      and(eq(timeEntry.id, entryId), eq(timeEntry.userId, session.user.id)),
    );

  revalidatePath("/time");
}

export async function getActiveTimer() {
  const session = await getSession();
  if (!session) return null;

  const [active] = await db
    .select()
    .from(timeEntry)
    .where(
      and(eq(timeEntry.userId, session.user.id), isNull(timeEntry.endedAt)),
    );

  return active;
}
