"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type ViewToggleProps = {
  currentView: "daily" | "weekly";
};

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = (view: ViewToggleProps["currentView"]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (view === "daily") params.delete("view");
    else params.set("view", view);

    const query = params.toString();
    router.push(query ? `/time?${query}` : "/time");
  };

  return (
    <div className="mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {currentView === "daily" ? "Daily" : "Weekly"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={currentView}
            onValueChange={(value) =>
              setView(value as ViewToggleProps["currentView"])
            }
          >
            <DropdownMenuRadioItem value="daily">Daily</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="weekly">Weekly</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
