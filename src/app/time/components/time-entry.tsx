"use client";

import { Button } from "~/components/ui/button";
import type { TimeEntryData } from "~/server/db/schema";
import { deleteTimeEntry } from "../actions";
import { Card } from "~/components/ui/card";
import prettyMilliseconds from "pretty-ms";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const TIME_FORMAT = "MMM D, h:mm:ss A";

type TimeEntry = TimeEntryData & {
  linearTaskUrl?: string;
};

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  return prettyMilliseconds(ms, { verbose: true, unitCount: 2 });
}

export default function TimeEntry({ entry }: { entry: TimeEntry }) {
  const startedAt = dayjs(entry.startedAt).format(TIME_FORMAT);
  const endedAt = dayjs(entry.endedAt).format(TIME_FORMAT);

  return (
    <Card key={entry.id} className="hover:bg-accent/50 p-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-light">{entry.description}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {startedAt} - {endedAt}
          </p>
          {entry.linearTaskUrl && (
            <p className="text-muted-foreground mt-1 text-xs hover:underline">
              <a href={entry.linearTaskUrl}>View on Linear</a>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {formatDuration(entry.startedAt, entry.endedAt ?? new Date())}
          </span>
          <form action={deleteTimeEntry.bind(null, entry.id)}>
            <Button variant="ghost" size="sm" type="submit">
              ×
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
