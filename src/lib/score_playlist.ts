export interface PlaylistScoreInput {
  playlist_id: string;
  total_episodes: number;
  latest_episode_date: string | null;
  average_days_between_episodes: number | null;
  total_views: number;
  average_views_per_episode: number;
  average_likes_per_episode: number;
  average_comments_per_episode: number;
  manual_boost: number;
  manual_penalty: number;
  show_name: string;
  description: string;
}

export interface ScoreBreakdown {
  engagement: number;
  freshness: number;
  depth: number;
  consistency: number;
  confidence: number;
}

export interface Explanations {
  positive: string[];
  negative: string[];
}

export interface ScoreOutput {
  final_score: number;
  breakdown: ScoreBreakdown;
  explanations: Explanations;
}

export function calculatePlaylistScore(input: PlaylistScoreInput): ScoreOutput {
  const WEIGHTS = {
    engagement: 0.40,
    freshness: 0.25,
    depth: 0.15,
    consistency: 0.10,
    confidence: 0.10
  };

  const explanations: Explanations = { positive: [], negative: [] };

  // 1. Engagement Score (0-100)
  // Proxy using average views, log normalized
  // Let's say 100k avg views = 100 score
  let engagementScore = 0;
  if (input.average_views_per_episode > 0) {
    const maxLog = Math.log10(100000);
    const viewLog = Math.log10(input.average_views_per_episode);
    engagementScore = Math.min((viewLog / maxLog) * 100, 100);
  }
  if (engagementScore > 80) explanations.positive.push("Exceptionally high average viewership per episode.");
  else if (engagementScore < 20) explanations.negative.push("Low average engagement per episode.");

  // 2. Freshness Score (0-100)
  let freshnessScore = 0;
  if (input.latest_episode_date) {
    const daysSinceLast = (new Date().getTime() - new Date(input.latest_episode_date).getTime()) / (1000 * 3600 * 24);
    // Decay: 100 - (days * 1.5). 0 if > 66 days.
    freshnessScore = Math.max(0, 100 - (daysSinceLast * 1.5));
    
    if (freshnessScore > 90) explanations.positive.push("Very recent publishing activity.");
    else if (freshnessScore < 30) explanations.negative.push("Has not published an episode recently.");
  } else {
    explanations.negative.push("No recent episode data available.");
  }

  // 3. Catalog Depth (0-100)
  // Max out at 50 episodes
  let depthScore = Math.min((input.total_episodes / 50) * 100, 100);
  if (depthScore === 100) explanations.positive.push("Deep and robust catalog of episodes.");
  else if (depthScore < 20) explanations.negative.push("Very shallow catalog, requires more episodes to build authority.");

  // 4. Consistency Score (0-100)
  let consistencyScore = 0;
  if (input.average_days_between_episodes && input.average_days_between_episodes > 0) {
    // Ideal is between 3 and 14 days
    if (input.average_days_between_episodes >= 3 && input.average_days_between_episodes <= 14) {
      consistencyScore = 100;
    } else if (input.average_days_between_episodes < 3) {
      consistencyScore = 80; // High frequency, maybe overwhelming
    } else {
      // Penalty for very sparse releases
      consistencyScore = Math.max(0, 100 - ((input.average_days_between_episodes - 14) * 2));
    }
    
    if (consistencyScore > 80) explanations.positive.push("Consistent and healthy publishing cadence.");
    else explanations.negative.push("Inconsistent or overly sparse publishing schedule.");
  }

  // 5. Confidence Score (0-100)
  // Does it look like a podcast?
  let confidenceScore = 50; // base assumption
  const textToSearch = `${input.show_name} ${input.description}`.toLowerCase();
  const podcastKeywords = ['podcast', 'episode', 'show', 'host', 'season', 'listen', 'audio', 'interview', 'talk', 'series'];
  let matches = 0;
  for (const keyword of podcastKeywords) {
    if (textToSearch.includes(keyword)) matches++;
  }
  confidenceScore = Math.min(50 + (matches * 10), 100);
  if (confidenceScore > 80) explanations.positive.push("High confidence this is a dedicated podcast show based on metadata.");
  else if (confidenceScore < 60) explanations.negative.push("Low metadata confidence; may be a generic playlist rather than a podcast.");

  // Final Calculation
  const breakdown: ScoreBreakdown = {
    engagement: Number(engagementScore.toFixed(2)),
    freshness: Number(freshnessScore.toFixed(2)),
    depth: Number(depthScore.toFixed(2)),
    consistency: Number(consistencyScore.toFixed(2)),
    confidence: Number(confidenceScore.toFixed(2))
  };

  let finalScore = (
    (breakdown.engagement * WEIGHTS.engagement) +
    (breakdown.freshness * WEIGHTS.freshness) +
    (breakdown.depth * WEIGHTS.depth) +
    (breakdown.consistency * WEIGHTS.consistency) +
    (breakdown.confidence * WEIGHTS.confidence)
  );

  // Apply overrides
  finalScore = finalScore + input.manual_boost - input.manual_penalty;
  
  // Cap between 0 and 100
  finalScore = Math.max(0, Math.min(100, finalScore));

  return {
    final_score: Number(finalScore.toFixed(2)),
    breakdown,
    explanations
  };
}
