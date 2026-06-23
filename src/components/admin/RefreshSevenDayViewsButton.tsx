"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

export function RefreshSevenDayViewsButton({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [isPending, setIsPending] = useState(false);

  const handleRefresh = async () => {
    const isConfirmed = window.confirm(
      "CAUTION: This may change the current podcast rankings.\n\n" +
      "The Ranker relies on calculating (Views Today) - (Views from 7 Days Ago). " +
      "When you press this button, the server loops through every approved podcast, calls the YouTube API to get their exact view count right at this second, and calculates the difference to create the '7 Day DPN Score' for the ranker.\n\n" +
      "When to use it: You should press this button right before you want the Ranker to be fully updated for the public (for example, every Monday morning).\n\n" +
      "Are you sure you want to proceed?"
    );

    if (isConfirmed) {
      setIsPending(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing views:", error);
        alert("Failed to refresh views.");
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div title="Caution: The Ranker relies on calculating (Views Today) - (Views from 7 Days Ago). Press this right before you want the Ranker to be fully updated for the public (e.g., every Monday morning).">
      <Button onClick={handleRefresh} variant="outline" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Refresh 7-Day Views
      </Button>
    </div>
  );
}
