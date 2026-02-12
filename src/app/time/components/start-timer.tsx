"use client";

import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useRouter } from "next/navigation";
import { startTimer } from "../actions";
import { toast } from "sonner";

type FormData = {
  description: string;
};

export function StartTimer({ hasActiveTimer }: { hasActiveTimer: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await startTimer(data.description);
      reset();
      router.refresh();
      toast.success("Timer started");
    } catch (error) {
      console.error("Failed to start timer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start timer",
      );
    }
  };

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          placeholder="what are you working on?"
          {...register("description")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !hasActiveTimer) {
              void handleSubmit(onSubmit)();
            }
          }}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || hasActiveTimer}>
            {isSubmitting ? "starting..." : "start timer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
