"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Circle, RefreshCw, Scissors } from "lucide-react";
import { processRefreshPhase, batchRefreshAllPodcasts, purgeAllExistingShorts } from "@/app/actions/admin_refresh";

export function RefreshCycleStatusCard({ 
  cycle 
}: { 
  cycle: any 
}) {
  const [isPending, setIsPending] = useState(false);
  const [isBatchPending, setIsBatchPending] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [localCycle, setLocalCycle] = useState(cycle);

  const isActive = localCycle?.status === 'running';

  const handlePurgeShorts = async () => {
    if (!window.confirm("Disqualify all YouTube Shorts playlists from the ranker?")) return;
    setIsPurging(true);
    try {
      const res = await purgeAllExistingShorts();
      if (res.success) {
        alert(`Successfully purged ${res.count} Shorts playlists!`);
        window.location.reload();
      } else {
        alert("Failed to purge shorts: " + res.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsPurging(false);
    }
  };

  const handleBatchRefreshAll = async () => {
    const isConfirmed = window.confirm(
      "REFRESH ALL SHOWS IN ONE GO:\n\n" +
      "This will automatically purge shorts, recalculate scores for all active long-form shows using the calibrated formula, and discover Spotify/Apple links.\n\n" +
      "Proceed?"
    );
    if (!isConfirmed) return;

    setIsBatchPending(true);
    try {
      const res = await batchRefreshAllPodcasts();
      if (res.success) {
        alert(res.message || "Batch refresh started successfully in background!");
        window.location.reload();
      } else {
        alert("Refresh error: " + res.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsBatchPending(false);
    }
  };

  const handleStartCycle = async () => {
    const isConfirmed = window.confirm(
      "CAUTION: This will begin a 3-day phased refresh of the DPN Ranker.\n\n" +
      "Phase 1 (Top 500) will run immediately. Phases 2 and 3 will automatically run via background cron jobs on the following days to respect YouTube API limits.\n\n" +
      "Are you sure you want to proceed?"
    );

    if (isConfirmed) {
      setIsPending(true);
      try {
        const res = await processRefreshPhase();
        if (res.success) {
          alert(`Phase 1 Started!`);
          setLocalCycle({
            status: 'running',
            current_phase: 2,
            phase_1_completed: true,
            phase_2_completed: false,
            phase_3_completed: false
          });
        } else {
          alert("Failed to start refresh cycle: " + res.error);
        }
      } catch (error) {
        console.error("Error starting cycle:", error);
        alert("Failed to start refresh cycle.");
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="bg-muted/30 border border-border p-4 rounded-lg flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-sm">Ranker Controls & Refresh Cycle</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Execute a complete one-go batch refresh or initiate the automated 3-day phased cron cycle.
        </p>
      </div>

      <div className="flex gap-4 items-center w-full">
        <div className="flex items-center gap-1 text-xs">
          {localCycle?.phase_1_completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
          <span className={localCycle?.phase_1_completed ? "text-green-500 font-medium" : "text-muted-foreground"}>Phase 1 (Top 500)</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {localCycle?.phase_2_completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
          <span className={localCycle?.phase_2_completed ? "text-green-500 font-medium" : "text-muted-foreground"}>Phase 2 (501-1000)</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {localCycle?.phase_3_completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
          <span className={localCycle?.phase_3_completed ? "text-green-500 font-medium" : "text-muted-foreground"}>Phase 3 (1001+)</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={handleBatchRefreshAll} variant="default" size="sm" disabled={isBatchPending || isPending}>
          {isBatchPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isBatchPending ? "Refreshing All..." : "Refresh All in One Go"}
        </Button>

        <Button onClick={handlePurgeShorts} variant="outline" size="sm" disabled={isPurging}>
          {isPurging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scissors className="mr-2 h-4 w-4 text-red-500" />}
          Purge Shorts
        </Button>

        <Button onClick={handleStartCycle} variant="outline" size="sm" disabled={isPending || isActive || isBatchPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isActive ? "Cycle in Progress" : "Start Phased 3-Day Cycle"}
        </Button>
      </div>
    </div>
  );
}
