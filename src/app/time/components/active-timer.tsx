"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useRouter } from "next/navigation";
import { stopTimer } from "../actions";
import { toast } from "sonner";
import prettyMilliseconds from "pretty-ms";

export function ActiveTimer({
  entry,
}: {
  entry: {
    id: number;
    description: string | null;
    startedAt: Date;
  } | null;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!entry) {
      setElapsed(0);
      return;
    }

    const calculateElapsed = () => {
      const now = new Date();
      const start = new Date(entry.startedAt);
      return Math.floor((now.getTime() - start.getTime()) / 1000) * 1000;
    };

    setElapsed(calculateElapsed());

    const interval = setInterval(() => setElapsed(calculateElapsed()), 1000);

    return () => clearInterval(interval);
  }, [entry]);

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopTimer();
      router.refresh();
      toast.success("Timer stopped");
    } catch (error) {
      console.error("Failed to stop timer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to stop timer",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <Card className="border-primary/50 bg-primary/5 mb-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground mb-1 text-sm">active timer</p>
          <p className="font-light">{entry.description ?? "untitled"}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-2xl font-medium">
            {prettyMilliseconds(elapsed, { colonNotation: true })}
          </span>
          <Button
            variant="destructive"
            onClick={handleStop}
            disabled={isLoading}
          >
            {isLoading ? "stopping..." : "stop"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
