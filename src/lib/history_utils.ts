export interface PodcastHistory {
  id: string;
  podcast_id: string;
  snapshot_date: string;
  dpn_score: number;
  rank: number;
  views_last_7_days: number;
  subscriber_count: number;
}

export interface HistoricalMetrics {
  peakRank: number | null;
  weeksInTop20: number;
  lastWeekRank: number | null;
  rankChange: number | null;
  isTrending: boolean;
  isNew: boolean;
}

/**
 * Calculates historical metrics for a podcast given its history and current rank.
 */
export function calculateHistoricalMetrics(
  history: PodcastHistory[],
  currentRank: number
): HistoricalMetrics {
  if (!history || history.length <= 1) {
    return {
      peakRank: currentRank,
      weeksInTop20: currentRank <= 20 ? 1 : 0,
      lastWeekRank: null,
      rankChange: null,
      isTrending: false,
      isNew: currentRank <= 100
    };
  }

  // Sort history by date descending (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
  );

  const today = new Date().toISOString().split('T')[0];
  const pastSnapshots = sortedHistory.filter(h => !h.snapshot_date.startsWith(today));
  
  const lastWeekSnapshot = pastSnapshots.length > 0 ? pastSnapshots[0] : null; // Most recent past snapshot
  
  // Calculate Peak Rank (lowest number is best)
  let peakRank = currentRank;
  for (const h of history) {
    if (h.rank < peakRank) {
      peakRank = h.rank;
    }
  }

  // Calculate Weeks in Top 20
  let weeksInTop20 = currentRank <= 20 ? 1 : 0;
  for (const h of history) {
    if (h.rank <= 20) {
      weeksInTop20++;
    }
  }

  // Calculate Rank Change
  const lastWeekRank = lastWeekSnapshot ? lastWeekSnapshot.rank : null;
  const rankChange = lastWeekRank ? lastWeekRank - currentRank : null; // Positive means moved up (e.g. 10 to 5 = +5)

  // Is Trending? (Moved up 3 or more spots)
  const isTrending = rankChange !== null && rankChange >= 3;

  // Is New? (In top 100 now, but wasn't in top 100 last week)
  const isNew = currentRank <= 100 && (!lastWeekRank || lastWeekRank > 100);

  return {
    peakRank,
    weeksInTop20,
    lastWeekRank,
    rankChange,
    isTrending,
    isNew
  };
}
